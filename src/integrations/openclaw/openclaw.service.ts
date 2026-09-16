import { OpenClawClient } from './openclaw.client.js';

export class OpenClawService {
  private readonly client = new OpenClawClient();

  async getModels() {
    return this.client.getModels();
  }

  async chat(message: string) {
    return this.client.chat([
      {
        role: 'user',
        content: message
      }
    ]);
  }
}
