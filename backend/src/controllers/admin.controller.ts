import type { AuthContext } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/auth.middleware';
import { MailcowService } from '../services/mailcow.service';

export class AdminController {
  private mailcowService: MailcowService;

  constructor() {
    this.mailcowService = new MailcowService();
  }

  async getMailboxes(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const mailboxes = await this.mailcowService.getAllMailboxes();
      
      return new Response(JSON.stringify(mailboxes), {
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

  async getDomain(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const domain = await this.mailcowService.getDomain();
      
      return new Response(JSON.stringify(domain), {
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

  async getContainers(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const containers = await this.mailcowService.getContainerStatus();
      
      return new Response(JSON.stringify(containers), {
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

  async getVmailStatus(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const vmail = await this.mailcowService.getVmailStatus();
      
      return new Response(JSON.stringify(vmail), {
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

  async getVersion(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const version = await this.mailcowService.getVersion();
      
      return new Response(JSON.stringify(version), {
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

  async getLogs(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const url = new URL(req.url);
      const type = url.searchParams.get('type') || 'dovecot';
      const count = parseInt(url.searchParams.get('count') || '100');
      
      const logs = await this.mailcowService.getLogs(type as any, count);
      
      return new Response(JSON.stringify(logs), {
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

  async getMailQueue(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const queue = await this.mailcowService.getMailQueue();
      
      return new Response(JSON.stringify(queue), {
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

  async flushMailQueue(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const result = await this.mailcowService.flushMailQueue();
      
      return new Response(JSON.stringify(result), {
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

  async getQuarantine(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const quarantine = await this.mailcowService.getQuarantine();
      
      return new Response(JSON.stringify(quarantine), {
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

  async getFail2banConfig(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const fail2ban = await this.mailcowService.getFail2banConfig();
      
      return new Response(JSON.stringify(fail2ban), {
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

  async getDKIM(req: Request, authContext: AuthContext): Promise<Response> {
    try {
      requireAdmin(authContext);
      
      const dkim = await this.mailcowService.getDKIM();
      
      return new Response(JSON.stringify(dkim), {
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
} 