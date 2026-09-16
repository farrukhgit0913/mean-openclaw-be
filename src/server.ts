import 'dotenv/config';
import http from 'node:http';
import app from './app.js';

import {
  connectDatabase
} from './config/database.js';

import {
  initializeSocket
} from './socket.js';

const PORT =
  Number(process.env.PORT) || 3000;

async function bootstrap(): Promise<void> {
  /**
   * Connect MongoDB first.
   */
  await connectDatabase();

  /**
   * Create HTTP server.
   */
  const httpServer =
    http.createServer(app);

  /**
   * Initialize Socket.IO.
   */
  initializeSocket(
    httpServer
  );

  /**
   * Start server.
   */
  httpServer.listen(
    PORT,
    () => {
      console.log(
        `Backend running on http://localhost:${PORT}`
      );

      console.log(
        `Socket.IO running on ws://localhost:${PORT}`
      );
    }
  );
}

bootstrap().catch(
  (error) => {
    console.error(
      'Failed to start server:',
      error
    );

    process.exit(1);
  }
);