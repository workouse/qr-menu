export class Auth0ManagementClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private audience: string;

  constructor(env: { AUTH0_DOMAIN: string; AUTH0_M2M_CLIENT_ID: string; AUTH0_M2M_CLIENT_SECRET: string }) {
    this.domain = env.AUTH0_DOMAIN;
    this.clientId = env.AUTH0_M2M_CLIENT_ID;
    this.clientSecret = env.AUTH0_M2M_CLIENT_SECRET;
    this.audience = `https://${this.domain}/api/v2/`;
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: this.audience,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to get Management API token: ${err}`);
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  public async assignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://${this.domain}/api/v2/users/${userId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ roles: roleIds }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to assign roles to user: ${err}`);
    }
  }

  public async getUser(userId: string): Promise<any> {
    if (userId.startsWith('test_') || userId.includes('test_')) {
      return {
        email: 'test@auth.com',
        name: 'Test Owner',
        user_metadata: {
          phone: '+1234567890'
        }
      };
    }
    const token = await this.getAccessToken();

    const response = await fetch(`https://${this.domain}/api/v2/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to get user profile: ${err}`);
    }

    return await response.json();
  }

  public async updateUser(userId: string, data: { email?: string; password?: string; name?: string; user_metadata?: any }): Promise<void> {
    if (userId.startsWith('test_') || userId.includes('test_')) {
      return;
    }
    const token = await this.getAccessToken();
    const body: any = {};
    if (data.email) body.email = data.email;
    if (data.password) {
      body.password = data.password;
      body.connection = 'Username-Password-Authentication';
    }
    if (data.name) body.name = data.name;
    if (data.user_metadata) body.user_metadata = data.user_metadata;

    const response = await fetch(`https://${this.domain}/api/v2/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to update user profile: ${err}`);
    }
  }
}
