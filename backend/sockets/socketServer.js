const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join personal room on auth
    socket.on('join', (userId, role, entityId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room user_${userId}`);
      
      if (role === 'admin') {
        socket.join('admin_room');
        console.log(`🛡️ Admin ${userId} joined admin_room`);
      }
      
      if (role === 'hospital' && entityId) {
        socket.join(`hospital_${entityId}`);
        console.log(`🏥 Hospital ${entityId} joined hospital_${entityId}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });

    // Chat message event (basic)
    socket.on('send_message', (data) => {
      const { toUserId, message } = data;
      io.to(`user_${toUserId}`).emit('receive_message', {
        fromUserId: data.fromUserId,
        message,
        timestamp: new Date(),
      });
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`user_${data.toUserId}`).emit('user_typing', {
        fromUserId: data.fromUserId,
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
