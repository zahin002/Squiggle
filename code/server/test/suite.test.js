const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// 1. WordBank & Dictionary Tests
describe('WordBank Service & Dictionary Integrity', () => {
  const { wordBank, getWordChoices } = require('../utils/WordBank');

  test('should provide standard word bank with extensive vocabulary', () => {
    assert.ok(Array.isArray(wordBank.standard), 'Standard words should be an array');
    assert.ok(wordBank.standard.length >= 5000, 'Standard bank should have at least 5000 curated words');
    assert.equal(wordBank.standard.length, 5950, 'Standard bank should have 5,950 curated entries');
  });

  test('should provide genre-specific word lists across all curated categories', () => {
    assert.ok(Array.isArray(wordBank.animals), 'Animals genre words should be an array');
    assert.ok(wordBank.animals.length > 50, 'Animals category should have substantive word count');
    assert.ok(Array.isArray(wordBank.foodAndDrink), 'Food category should exist');
    assert.ok(Array.isArray(wordBank.nature), 'Nature category should exist');
    assert.ok(Array.isArray(wordBank.videoGames), 'Video games category should exist');
    assert.ok(Array.isArray(wordBank.anime), 'Anime category should exist');
    assert.ok(Array.isArray(wordBank.wordle), 'Wordle 5-letter list should exist');
  });

  test('should return distinct word choices for drawing selection', async () => {
    const choices = await getWordChoices({ gameMode: 'standard', wordCount: 3 });
    assert.ok(Array.isArray(choices), 'Choices must be an array');
    assert.ok(choices.length >= 3, 'Must return at least 3 choices');
    const unique = new Set(choices);
    assert.equal(unique.size, choices.length, 'Choices must be mutually distinct');
  });
});

// 2. Wordle Helper Deduction Tests
describe('Wordle Helper Engine & Evaluation Logic', () => {
  const { evaluateWordleGuess, getWordlePhaseDuration, getWordleScoreForGuess } = require('../utils/wordleHelper');

  test('should correctly compute exact (green), present (yellow), and absent (gray) letter evaluations', () => {
    // Guessed APRON against target APPLE
    // A: exact ('correct'), P: exact ('correct'), R: absent, O: absent, N: absent
    const { evaluation, isCorrect } = evaluateWordleGuess('APRON', 'APPLE');
    assert.equal(isCorrect, false, 'APRON is not APPLE');
    assert.equal(evaluation[0].status, 'correct', 'First letter A matches exactly');
    assert.equal(evaluation[1].status, 'correct', 'Second letter P matches exactly');
    assert.equal(evaluation[2].status, 'absent', 'R is absent in APPLE');
    assert.equal(evaluation[3].status, 'absent', 'O is absent in APPLE');
    assert.equal(evaluation[4].status, 'absent', 'N is absent in APPLE');
  });

  test('should identify an exact 5-letter match', () => {
    const { evaluation, isCorrect } = evaluateWordleGuess('APPLE', 'APPLE');
    assert.equal(isCorrect, true);
    assert.ok(evaluation.every(e => e.status === 'correct'));
  });

  test('should return valid phase duration for Phase 1 (Blind)', () => {
    const p1Duration = getWordlePhaseDuration(1);
    assert.equal(typeof p1Duration, 'number');
    assert.ok(p1Duration > 0, 'Phase 1 duration must be a positive integer');
  });

  test('should calculate decreasing scores based on guess attempt number', () => {
    const score1 = getWordleScoreForGuess(1);
    const score2 = getWordleScoreForGuess(2);
    const score6 = getWordleScoreForGuess(6);
    assert.equal(score1, 100);
    assert.equal(score2, 80);
    assert.equal(score6, 10);
    assert.ok(score1 > score2, 'First guess must yield higher score than second');
    assert.ok(score2 > score6, 'Second guess must yield higher score than sixth');
  });
});

// 3. Room State Sanitization & Security
describe('Room State Serialization & Information Hiding (CO4 Security)', () => {
  const { buildRoomState } = require('../socket/buildRoomState');

  const mockRoom = {
    roomId: 'abc123',
    settings: { gameMode: 'standard', rounds: 3, drawTime: 60, maxPlayers: 8 },
    players: [
      { socketId: 'sock_drawer', username: 'DrawerUser', score: 100 },
      { socketId: 'sock_guesser', username: 'GuesserUser', score: 50 }
    ],
    spectators: [],
    status: 'playing',
    currentDrawer: { socketId: 'sock_drawer', username: 'DrawerUser' },
    currentWord: 'ELEPHANT',
    currentRound: 1,
    timeLeft: 45,
    wordChoices: ['ELEPHANT', 'GIRAFFE', 'MONKEY'],
    hostSocketId: 'sock_drawer'
  };

  test('should reveal secret word to the designated drawer', () => {
    const drawerState = buildRoomState(mockRoom, null, 'sock_drawer');
    assert.equal(drawerState.currentWord, 'ELEPHANT', 'Drawer must see the secret word');
    assert.equal(drawerState.isHost, true, 'Host socket ID should be recognized');
  });

  test('should strictly hide secret word and word choices from guessers', () => {
    const guesserState = buildRoomState(mockRoom, null, 'sock_guesser');
    assert.equal(guesserState.currentWord, null, 'Guesser must NEVER receive the plaintext secret word');
    assert.deepEqual(guesserState.wordChoices, [], 'Guesser must not see drawer word choices');
    assert.equal(guesserState.isHost, false, 'Non-host socket ID should not be host');
  });
});

// 4. In-Memory RoomStore Lifecycle
describe('RoomStore Transient State Management', () => {
  const { createRoomState, getRoom, setRoom } = require('../socket/roomStore');

  test('should create and store initialized room state with round-turn tracking', () => {
    const roomId = 'test_room_memory_validation';
    const state = createRoomState(roomId, { rounds: 3, maxPlayers: 6 }, 'host_user_123');
    setRoom(roomId, state);

    const retrieved = getRoom(roomId);
    assert.ok(retrieved, 'Room must be retrievable from in-memory Map');
    assert.equal(retrieved.currentRound, 0, 'Initial round should be 0');
    assert.equal(retrieved.drawersDrawnThisRound, 0, 'Initial drawersDrawnThisRound should be 0');
    assert.equal(retrieved.currentDrawerIndex, 0, 'Initial drawer index should be 0');
  });
});

// 5. Authentication & Cryptographic Security (CO4)
describe('Authentication & Cryptographic Security', () => {
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');

  test('should hash passwords with salt rounds and verify correctly', async () => {
    const rawPassword = 'SecureStudentPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(rawPassword, hash, 'Hash must not match raw password');
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.equal(isMatch, true, 'bcrypt.compare must return true for valid password');
    const isMismatch = await bcrypt.compare('WrongPassword', hash);
    assert.equal(isMismatch, false, 'bcrypt.compare must return false for invalid password');
  });

  test('should sign and verify valid JWT tokens with expiration', () => {
    const secret = 'test_jwt_secret_key_squiggle';
    const payload = { id: 'usr_12345', username: 'SquigglePlayer' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    assert.ok(typeof token === 'string', 'Token must be a string');
    const decoded = jwt.verify(token, secret);
    assert.equal(decoded.id, 'usr_12345');
    assert.equal(decoded.username, 'SquigglePlayer');
    assert.ok(decoded.exp > decoded.iat, 'Expiration must be greater than issue timestamp');
  });
});
