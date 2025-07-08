import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { email: string; password: string; name: string };
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await this.authService.register(email, password, name);
      
      return new Response(JSON.stringify({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          isAdmin: Boolean(result.user.is_admin),
        },
        token: result.token,
      }), {
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

  async login(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { email: string; password: string };
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Missing email or password' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await this.authService.login(email, password);
      
      return new Response(JSON.stringify({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          isAdmin: Boolean(result.user.is_admin),
        },
        token: result.token,
      }), {
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