import { Database } from "bun:sqlite";
import { config } from "../config/config";
import { mkdirSync } from "fs";
import { dirname } from "path";

// Ensure data directory exists
try {
  mkdirSync(dirname(config.database.url), { recursive: true });
} catch (e) {
  // Directory might already exist
}

// Create database instance
export const db = new Database(config.database.url, { create: true });

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Initialize database schema
export function initializeDatabase() {
  // Enable foreign keys
  db.exec("PRAGMA foreign_keys = ON");
  
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Mail accounts table
  db.run(`
    CREATE TABLE IF NOT EXISTS mail_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      imap_username TEXT NOT NULL,
      imap_password_encrypted TEXT NOT NULL,
      imap_host TEXT NOT NULL,
      imap_port INTEGER NOT NULL DEFAULT 993,
      smtp_host TEXT NOT NULL,
      smtp_port INTEGER NOT NULL DEFAULT 465,
      mailcow_mailbox_id TEXT,
      last_synced_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Mail threads table
  db.run(`
    CREATE TABLE IF NOT EXISTS mail_threads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT,
      last_message_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Emails table
  db.run(`
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      mail_account_id TEXT NOT NULL,
      thread_id TEXT,
      message_id TEXT UNIQUE NOT NULL,
      in_reply_to TEXT,
      email_references TEXT,
      from_address TEXT NOT NULL,
      to_addresses TEXT NOT NULL,
      cc_addresses TEXT,
      bcc_addresses TEXT,
      subject TEXT,
      content_html TEXT,
      content_text TEXT,
      folder TEXT NOT NULL DEFAULT 'INBOX',
      is_read BOOLEAN DEFAULT 0,
      is_starred BOOLEAN DEFAULT 0,
      date DATETIME NOT NULL,
      raw_headers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Attachments table
  db.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      email_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      content_id TEXT,
      storage_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Session tokens table for JWT refresh
  db.run(`
    CREATE TABLE IF NOT EXISTS session_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sync logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      mail_account_id TEXT NOT NULL,
      status TEXT NOT NULL,
      messages_synced INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME NOT NULL,
      completed_at DATETIME
    )
  `);

  // Create indexes for better performance
  db.run("CREATE INDEX IF NOT EXISTS idx_emails_mail_account_id ON emails(mail_account_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date DESC)");
  db.run("CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder)");
  db.run("CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_sync_logs_mail_account_id ON sync_logs(mail_account_id)");

  console.log("Database initialized successfully");
}

// Lazy-loaded queries
export const queries = {
  users: {
    get create() {
      return db.prepare(`
        INSERT INTO users (id, email, password_hash, name, is_admin)
        VALUES ($id, $email, $password_hash, $name, $is_admin)
      `);
    },
    get findByEmail() {
      return db.prepare("SELECT * FROM users WHERE email = $email");
    },
    get findById() {
      return db.prepare("SELECT * FROM users WHERE id = $id");
    },
    get update() {
      return db.prepare(`
        UPDATE users 
        SET email = $email, name = $name, updated_at = CURRENT_TIMESTAMP
        WHERE id = $id
      `);
    },
  },
  mailAccounts: {
    get create() {
      return db.prepare(`
        INSERT INTO mail_accounts (
          id, user_id, email, imap_username, imap_password_encrypted,
          imap_host, imap_port, smtp_host, smtp_port, mailcow_mailbox_id
        ) VALUES (
          $id, $user_id, $email, $imap_username, $imap_password_encrypted,
          $imap_host, $imap_port, $smtp_host, $smtp_port, $mailcow_mailbox_id
        )
      `);
    },
    get findByUserId() {
      return db.prepare("SELECT * FROM mail_accounts WHERE user_id = $user_id");
    },
    get findById() {
      return db.prepare("SELECT * FROM mail_accounts WHERE id = $id");
    },
    get updateLastSynced() {
      return db.prepare(`
        UPDATE mail_accounts 
        SET last_synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $id
      `);
    },
  },
  emails: {
    get create() {
      return db.prepare(`
        INSERT INTO emails (
          id, mail_account_id, thread_id, message_id, in_reply_to, email_references,
          from_address, to_addresses, cc_addresses, bcc_addresses, subject,
          content_html, content_text, folder, is_read, date, raw_headers
        ) VALUES (
          $id, $mail_account_id, $thread_id, $message_id, $in_reply_to, $email_references,
          $from_address, $to_addresses, $cc_addresses, $bcc_addresses, $subject,
          $content_html, $content_text, $folder, $is_read, $date, $raw_headers
        )
      `);
    },
    get findByAccountId() {
      return db.prepare(`
        SELECT * FROM emails 
        WHERE mail_account_id = $mail_account_id 
        ORDER BY date DESC 
        LIMIT $limit OFFSET $offset
      `);
    },
    get findByMessageId() {
      return db.prepare("SELECT * FROM emails WHERE message_id = $message_id");
    },
    get markAsRead() {
      return db.prepare(`
        UPDATE emails 
        SET is_read = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $id
      `);
    },
  },
}; 