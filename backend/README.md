# Freedom Mail Backend - Yusufstar.com Mail System

## Overview

A high-performance mail backend system built with **Bun.js** that manages email accounts exclusively for the **@yusufstar.com** domain. The system integrates with Mailcow for mailbox management and uses **ImapFlow** for modern, efficient IMAP operations.

### Key Features

- **Domain Restriction**: Only supports @yusufstar.com email addresses
- **Mailcow Integration**: Automatic mailbox creation and management
- **Modern IMAP**: Uses ImapFlow for Promise-based IMAP operations
- **Real-time Sync**: Automatic email synchronization every 30 seconds
- **JWT Authentication**: Secure user authentication and authorization
- **SQLite Database**: Fast, embedded database with optimized queries
- **CORS Support**: Cross-origin request handling

## System Architecture

### Mail Server Configuration
- **IMAP Host**: `mail.yusufstar.com`
- **IMAP Port**: `993` (SSL/TLS)
- **SMTP Host**: `mail.yusufstar.com`
- **SMTP Port**: `465` (SSL/TLS)
- **Domain**: `yusufstar.com` (fixed, no other domains allowed)

### Technology Stack
- **Runtime**: Bun.js v1.2.18+
- **Database**: SQLite with Bun's native SQL support
- **IMAP Client**: ImapFlow v1.0.189
- **Authentication**: JWT with Argon2 password hashing
- **Mail Parser**: mailparser for email content processing
- **API Integration**: Mailcow REST API

## Installation & Setup

### Prerequisites
- Bun.js v1.2.18 or higher
- Access to Mailcow server with API key
- Valid SSL certificates for mail.yusufstar.com

### Installation Steps

1. **Clone and Install Dependencies**
   ```bash
   cd backend
   bun install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp env.example .env
   ```

   **Required Environment Variables:**
   ```env
   # Server
   NODE_ENV=production
   PORT=8000

   # JWT Security (change in production!)
   JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
   JWT_EXPIRES_IN=7d

   # Database
   DATABASE_URL=./data/maildb.sqlite

   # Encryption (must be exactly 32 characters)
   ENCRYPTION_KEY=your-32-character-encryption-key

   # Mailcow API
   MAILCOW_API_URL=https://mail.yusufstar.com/api/v1
   MAILCOW_API_KEY=your-mailcow-api-key
   MAILCOW_DOMAIN=yusufstar.com

   # Admin
   ADMIN_EMAIL=07yusufstar@gmail.com

   # Sync
   SYNC_INTERVAL_SECONDS=30

   # CORS
   CORS_ORIGIN=*
   ```

3. **Database Initialization**
   ```bash
   bun run dev
   ```
   Database will be automatically created on first run.

4. **Production Start**
   ```bash
   bun run start
   ```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Mailbox Management
- `POST /api/mailbox/create` - Create new @yusufstar.com mailbox
- `POST /api/mailbox/connect` - Connect existing @yusufstar.com mailbox

### Mail Accounts
- `GET /api/accounts` - List user's connected mail accounts
- `POST /api/accounts` - ⚠️ DEPRECATED

### Email Operations
- `GET /api/emails` - List emails for account
- `GET /api/emails/:id` - Get email details
- `POST /api/sync` - Trigger manual sync

### Admin (requires admin privileges)
- `GET /api/admin/mailcow/*` - Mailcow management endpoints

## Mailbox Workflow

### 1. Create New Mailbox
```json
POST /api/mailbox/create
{
  "localPart": "john.doe",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

**Process:**
1. Validates `localPart` (alphanumeric, dots, underscores, hyphens only)
2. Creates mailbox in Mailcow: `john.doe@yusufstar.com`
3. Verifies IMAP credentials with ImapFlow
4. Adds account to user's profile
5. Starts automatic email synchronization

### 2. Connect Existing Mailbox
```json
POST /api/mailbox/connect
{
  "email": "existing@yusufstar.com",
  "password": "MailboxPassword"
}
```

**Process:**
1. Validates email ends with `@yusufstar.com`
2. Verifies IMAP credentials
3. Adds existing mailbox to user's account
4. Starts automatic email synchronization

## Email Synchronization

### Automatic Sync
- **Interval**: Every 30 seconds (configurable)
- **Method**: IMAP IDLE + periodic fetch
- **Scope**: All connected mailboxes
- **Storage**: SQLite with normalized schema

### Manual Sync
```json
POST /api/sync
{
  "accountId": "optional-account-uuid"
}
```

### Sync Process
1. **Connection**: ImapFlow connects to mail.yusufstar.com:993
2. **Authentication**: Uses encrypted stored credentials
3. **Message Fetch**: Downloads new messages since last sync
4. **Parsing**: mailparser extracts headers, content, attachments
5. **Storage**: Saves to SQLite with thread organization
6. **Cleanup**: Properly closes IMAP connections

## Database Schema

### Core Tables
- `users` - User accounts and authentication
- `mail_accounts` - Connected @yusufstar.com mailboxes
- `emails` - Email messages with full content
- `mail_threads` - Email conversation threading
- `attachments` - File attachments
- `session_tokens` - JWT refresh tokens
- `sync_logs` - Synchronization history

### Key Features
- **Thread Organization**: Automatic email threading by Message-ID
- **Efficient Indexing**: Optimized for fast email retrieval
- **Encrypted Storage**: Mail passwords encrypted with AES-256
- **Referential Integrity**: Proper foreign key relationships

## Security Features

### Authentication & Authorization
- **Password Hashing**: Argon2 for user passwords
- **JWT Tokens**: 7-day expiration with refresh capability
- **Admin Privileges**: Special access for `07yusufstar@gmail.com`

### Data Protection
- **Mail Password Encryption**: AES-256 encryption for IMAP credentials
- **TLS/SSL**: All mail connections use encryption
- **Domain Restriction**: Only @yusufstar.com addresses allowed
- **CORS Configuration**: Configurable cross-origin access

### IMAP Security
- **Credential Verification**: Real IMAP test before account creation
- **Connection Timeout**: 10-second timeout for verification
- **SSL Certificate Handling**: Supports self-signed certificates
- **Connection Cleanup**: Proper logout and resource cleanup

## Error Handling

### IMAP Errors
- **Authentication Failed**: Invalid credentials
- **Connection Timeout**: Server unreachable
- **SSL Certificate**: Certificate validation issues
- **Server Unavailable**: IMAP service down

### API Errors
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid JWT)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource missing)
- **500**: Internal Server Error

## Development

### Development Mode
```bash
bun run dev
```
Enables hot reloading and detailed logging.

### Type Checking
```bash
bun run type-check
```

### Linting
```bash
bun run lint
```

## Production Deployment

### Prerequisites
- Valid SSL certificates for mail.yusufstar.com
- Mailcow server with API access
- Process manager (PM2, systemd, etc.)

### Deployment Steps
1. Set `NODE_ENV=production` in `.env`
2. Generate secure `JWT_SECRET` and `ENCRYPTION_KEY`
3. Configure proper `CORS_ORIGIN`
4. Set up process monitoring
5. Configure log rotation
6. Set up database backups

### Performance Considerations
- **Connection Pooling**: ImapFlow manages connection efficiently
- **Database Optimization**: SQLite with proper indexing
- **Memory Management**: Automatic cleanup of IMAP connections
- **Error Recovery**: Graceful handling of connection failures

## Troubleshooting

### Common Issues

**IMAP Connection Failed**
- Check mail.yusufstar.com:993 accessibility
- Verify SSL certificates
- Check firewall rules

**Mailcow API Errors**
- Validate API key in Mailcow admin panel
- Check API URL accessibility
- Verify domain configuration

**Database Issues**
- Check file permissions for SQLite
- Verify disk space availability
- Check data directory creation

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## License

© 2024 - Private Mail System for yusufstar.com

---

For technical support or questions, contact the system administrator.