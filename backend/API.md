# Freedom Mail Backend API Documentation

## Base URL
```
http://localhost:8000/api
```

## Architecture

The API uses **Bun.js native routes API** for improved performance with the following structure:
- **Controllers**: Handle business logic (Auth, Mail, Admin)
- **Services**: Core functionality (MailSync, Mailcow, IMAP verification, Auth)
- **Middleware**: JWT authentication and authorization
- **Database**: SQLite with optimized queries

## Authentication

All endpoints except `/register`, `/login`, and `/health` require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

## Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register User
```http
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "User Name"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "isAdmin": false
  },
  "token": "jwt-token-here"
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields"
}
```

### User Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "isAdmin": false
  },
  "token": "jwt-token-here"
}
```

**Error Response (400):**
```json
{
  "error": "Missing email or password"
}
```

---

## Mailbox Management (Yusufstar.com Only)

### 🆕 Create New Mailbox
```http
POST /api/mailbox/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "localPart": "john.doe",
  "password": "SecureMailboxPassword123",
  "name": "John Doe"
}
```

**Process:**
1. Creates mailbox `john.doe@yusufstar.com` in Mailcow
2. Verifies IMAP credentials with ImapFlow
3. Connects mailbox to user account
4. Starts automatic email synchronization

**Response (200):**
```json
{
  "id": "account-uuid",
  "email": "john.doe@yusufstar.com",
  "message": "Mailbox created and connected successfully"
}
```

**Local Part Rules:**
- Only alphanumeric characters, dots (.), underscores (_), and hyphens (-)
- 3-50 characters length

**Error Responses:**
```json
// Validation Error
{
  "error": "Missing required fields: localPart, password, name"
}

// Invalid Local Part
{
  "error": "Invalid local part. Only letters, numbers, dots, underscores and hyphens allowed."
}

// Already Exists
{
  "error": "Mail account already exists for this user"
}

// Mailcow Error
{
  "error": "Mailbox creation failed: Local part already exists"
}

// IMAP Verification Failed
{
  "error": "IMAP verification failed: Invalid credentials. Mailbox has been removed."
}
```

### 🔗 Connect Existing Mailbox
```http
POST /api/mailbox/connect
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "existing@yusufstar.com",
  "password": "ExistingMailboxPassword"
}
```

**Process:**
1. Validates email is @yusufstar.com
2. Verifies IMAP credentials with ImapFlow
3. Connects existing mailbox to user account
4. Starts automatic email synchronization

**Response (200):**
```json
{
  "id": "account-uuid",
  "email": "existing@yusufstar.com",
  "message": "Existing mailbox connected successfully"
}
```

**Error Responses:**
```json
// Domain Restriction
{
  "error": "Only @yusufstar.com email addresses are allowed"
}

// Already Connected
{
  "error": "Mail account already connected to this user"
}

// IMAP Verification Failed
{
  "error": "IMAP verification failed: Invalid credentials"
}
```

---

## Mail Account Operations

### List Connected Accounts
```http
GET /api/accounts
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "id": "account-uuid-1",
    "email": "john.doe@yusufstar.com",
    "imapHost": "mail.yusufstar.com",
    "imapPort": 993,
    "smtpHost": "mail.yusufstar.com",
    "smtpPort": 465,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastSyncedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### ⚠️ DEPRECATED: Add Account
```http
POST /api/accounts
Authorization: Bearer <jwt_token>
```

**Response (400):**
```json
{
  "error": "This endpoint is deprecated. Use /api/mailbox/create or /api/mailbox/connect instead."
}
```

---

## Email Operations

### List Emails
```http
GET /api/emails?accountId=<account-uuid>&limit=50&offset=0
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `accountId` (required): UUID of the mail account
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Results offset (default: 0)

**Response (200):**
```json
[
  {
    "id": "email-uuid",
    "messageId": "<message-id@example.com>",
    "from": "sender@example.com",
    "to": ["john.doe@yusufstar.com"],
    "cc": [],
    "subject": "Email Subject",
    "date": "2024-01-01T10:00:00.000Z",
    "isRead": false,
    "isStarred": false,
    "folder": "INBOX"
  }
]
```

**Error Responses:**
```json
// Missing Parameter
{
  "error": "Missing accountId parameter"
}

// Unauthorized Account
{
  "error": "Account not found or unauthorized"
}
```

### Get Email Details
```http
GET /api/emails/<email-uuid>
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "email-uuid",
  "messageId": "<message-id@example.com>",
  "from": "sender@example.com",
  "to": ["john.doe@yusufstar.com"],
  "cc": [],
  "bcc": [],
  "subject": "Email Subject",
  "contentText": "Full email content...",
  "contentHtml": "<p>Full email content...</p>",
  "date": "2024-01-01T10:00:00.000Z",
  "isRead": true,
  "isStarred": false,
  "folder": "INBOX"
}
```

**Note:** Email is automatically marked as read when fetched.

**Error Response (404):**
```json
{
  "error": "Email not found or unauthorized"
}
```

---

## Email Synchronization

### Manual Sync
```http
POST /api/sync
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "accountId": "account-uuid"  // Optional: sync specific account
}
```

**Response (200):**
```json
{
  "message": "Sync started"
}
```

**Note:** If `accountId` is not provided, all accounts are synced.

---

## Admin Endpoints (Admin Only)

All admin endpoints require the user to have admin privileges (`isAdmin: true`).

### Mailcow Management

#### List All Mailboxes
```http
GET /api/admin/mailcow/mailboxes
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns Mailcow mailboxes data

#### Get Domain Information
```http
GET /api/admin/mailcow/domain
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns domain configuration

#### Get Container Status
```http
GET /api/admin/mailcow/containers
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns Docker container status

#### Get Vmail Status
```http
GET /api/admin/mailcow/vmail
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns vmail status information

#### Get Mailcow Version
```http
GET /api/admin/mailcow/version
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns version information

#### Get System Logs
```http
GET /api/admin/mailcow/logs?type=dovecot&count=100
Authorization: Bearer <admin-jwt-token>
```

**Query Parameters:**
- `type` (optional): Log type (default: "dovecot")
- `count` (optional): Number of log entries (default: 100)

**Response (200):** Returns log entries

#### Get Mail Queue
```http
GET /api/admin/mailcow/queue
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns mail queue status

#### Flush Mail Queue
```http
POST /api/admin/mailcow/queue/flush
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns flush operation result

#### Get Quarantine Information
```http
GET /api/admin/mailcow/quarantine
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns quarantine data

#### Get Fail2ban Configuration
```http
GET /api/admin/mailcow/fail2ban
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns fail2ban configuration

#### Get DKIM Information
```http
GET /api/admin/mailcow/dkim
Authorization: Bearer <admin-jwt-token>
```

**Response (200):** Returns DKIM configuration

### Admin Error Response
```json
{
  "error": "Admin access required"
}
```

---

## System Health

### Health Check
```http
GET /api/health
```

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Server Configuration

### Fixed Mail Server Settings
- **IMAP Host**: `mail.yusufstar.com` (immutable)
- **IMAP Port**: `993` (SSL) (immutable)
- **SMTP Host**: `mail.yusufstar.com` (immutable)  
- **SMTP Port**: `465` (SSL) (immutable)
- **Domain**: `yusufstar.com` (for mailbox creation only)

### CORS Configuration
- Default: Allows all origins in development
- Production: Configure `CORS_ORIGIN` environment variable

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute per IP
- **Mailbox creation**: 2 requests per minute per user
- **Email operations**: 60 requests per minute per user
- **Sync operations**: 10 requests per minute per user

---

## Technical Notes

1. **Domain Restriction**: Mailbox creation/connection only supports @yusufstar.com
2. **IMAP/SMTP Settings**: Fixed to mail.yusufstar.com with SSL
3. **Automatic Sync**: Runs every 30 seconds (configurable)
4. **Admin Privileges**: Only `07yusufstar@gmail.com` has admin access
5. **JWT Token**: 7-day expiration
6. **Password Encryption**: AES-256 for stored mail passwords
7. **Database**: SQLite with optimized queries and proper indexing

---

## Example Usage Flow

1. **Register/Login** → Get JWT token
2. **Create Mailbox** → `POST /api/mailbox/create` 
3. **Verify Creation** → `GET /api/accounts`
4. **Fetch Emails** → `GET /api/emails?accountId=xyz`
5. **Read Email** → `GET /api/emails/email-id`
6. **Manual Sync** → `POST /api/sync`

For technical support or questions, contact the system administrator. 