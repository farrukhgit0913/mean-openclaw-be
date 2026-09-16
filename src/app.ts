import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';

import { OpenClawService } from './integrations/openclaw/openclaw.service.js';

const app = express();

/**
 * ============================================================
 * SECURITY
 * ============================================================
 */

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

/**
 * ============================================================
 * CORS
 * ============================================================
 */

app.use(
  cors({
    origin: 'http://localhost:4200'
  })
);

/**
 * ============================================================
 * MIDDLEWARE
 * ============================================================
 */

app.use(express.json());
app.use(morgan('dev'));

/**
 * ============================================================
 * STATIC DASHBOARD
 * ============================================================
 */

app.use(
  express.static(
    path.join(process.cwd(), 'public')
  )
);

app.get('/', (_req, res) => {
  res.sendFile(
    path.join(
      process.cwd(),
      'public',
      'index.html'
    )
  );
});

/**
 * ============================================================
 * SERVICES
 * ============================================================
 */

const openClawService =
  new OpenClawService();

/**
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get('/api/health', (_req, res) => {

  const mongodbConnected =
    mongoose.connection.readyState === 1;

  res.json({
    success: true,

    backend: true,

    mongodb: mongodbConnected,

    openclaw: null,

    message: mongodbConnected
      ? 'Backend and MongoDB are connected'
      : 'Backend is running but MongoDB is not connected'
  });
});

/**
 * ============================================================
 * OPENCLAW MODELS
 * ============================================================
 */

app.get(
  '/api/openclaw/models',
  async (_req, res) => {

    try {

      const models =
        await openClawService.getModels();

      return res.json({
        success: true,
        data: models
      });

    } catch (error) {

      console.error(
        'OpenClaw models error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to communicate with OpenClaw'
      });
    }
  }
);

/**
 * ============================================================
 * OPENCLAW CHAT
 * ============================================================
 */

app.post(
  '/api/openclaw/chat',
  async (req, res) => {

    try {

      const { message } =
        req.body;

      if (
        !message ||
        typeof message !== 'string'
      ) {

        return res.status(400).json({
          success: false,
          message: 'message is required'
        });
      }

      const response =
        await openClawService.chat(
          message
        );

      return res.json({
        success: true,
        data: response
      });

    } catch (error) {

      console.error(
        'OpenClaw chat error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to communicate with OpenClaw'
      });
    }
  }
);

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

export default app;