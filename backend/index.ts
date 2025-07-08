import { config } from './src/config/config';
import { initializeDatabase, db } from './src/db/database';
import { CronService } from './src/services/cron.service';
import { AuthController } from './src/controllers/auth.controller';
import { MailController } from './src/controllers/mail.controller';
import { AdminController } from './src/controllers/admin.controller';
import { authMiddleware } from './src/middleware/auth.middleware';

// Initialize database
initializeDatabase();

// Initialize cron service
const cronService = new CronService();
cronService.start();

// Initialize controllers
const authController = new AuthController();
const mailController = new MailController();
const adminController = new AdminController();

// Helper function to add CORS headers
function withCors(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', config.cors.origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Helper function to handle auth context for protected routes
async function withAuthContext(req: Request, handler: (req: Request, authContext: any) => Promise<Response>): Promise<Response> {
  try {
    const authContext = await authMiddleware(req);
    return withCors(await handler(req, authContext));
  } catch (error: any) {
    return withCors(new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}

// Start server with Bun.serve and new routes API
const server = Bun.serve({
  port: config.port,
  hostname: "localhost",
  development: config.env === 'development',

  routes: {
    // ===== AUTH ROUTES =====
    "/api/register": {
      POST: async (req) => withCors(await authController.register(req)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/login": {
      POST: async (req) => withCors(await authController.login(req)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    // ===== MAIL ACCOUNT ROUTES =====
    "/api/accounts": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => mailController.listAccounts(req, authContext)),
      POST: async (req) => await withAuthContext(req, (req, authContext) => mailController.addAccount(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    // ===== NEW MAILBOX ROUTES =====
    "/api/mailbox/create": {
      POST: async (req) => await withAuthContext(req, (req, authContext) => mailController.createMailboxAndConnect(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/mailbox/connect": {
      POST: async (req) => await withAuthContext(req, (req, authContext) => mailController.connectExistingMailbox(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    // ===== EMAIL ROUTES =====
    "/api/emails": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => mailController.listEmails(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    // ===== THREAD COUNT ROUTE =====
    "/api/threads/count": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => mailController.getThreadCount(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/emails/:id": {
      GET: async (req) => {
        // Extract id from URL pathname
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();
        if (!id) {
          return withCors(new Response(JSON.stringify({ error: "Invalid email ID" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return await withAuthContext(req, (req, authContext) => mailController.getEmail(req, authContext, id));
      },
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    // ===== SYNC ROUTES =====
    "/api/sync": {
      POST: async (req) => await withAuthContext(req, (req, authContext) => mailController.syncMail(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    // ===== ADMIN ROUTES =====
    "/api/admin/mailcow/mailboxes": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getMailboxes(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/domain": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getDomain(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/containers": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getContainers(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/vmail": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getVmailStatus(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/version": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getVersion(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/logs": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getLogs(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/queue": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getMailQueue(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/queue/flush": {
      POST: async (req) => await withAuthContext(req, (req, authContext) => adminController.flushMailQueue(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/quarantine": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getQuarantine(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/fail2ban": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getFail2banConfig(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    "/api/admin/mailcow/dkim": {
      GET: async (req) => await withAuthContext(req, (req, authContext) => adminController.getDKIM(req, authContext)),
      OPTIONS: () => withCors(new Response(null, { status: 204 }))
    },

    // ===== HEALTH CHECK =====
    "/api/health": new Response(JSON.stringify({ 
      status: "OK", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    }), {
      headers: { 'Content-Type': 'application/json' }
    }),

    // ===== CATCH ALL API ROUTES =====
    "/api/*": withCors(new Response(JSON.stringify({ error: "API endpoint not found" }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }))
  },

  // Fallback for non-API routes
  fetch(req: Request): Response {
    const url = new URL(req.url);
    
    if (req.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }));
    }

    return withCors(new Response(JSON.stringify({ 
      error: "Not found",
      message: "This endpoint does not exist"
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }));
  },

  error(error: Error): Response {
    console.error('Server error:', error);
    return withCors(new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: config.env === 'development' ? error.message : undefined 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
});

console.log(`🚀 Freedom Mail Backend Server running on ${server.url}`);
console.log(`📧 Environment: ${config.env}`);
console.log(`🔄 Mail sync interval: ${config.sync.intervalSeconds} seconds`);
console.log(`🔑 Admin email: ${config.admin.email}`);
console.log(`⚡ Using Bun's native routes API for better performance`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n💫 Shutting down gracefully...');
  cronService.stop();
  db.close();
  console.log('✅ Server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n💫 Received SIGTERM, shutting down gracefully...');
  cronService.stop();
  db.close();
  console.log('✅ Server shutdown complete');
  process.exit(0);
});