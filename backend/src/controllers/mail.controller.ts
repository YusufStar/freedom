import type { AuthContext } from '../middleware/auth.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { MailSyncService } from '../services/mail-sync.service';
import { MailcowService } from '../services/mailcow.service';
import { IMAPVerificationService } from '../services/imap-verification.service';
import { queries, db } from '../db/database';
import { encryptPassword, generateId } from '../utils/crypto';

export class MailController {
  private mailSyncService: MailSyncService;
  private mailcowService: MailcowService;
  private imapVerificationService: IMAPVerificationService;

  constructor() {
    this.mailSyncService = new MailSyncService();
    this.mailcowService = new MailcowService();
    this.imapVerificationService = new IMAPVerificationService();
  }

  async createMailboxAndConnect(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAuth(authContext);
      
      const body = await req.json() as { 
        localPart: string; 
        password: string; 
        name: string;
      };
      const { localPart, password, name } = body;

      if (!localPart || !password || !name) {
        return new Response(JSON.stringify({ error: 'Missing required fields: localPart, password, name' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate local part (only alphanumeric and common email characters)
      const localPartRegex = /^[a-zA-Z0-9._-]+$/;
      if (!localPartRegex.test(localPart)) {
        return new Response(JSON.stringify({ error: 'Invalid local part. Only letters, numbers, dots, underscores and hyphens allowed.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const email = `${localPart}@yusufstar.com`;
      const imapHost = 'mail.yusufstar.com';
      const smtpHost = 'mail.yusufstar.com';
      const imapPort = 993;
      const smtpPort = 465;

      // Step 1: Check if account already exists in our database
      const existingAccount = db.prepare("SELECT * FROM mail_accounts WHERE email = ? AND user_id = ?")
        .get(email, authContext.user!.id);
      
      if (existingAccount) {
        return new Response(JSON.stringify({ error: 'Mail account already exists for this user' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Step 2: Create mailbox in Mailcow
      console.log(`Creating Mailcow mailbox: ${email}`);
      try {
        const mailcowResponse = await this.mailcowService.createMailbox(
          localPart,
          password,
          name,
          3072 // 3GB quota
        );

        console.log('Mailcow mailbox creation response:', mailcowResponse);
        
        // Check if creation was successful
        const isSuccess = mailcowResponse.some(response => 
          response.type === 'success' && 
          response.msg && 
          response.msg.includes('mailbox_added')
        );

        if (!isSuccess) {
          const errorMsg = mailcowResponse.find(r => r.type === 'danger')?.msg?.join(', ') || 'Unknown Mailcow error';
          return new Response(JSON.stringify({ error: `Mailbox creation failed: ${errorMsg}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (mailcowError: any) {
        console.error('Mailcow API error:', mailcowError);
        return new Response(JSON.stringify({ error: `Mailbox creation failed: ${mailcowError.message}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Step 3: Verify IMAP credentials (wait a bit for mailbox to be ready)
      console.log(`Verifying IMAP credentials for: ${email}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const verification = await this.imapVerificationService.verifyIMAPCredentials(
        email,
        password,
        imapHost,
        imapPort
      );

      if (!verification.success) {
        console.error('IMAP verification failed:', verification.error);
        // Try to delete the mailbox from Mailcow if IMAP verification fails
        try {
          await this.mailcowService.deleteMailbox(email);
        } catch (deleteError) {
          console.error('Failed to cleanup mailbox after IMAP verification failure:', deleteError);
        }
        
        return new Response(JSON.stringify({ 
          error: `IMAP verification failed: ${verification.error}. Mailbox has been removed.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Step 4: Encrypt password and save to database
      const encryptedPassword = await encryptPassword(password);
      const accountId = generateId();

      queries.mailAccounts.create.run({
        $id: accountId,
        $user_id: authContext.user!.id,
        $email: email,
        $imap_username: email,
        $imap_password_encrypted: encryptedPassword,
        $imap_host: imapHost,
        $imap_port: imapPort,
        $smtp_host: smtpHost,
        $smtp_port: smtpPort,
        $mailcow_mailbox_id: email, // Use email as mailbox ID
      });

      console.log(`✅ Successfully created and connected mailbox: ${email}`);

      return new Response(JSON.stringify({ 
        id: accountId, 
        email: email,
        message: 'Mailbox created and connected successfully' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('Error in createMailboxAndConnect:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async connectExistingMailbox(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAuth(authContext);
      
      const body = await req.json() as { 
        email: string; 
        password: string; 
      };
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Missing required fields: email, password' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Only allow @yusufstar.com emails
      if (!email.endsWith('@yusufstar.com')) {
        return new Response(JSON.stringify({ error: 'Only @yusufstar.com email addresses are allowed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const imapHost = 'mail.yusufstar.com';
      const smtpHost = 'mail.yusufstar.com';
      const imapPort = 993;
      const smtpPort = 465;

      // Check if account already exists
      const existingAccount = db.prepare("SELECT * FROM mail_accounts WHERE email = ? AND user_id = ?")
        .get(email, authContext.user!.id);
      
      if (existingAccount) {
        return new Response(JSON.stringify({ error: 'Mail account already connected to this user' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify IMAP credentials
      console.log(`Verifying IMAP credentials for existing mailbox: ${email}`);
      const verification = await this.imapVerificationService.verifyIMAPCredentials(
        email,
        password,
        imapHost,
        imapPort
      );

      if (!verification.success) {
        return new Response(JSON.stringify({ 
          error: `IMAP verification failed: ${verification.error}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Encrypt password and save to database
      const encryptedPassword = await encryptPassword(password);
      const accountId = generateId();

      queries.mailAccounts.create.run({
        $id: accountId,
        $user_id: authContext.user!.id,
        $email: email,
        $imap_username: email,
        $imap_password_encrypted: encryptedPassword,
        $imap_host: imapHost,
        $imap_port: imapPort,
        $smtp_host: smtpHost,
        $smtp_port: smtpPort,
        $mailcow_mailbox_id: email,
      });

      console.log(`✅ Successfully connected existing mailbox: ${email}`);

      return new Response(JSON.stringify({ 
        id: accountId, 
        email: email,
        message: 'Existing mailbox connected successfully' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('Error in connectExistingMailbox:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Keep the old addAccount method for backward compatibility but restrict it
  async addAccount(req: Request, authContext: AuthContext): Promise<Response> {
    return new Response(JSON.stringify({ 
      error: 'This endpoint is deprecated. Use /api/mailbox/create or /api/mailbox/connect instead.' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async listAccounts(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAuth(authContext);
      
      const accounts = queries.mailAccounts.findByUserId.all({ 
        $user_id: authContext.user!.id 
      }) as any[];

      const accountList = accounts.map(acc => ({
        id: acc.id,
        email: acc.email,
        imapHost: acc.imap_host,
        imapPort: acc.imap_port,
        smtpHost: acc.smtp_host,
        smtpPort: acc.smtp_port,
        lastSyncedAt: acc.last_synced_at,
        createdAt: acc.created_at,
      }));

      return new Response(JSON.stringify(accountList), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async listEmails(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAuth(authContext);
      
      const url = new URL(req.url);
      const accountId = url.searchParams.get('accountId');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!accountId) {
        return new Response(JSON.stringify({ error: 'Missing accountId parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify account belongs to user
      const account = queries.mailAccounts.findById.get({ $id: accountId }) as any;
      if (!account || account.user_id !== authContext.user!.id) {
        return new Response(JSON.stringify({ error: 'Account not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const emails = queries.emails.findByAccountId.all({
        $mail_account_id: accountId,
        $limit: limit,
        $offset: offset,
      }) as any[];

      const emailList = emails.map(email => ({
        id: email.id,
        messageId: email.message_id,
        from: email.from_address,
        to: JSON.parse(email.to_addresses || '[]'),
        cc: JSON.parse(email.cc_addresses || '[]'),
        subject: email.subject,
        date: email.date,
        isRead: Boolean(email.is_read),
        isStarred: Boolean(email.is_starred),
        folder: email.folder,
      }));

      return new Response(JSON.stringify(emailList), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async getEmail(req: Request, authContext: AuthContext, emailId: string): Promise<Response> {
    try {
      requireAuth(authContext);
      
      const email = db.prepare(`
        SELECT e.*, ma.user_id 
        FROM emails e 
        JOIN mail_accounts ma ON e.mail_account_id = ma.id 
        WHERE e.id = ? AND ma.user_id = ?
      `).get(emailId, authContext.user!.id) as any;

      if (!email) {
        return new Response(JSON.stringify({ error: 'Email not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Mark as read
      queries.emails.markAsRead.run({ $id: emailId });

      const emailData = {
        id: email.id,
        messageId: email.message_id,
        from: email.from_address,
        to: JSON.parse(email.to_addresses || '[]'),
        cc: JSON.parse(email.cc_addresses || '[]'),
        bcc: JSON.parse(email.bcc_addresses || '[]'),
        subject: email.subject,
        contentHtml: email.content_html,
        contentText: email.content_text,
        date: email.date,
        isRead: true,
        isStarred: Boolean(email.is_starred),
        folder: email.folder,
      };

      return new Response(JSON.stringify(emailData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async syncMail(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAuth(authContext);
      
      const body = await req.json() as { accountId?: string };
      const { accountId } = body;

      if (accountId) {
        await this.mailSyncService.syncMailAccount(accountId);
      } else {
        await this.mailSyncService.syncAllAccounts();
      }

      return new Response(JSON.stringify({ message: 'Sync started' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * Get number of email threads for a specific account + folder (tab)
   * Route: GET /api/threads/count?accountId=xxx&folder=inbox
   */
  async getThreadCount(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAuth(authContext);

      const url = new URL(req.url);
      const accountId = url.searchParams.get("accountId");
      const folderParam = url.searchParams.get("folder") || "inbox"; // default inbox

      if (!accountId) {
        return new Response(JSON.stringify({ error: "Missing accountId parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify ownership of account
      const account = queries.mailAccounts.findById.get({ $id: accountId }) as any;
      if (!account || account.user_id !== authContext.user!.id) {
        return new Response(JSON.stringify({ error: "Account not found or unauthorized" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Map folder param to actual folder value stored in DB
      const folderMap: Record<string, string> = {
        inbox: "INBOX",
        drafts: "Drafts",
        sent: "Sent",
        trash: "Trash",
      };

      const folder = folderMap[folderParam.toLowerCase()] || folderParam;

      // If folder is "all", count across folders
      let count: number;
      if (folder.toLowerCase() === "all") {
        const stmt = db.prepare(
          `SELECT COUNT(DISTINCT COALESCE(thread_id, id)) as cnt FROM emails WHERE mail_account_id = ?`
        );
        const row = stmt.get(accountId) as any;
        count = row?.cnt || 0;
      } else {
        const stmt = db.prepare(
          `SELECT COUNT(DISTINCT COALESCE(thread_id, id)) as cnt FROM emails WHERE mail_account_id = ? AND folder = ?`
        );
        const row = stmt.get(accountId, folder) as any;
        count = row?.cnt || 0;
      }

      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Error in getThreadCount:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 