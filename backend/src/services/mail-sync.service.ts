import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { db, queries } from '../db/database';
import { decryptPassword } from '../utils/crypto';
import { generateId } from '../utils/crypto';

interface MailAccount {
  id: string;
  user_id: string;
  email: string;
  imap_username: string;
  imap_password_encrypted: string;
  imap_host: string;
  imap_port: number;
  last_synced_at: string | null;
}

interface EmailData {
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  date: Date;
  html?: string;
  text?: string;
  headers: any;
  attachments: any[];
}

export class MailSyncService {
  private activeConnections: Map<string, ImapFlow> = new Map();

  // Sync emails for a specific mail account
  async syncMailAccount(accountId: string): Promise<void> {
    const account = queries.mailAccounts.findById.get({ $id: accountId }) as MailAccount;
    if (!account) {
      throw new Error('Mail account not found');
    }

    try {
      // Decrypt IMAP password
      const password = await decryptPassword(account.imap_password_encrypted);
      
      // Sync with IMAP
      const messageCount = await this.syncWithImap(account, password);
      
      // Update last synced timestamp
      queries.mailAccounts.updateLastSynced.run({ $id: accountId });
      
      console.log(`✅ Synced ${messageCount} messages for account: ${account.email}`);
    } catch (error) {
      console.error(`❌ Failed to sync account ${account.email}:`, error);
      throw error;
    }
  }

  // Sync all mail accounts in the system
  async syncAllAccounts(): Promise<void> {
    console.log('Starting mail sync...');
    
    // Get all mail accounts, not user emails
    const accounts = db.prepare(`
      SELECT * FROM mail_accounts 
      WHERE imap_password_encrypted IS NOT NULL
    `).all() as MailAccount[];

    if (accounts.length === 0) {
      console.log('No mail accounts found to sync');
      return;
    }

    const syncPromises = accounts.map(account => 
      this.syncMailAccount(account.id).catch(error => {
        console.error(`Failed to sync account ${account.email}:`, error.message);
      })
    );

    await Promise.all(syncPromises);
    console.log('Mail sync completed');
  }

  // Private method to handle IMAP connection and sync using ImapFlow
  private async syncWithImap(account: MailAccount, password: string): Promise<number> {
    let client: ImapFlow | null = null;
    let messagesProcessed = 0;

    try {
      // Create ImapFlow client
      client = new ImapFlow({
        host: account.imap_host,
        port: account.imap_port,
        secure: true,
        auth: {
          user: account.imap_username,
          pass: password
        },
        logger: false,
        tls: {
          rejectUnauthorized: false
        }
      });

      // Connect to IMAP server
      await client.connect();

      // Get mailbox lock for INBOX
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        // Ensure mailbox is properly selected
        if (!client.mailbox || typeof client.mailbox === 'boolean') {
          throw new Error('Failed to select INBOX mailbox');
        }

        // If mailbox empty, skip to avoid invalid FETCH
        if (client.mailbox.exists === 0) {
          console.log(`No messages found in ${account.email}, skipping.`);
          return messagesProcessed;
        }

        // For now, let's use a simpler approach: fetch recent messages (last 100)
        // This avoids issues with 'since' search not working properly on some IMAP servers
        const totalMessages = client.mailbox.exists;
        const startSeq = Math.max(1, totalMessages - 99); // Get last 100 messages
        
        console.log(`Fetching messages ${startSeq}-${totalMessages} in ${account.email} (total: ${totalMessages})`);
        
        // Fetch recent messages by sequence number
        for await (const message of client.fetch(`${startSeq}:*`, { 
          source: true,
          envelope: true,
          bodyStructure: true,
          uid: true
        })) {
          try {
            if (message.source) {
              // Parse the raw email source
              const parsed = await simpleParser(message.source);
              await this.saveEmail(account.id, parsed);
              messagesProcessed++;
            }
          } catch (parseError) {
            console.error(`Failed to parse message ${message.uid}:`, parseError);
          }
        }

        console.log(`Processed ${messagesProcessed} messages for ${account.email}`);

      } finally {
        // Always release the lock
        lock.release();
      }

    } catch (error: any) {
      console.error(`IMAP sync error for ${account.email}:`, error.message);
      throw error;
    } finally {
      // Clean up connection
      if (client) {
        try {
          await client.logout();
        } catch (logoutError) {
          console.warn(`Warning: Could not properly logout IMAP connection for ${account.email}:`, logoutError);
        }
      }
    }

    return messagesProcessed;
  }

  // Save email to database
  private async saveEmail(accountId: string, parsedMail: any): Promise<void> {
    // Try to get the real message ID from various sources
    let messageId = parsedMail.messageId;
    
    // If no messageId in parsed mail, try headers
    if (!messageId && parsedMail.headers) {
      messageId = parsedMail.headers.get('message-id') || 
                 parsedMail.headers.get('Message-ID') ||
                 parsedMail.headers.get('Message-Id');
    }
    
    // If still no messageId, create a deterministic ID based on email content
    if (!messageId) {
      const from = this.extractAddress(parsedMail.from);
      const subject = parsedMail.subject || '';
      const date = parsedMail.date ? parsedMail.date.toISOString() : new Date().toISOString();
      // Create a hash-like deterministic ID
      messageId = `${from}:${subject}:${date}`.replace(/[^a-zA-Z0-9@.-]/g, '_');
      console.warn(`No messageId found, using deterministic ID: ${messageId}`);
    }
    
    // Check if email already exists
    const existing = queries.emails.findByMessageId.get({ $message_id: messageId });
    if (existing) {
      console.log(`Email already exists: ${messageId}`);
      return;
    }

    // Extract email data
    const emailData: EmailData = {
      messageId,
      inReplyTo: parsedMail.inReplyTo,
      references: parsedMail.references || [],
      from: this.extractAddress(parsedMail.from),
      to: this.extractAddresses(parsedMail.to),
      cc: this.extractAddresses(parsedMail.cc),
      bcc: this.extractAddresses(parsedMail.bcc),
      subject: parsedMail.subject || '',
      date: parsedMail.date || new Date(),
      html: parsedMail.html || '',
      text: parsedMail.text || '',
      headers: parsedMail.headers,
      attachments: parsedMail.attachments || [],
    };

    // Find or create thread
    let threadId: string | null = null;
    const references = emailData.references || [];
    
    if (emailData.inReplyTo || references.length > 0) {
      const referenceId = emailData.inReplyTo || references[0];
      if (referenceId) {
        const parentEmail = queries.emails.findByMessageId.get({ $message_id: referenceId }) as any;
        if (parentEmail && parentEmail.thread_id) {
          threadId = parentEmail.thread_id;
        }
      }
    }

    if (!threadId && emailData.subject) {
      // Create new thread
      threadId = generateId();
      const account = queries.mailAccounts.findById.get({ $id: accountId }) as MailAccount;
      
      db.prepare(`
        INSERT INTO mail_threads (id, user_id, subject, last_message_at)
        VALUES ($id, $user_id, $subject, $last_message_at)
      `).run({
        $id: threadId,
        $user_id: account.user_id,
        $subject: emailData.subject,
        $last_message_at: emailData.date.toISOString(),
      });
    }

    // Save email
    const emailId = generateId();
    queries.emails.create.run({
      $id: emailId,
      $mail_account_id: accountId,
      $thread_id: threadId,
      $message_id: emailData.messageId,
      $in_reply_to: emailData.inReplyTo || null,
      $email_references: JSON.stringify(emailData.references),
      $from_address: emailData.from,
      $to_addresses: JSON.stringify(emailData.to),
      $cc_addresses: JSON.stringify(emailData.cc || []),
      $bcc_addresses: JSON.stringify(emailData.bcc || []),
      $subject: emailData.subject,
      $content_html: emailData.html || '',
      $content_text: emailData.text || '',
      $folder: 'INBOX',
      $is_read: 0,
      $date: emailData.date.toISOString(),
      $raw_headers: JSON.stringify(emailData.headers),
    });

    // TODO: Save attachments if needed
    // for (const attachment of emailData.attachments) {
    //   // Save attachment logic
    // }
  }

  // Helper method to extract email address from various formats
  private extractAddress(field: any): string {
    if (!field) return '';

    // If already string
    if (typeof field === 'string') return field;

    // AddressObject from mailparser: { address, name }
    if (field.address) {
      return field.address;
    }

    // AddressObject list from mailparser: { value: [{ address, name }, ...] }
    if (Array.isArray(field.value) && field.value.length > 0) {
      const first = field.value[0];
      return first.address;
    }

    // If it's an array of address objects directly
    if (Array.isArray(field) && field.length > 0) {
      const first = field[0];
      if (typeof first === 'string') return first;
      if (first.address) {
        return first.address;
      }
    }

    return '';
  }

  // Helper method to extract multiple email addresses
  private extractAddresses(field: any): string[] {
    if (!field) return [];

    if (typeof field === 'string') return [field];

    // AddressObject with address property
    if (field.address) return [field.address];

    // AddressObject list
    if (Array.isArray(field.value)) {
      return field.value.map((v: any) => v.address || '').filter(Boolean);
    }

    // Array of address objects or strings
    if (Array.isArray(field)) {
      return field.map((addr: any) => (typeof addr === 'string' ? addr : addr.address)).filter(Boolean);
    }

    return [];
  }

  // Clean up all active connections
  async closeAllConnections(): Promise<void> {
    const connections = Array.from(this.activeConnections.values());
    this.activeConnections.clear();

    const closePromises = connections.map(async (client) => {
      try {
        await client.logout();
      } catch (error) {
        console.warn('Error closing IMAP connection:', error);
      }
    });

    await Promise.all(closePromises);
    console.log('All IMAP connections closed');
  }
} 