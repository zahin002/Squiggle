const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './server/.env' });

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const userRoutes = require('./routes/users');

const gameEvents = require('./socket/gameEvents');
const drawingEvents = require('./socket/drawingEvents'); 

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

// Socket Events
gameEvents(io);

// Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    try {
      const Room = require('./models/Room');
      const result = await Room.deleteMany({ status: { $ne: 'finished' } });
      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} orphaned room(s) from previous session`);
      }
    } catch (e) {
      console.error('Error cleaning up orphaned rooms:', e);
    }
  })
  .catch((err) => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});