const mongoose = require('mongoose');

const setupIndexes = async () => {
  try {
    // User indexes
    await mongoose.connection.collection('users').createIndex(
      { username: 1 },
      { unique: true }
    );
    await mongoose.connection.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    );
    await mongoose.connection.collection('users').createIndex(
      { wins: -1 }
    );
    await mongoose.connection.collection('users').createIndex(
      { coins: -1 }
    );

    // Room indexes
    await mongoose.connection.collection('rooms').createIndex(
      { roomCode: 1 },
      { unique: true }
    );
    await mongoose.connection.collection('rooms').createIndex(
      { status: 1 }
    );

    // GameSession indexes
    await mongoose.connection.collection('gamesessions').createIndex(
      { room: 1 }
    );
    await mongoose.connection.collection('gamesessions').createIndex(
      { startedAt: -1 }
    );

    // Reward indexes
    await mongoose.connection.collection('rewards').createIndex(
      { user: 1, createdAt: -1 }
    );

    console.log('Database indexes set up successfully');
  } catch (error) {
    console.error('Index setup error:', error.message);
  }
};

module.exports = { setupIndexes };