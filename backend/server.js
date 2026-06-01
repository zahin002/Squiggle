const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { setupIndexes } = require('./utils/setupIndexes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB().then(() => setupIndexes());

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/words', require('./routes/words'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rewards', require('./routes/rewards'));
// Base route - just to test server is running
app.get('/', (req, res) => {
  res.json({ message: 'Squiggle API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});