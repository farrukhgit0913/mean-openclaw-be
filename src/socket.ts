import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeSocket(
  httpServer: HttpServer
): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(
      `Socket.IO client connected: ${socket.id}`
    );

    socket.on('disconnect', (reason) => {
      console.log(
        `Socket.IO client disconnected: ${socket.id} - ${reason}`
      );
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error(
      'Socket.IO has not been initialized'
    );
  }

  return io;
}