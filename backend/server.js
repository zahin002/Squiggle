const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');                          // ADD THIS
const { Server } = require('socket.io');              // ADD THIS
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/words', require('./routes/words'));

app.get('/', (req, res) => {
  res.json({ message: 'Squiggle API is running!' });
});

// CHANGE THIS — replace app.listen() with these lines
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",   // Nirob's React frontend port
    methods: ["GET", "POST"]
  }
});

// Load your socket logic
require('./socket/index')(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});