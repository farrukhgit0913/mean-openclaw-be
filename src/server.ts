import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap(): Promise<void> {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
