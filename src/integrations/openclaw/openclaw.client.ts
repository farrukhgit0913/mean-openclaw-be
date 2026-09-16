import axios, { AxiosInstance } from 'axios';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

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

  async chat(
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>
  ) {
    const response = await this.client.post('/v1/chat/completions', {
      model: process.env.OPENCLAW_MODEL,
      messages
    });

    return response.data;
  }

  async sendWhatsAppMessage(
    to: string,
    message: string
  ) {
    const openClawCli =
      process.env.OPENCLAW_CLI_PATH || 'openclaw';

    const { stdout, stderr } =
      await execFileAsync(
        openClawCli,
        [
          'message',
          'send',
          '--channel',
          'whatsapp',
          '--target',
          to,
          '--message',
          message
        ],
        {
          timeout: 30_000,
          maxBuffer: 1024 * 1024
        }
      );

    if (stderr) {
      console.warn(
        'OpenClaw WhatsApp stderr:',
        stderr
      );
    }

    const messageIdMatch =
      stdout.match(/Message ID:\s*(.+)/i);

    return {
      success: true,
      messageId:
        messageIdMatch?.[1]?.trim() ?? null,
      output: stdout.trim()
    };
  }
}