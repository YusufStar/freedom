import { ImapFlow } from 'imapflow';

export interface IMAPVerificationResult {
  success: boolean;
  error?: string;
}

export class IMAPVerificationService {
  async verifyIMAPCredentials(
    email: string,
    password: string,
    host: string = 'mail.yusufstar.com',
    port: number = 993
  ): Promise<IMAPVerificationResult> {
    let client: ImapFlow | null = null;
    
    try {
      // Create ImapFlow client instance
      client = new ImapFlow({
        host: host,
        port: port,
        secure: true, // Use TLS/SSL
        auth: {
          user: email,
          pass: password
        },
        logger: false, // Disable logging for verification
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      // Set connection timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('IMAP verification timeout (10 seconds)'));
        }, 10000);
      });

      // Connect and verify credentials
      const connectPromise = client.connect();
      
      // Race between connection and timeout
      await Promise.race([connectPromise, timeoutPromise]);

      // If we reach here, connection was successful
      console.log(`✅ IMAP verification successful for: ${email}`);
      
      return { success: true };

    } catch (error: any) {
      console.error(`❌ IMAP verification failed for ${email}:`, error.message);
      
      // Parse error message for better user feedback
      let errorMessage = error.message;
      
      if (errorMessage.includes('authentication failed') || errorMessage.includes('LOGIN failed')) {
        errorMessage = 'Invalid email or password';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Connection timeout - server may be unreachable';
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to mail server';
      } else if (errorMessage.includes('certificate')) {
        errorMessage = 'SSL certificate error';
      }

      return { 
        success: false, 
        error: errorMessage
      };

    } finally {
      // Always clean up the connection
      if (client) {
        try {
          await client.logout();
        } catch (logoutError) {
          // Ignore logout errors - connection might already be closed
          console.warn('Warning: Could not properly logout IMAP connection:', logoutError);
        }
      }
    }
  }

  /**
   * Test IMAP connection and get basic mailbox info
   * This is useful for more detailed verification
   */
  async testIMAPConnection(
    email: string,
    password: string,
    host: string = 'mail.yusufstar.com',
    port: number = 993
     ): Promise<{
     success: boolean;
     error?: string;
     mailboxInfo?: {
       exists: number;
     };
   }> {
    let client: ImapFlow | null = null;
    
    try {
      client = new ImapFlow({
        host: host,
        port: port,
        secure: true,
        auth: {
          user: email,
          pass: password
        },
        logger: false,
        tls: {
          rejectUnauthorized: false
        }
      });

      // Connect
      await client.connect();

      // Try to select INBOX to verify full access
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        // Ensure mailbox is properly selected
        if (!client.mailbox || typeof client.mailbox === 'boolean') {
          throw new Error('Failed to select INBOX mailbox');
        }

                 const mailboxInfo = {
           exists: client.mailbox.exists
         };

         console.log(`✅ IMAP test successful for ${email}: ${mailboxInfo.exists} messages in INBOX`);
        
        return { 
          success: true, 
          mailboxInfo 
        };
      } finally {
        lock.release();
      }

    } catch (error: any) {
      console.error(`❌ IMAP test failed for ${email}:`, error.message);
      
      return { 
        success: false, 
        error: error.message 
      };

    } finally {
      if (client) {
        try {
          await client.logout();
        } catch (logoutError) {
          console.warn('Warning: Could not properly logout IMAP test connection:', logoutError);
        }
      }
    }
  }
} 