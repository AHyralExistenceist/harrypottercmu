import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in production environment!');
  console.error('Please set JWT_SECRET environment variable before starting the server.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using default secret. This is not secure for production!');
}

console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '***' + process.env.JWT_SECRET.slice(-4) : 'NOT SET (using default)'}`);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Import routes
import authRoutes from './routes/auth-supabase.js';
import userRoutes from './routes/user.js';
import boardRoutes from './routes/board.js';
import postRoutes from './routes/post.js';
import characterRoutes from './routes/character.js';
import battleRoutes from './routes/battle.js';
import shopRoutes from './routes/shop.js';
import questRoutes from './routes/quest.js';
import mapRoutes from './routes/map.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/map', mapRoutes);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: Check your IP address and use http://YOUR_IP:${PORT}`);
});

export { io };

