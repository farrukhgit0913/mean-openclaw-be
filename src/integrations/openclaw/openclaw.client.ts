import axios, { AxiosInstance } from 'axios';

export class OpenClawClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.OPENCLAW_BASE_URL,
      headers: {
        Authorization: `Bearer ${process.env.OPENCLAW_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getModels() {
    const response = await this.client.get('/v1/models');

    return response.data;
  }

  async chat(messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>) {
    const response = await this.client.post('/v1/chat/completions', {
      model: process.env.OPENCLAW_MODEL,
      messages
    });

    return response.data;
  }
}
