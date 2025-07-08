import { config } from '../config/config';

interface MailcowResponse {
  type: 'success' | 'danger' | 'error';
  msg: string[];
  log?: any[];
}

interface MailboxData {
  active: '1' | '0';
  domain: string;
  local_part: string;
  name: string;
  authsource: 'mailcow';
  password: string;
  password2: string;
  quota: string;
  force_pw_update: '0' | '1';
  tls_enforce_in: '0' | '1';
  tls_enforce_out: '0' | '1';
  tags?: string[];
}

interface MailboxInfo {
  username: string;
  active: string;
  domain: string;
  local_part: string;
  name: string;
  quota: number;
  quota_used: number;
  messages: number;
  attributes: {
    force_pw_update: string;
    tls_enforce_in: string;
    tls_enforce_out: string;
    sogo_access: string;
    mailbox_format: string;
    quarantine_notification: string;
  };
  created: string;
  modified: string;
  last_imap_login: number;
  last_smtp_login: number;
  last_pop3_login: number;
}

interface DomainInfo {
  domain_name: string;
  active: string;
  aliases_in_domain: number;
  aliases_left: number;
  backupmx: string;
  bytes_total: string;
  def_quota_for_mbox: number;
  description: string;
  max_num_aliases_for_domain: number;
  max_num_mboxes_for_domain: number;
  max_quota_for_domain: number;
  max_quota_for_mbox: number;
  mboxes_in_domain: number;
  mboxes_left: number;
  msgs_total: string;
  quota_used_in_domain: string;
  relay_all_recipients: string;
  rl: boolean;
  tags: string[];
}

interface ContainerStatus {
  container: string;
  image: string;
  started_at: string;
  state: string;
  type: string;
}

export class MailcowService {
  private apiUrl: string;
  private apiKey: string;
  private domain: string;

  constructor() {
    this.apiUrl = config.mailcow.apiUrl;
    this.apiKey = config.mailcow.apiKey;
    this.domain = config.mailcow.domain;
  }

  private async request<T = any>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json() as T & { msg: string }

      if (!response.ok) {
        throw new Error(result.msg || 'Mailcow API error');
      }

      return result;
    } catch (error) {
      console.error('Mailcow API Error:', error);
      throw error;
    }
  }

  // Mailbox Management
  async createMailbox(
    localPart: string,
    password: string,
    name: string,
    quota: number = 3072
  ): Promise<MailcowResponse[]> {
    const mailboxData: MailboxData = {
      active: '1',
      domain: this.domain,
      local_part: localPart,
      name,
      authsource: 'mailcow',
      password,
      password2: password,
      quota: quota.toString(),
      force_pw_update: '0',
      tls_enforce_in: '1',
      tls_enforce_out: '1',
      tags: ['auto-created'],
    };

    return this.request<MailcowResponse[]>('POST', '/add/mailbox', mailboxData);
  }

  async getMailbox(email: string): Promise<MailboxInfo | undefined> {
    const result = await this.request<MailboxInfo[]>('GET', `/get/mailbox/${email}`);
    return result[0];
  }

  async getAllMailboxes(): Promise<MailboxInfo[]> {
    return this.request<MailboxInfo[]>('GET', '/get/mailbox/all');
  }

  async updateMailbox(email: string, updates: Partial<MailboxData>): Promise<MailcowResponse[]> {
    return this.request<MailcowResponse[]>('POST', '/edit/mailbox', {
      items: [email],
      attr: updates,
    });
  }

  async deleteMailbox(email: string): Promise<MailcowResponse[]> {
    return this.request<MailcowResponse[]>('POST', '/delete/mailbox', [email]);
  }

  // Domain Management (Admin only)
  async getDomain(domain: string = this.domain): Promise<DomainInfo | undefined> {
    const result = await this.request<DomainInfo[]>('GET', `/get/domain/${domain}`);
    return result[0];
  }

  async getAllDomains(): Promise<DomainInfo[]> {
    return this.request<DomainInfo[]>('GET', '/get/domain/all');
  }

  // System Status (Admin only)
  async getContainerStatus(): Promise<Record<string, ContainerStatus>> {
    return this.request<Record<string, ContainerStatus>>('GET', '/get/status/containers');
  }

  async getVmailStatus(): Promise<{
    disk: string;
    total: string;
    used: string;
    used_percent: string;
    type: string;
  }> {
    return this.request('GET', '/get/status/vmail');
  }

  async getVersion(): Promise<{ version: string }> {
    return this.request('GET', '/get/status/version');
  }

  // Logs (Admin only)
  async getLogs(
    type: 'acme' | 'api' | 'autodiscover' | 'dovecot' | 'netfilter' | 'postfix' | 'ratelimited' | 'rspamd-history' | 'sogo' | 'watchdog',
    count: number = 100
  ): Promise<any[]> {
    return this.request(`GET`, `/get/logs/${type}/${count}`);
  }

  // Queue Management (Admin only)
  async getMailQueue(): Promise<any[]> {
    return this.request('GET', '/get/mailq/all');
  }

  async flushMailQueue(): Promise<MailcowResponse> {
    return this.request('POST', '/edit/mailq', { action: 'flush' });
  }

  async deleteMailQueue(): Promise<MailcowResponse> {
    return this.request('POST', '/delete/mailq', { action: 'super_delete' });
  }

  // Quarantine (Admin only)
  async getQuarantine(): Promise<any[]> {
    return this.request('GET', '/get/quarantine/all');
  }

  async deleteQuarantineItem(id: string): Promise<MailcowResponse[]> {
    return this.request('POST', '/delete/qitem', [id]);
  }

  // Fail2ban (Admin only)
  async getFail2banConfig(): Promise<any> {
    return this.request('GET', '/get/fail2ban');
  }

  async updateFail2banConfig(config: any): Promise<MailcowResponse[]> {
    return this.request('POST', '/edit/fail2ban', {
      items: 'none',
      attr: config,
    });
  }

  // DKIM Management (Admin only)
  async getDKIM(domain: string = this.domain): Promise<any> {
    return this.request('GET', `/get/dkim/${domain}`);
  }

  async generateDKIM(domains: string[], keySize: number = 2048): Promise<MailcowResponse[]> {
    return this.request('POST', '/add/dkim', {
      dkim_selector: 'dkim',
      domains: domains.join(','),
      key_size: keySize.toString(),
    });
  }

  // Helper method to check if operation was successful
  isSuccessResponse(response: MailcowResponse[]): boolean {
    return response.every(r => r.type === 'success');
  }

  // Helper method to extract error messages
  getErrorMessages(response: MailcowResponse[]): string[] {
    return response
      .filter(r => r.type !== 'success')
      .flatMap(r => r.msg);
  }
} 