import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  LuUsers,
  LuCrown,
  LuArrowLeft,
  LuArrowRight,
  LuClock,
  LuTimer,
  LuMessageSquare,
  LuSend,
  LuUserPlus,
  LuUserX,
  LuZap,
  LuCoins,
  LuGem,
  LuLightbulb,
  LuTarget,
  LuCrosshair,
  LuMic,
  LuMicOff,
  LuVolume2,
  LuVolumeX,
  LuCopy,
  LuCheck,
  LuUser,
  LuGamepad2,
  LuPencil,
  LuPaintbrush,
  LuSmile,
  LuBan,
  LuVote,
  LuInfo,
  LuCircleAlert,
  LuCircleCheck,
  LuSnowflake,
  LuPlay,
  LuTrophy,
  LuLock,
  LuRotateCcw,
  LuEye,
  LuEyeOff,
  LuX
} from 'react-icons/lu';
import DrawingCanvas from '../components/DrawingCanvas';
import WordleBoard from '../components/WordleBoard';
import PowerupsPanel from '../components/PowerupsPanel';
import Avatar from '../components/Avatar';
import SquiggleLogo, { SquiggleLogoMark } from '../components/SquiggleLogo';
import { useAuth } from '../context/AuthContext';
import useWebRTC from '../hooks/useWebRTC';
import '../styles/GamePage.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const POPULAR_EMOJIS = [
  '😂', '🤣', '😭', '💀', '🔥', '👏', '💯', '🥳',
  '😍', '🤔', '💡', '🎨', '🖌️', '🎯', '👑', '🏆',
  '👍', '👎', '❤️', '😱', '💩', '✨', '⚡', '🎉',
  '🤩', '🤯', '🤫', '👀', '👋', '🙌', '😎', '🎮'
];

const TEXT_EMOJIS = [
  '¯\\_(ツ)_/¯',
  '(•‿•)',
  '(づ｡◕‿‿◕｡)づ',
  '(╯°□°)╯︵ ┻━┻',
  '(✿◠‿◠)',
  '(¬_¬)',
  '(╥﹏╥)',
  '(ง\'̀-\'́)ง',
  'ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧',
  '(UwU)',
  'ʕ•ᴥ•ʔ',
  '(•_•)',
  '(>_<)',
  '(*^▽^*)',
  '┬─┬ノ( º _ ºノ)'
];

export default function GamePage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedRole = location.state?.role || 'player';
  const { user, setUser, loginAsGuest, loading } = useAuth();
  const [activeUser, setActiveUser] = useState(user);
  const [roomState, setRoomState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeVote, setActiveVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteNotice, setVoteNotice] = useState('');
  const [kickedModal, setKickedModal] = useState(null);
  const [roundSplash, setRoundSplash] = useState(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState('emojis');
  const [freezeState, setFreezeState] = useState(null);
  const [extraCluesData, setExtraCluesData] = useState(null);
  const [showFinalDrawing, setShowFinalDrawing] = useState(false);

  const chatBottomRef = useRef(null);
  const chatInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleInsertEmoji = (emojiStr) => {
    setChatInput((prev) => (prev ? `${prev} ${emojiStr}` : emojiStr));
    chatInputRef.current?.focus();
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chatMessage', { roomId, text: chatInput.trim() });
    setChatInput('');
    setShowEmojiPicker(false);
  };

  const socket = useMemo(() => io(SERVER_URL, { autoConnect: false }), []);

  const {
    isMuted,
    isForceMuted,
    remoteStreams,
    toggleMute,
  } = useWebRTC(
    socket,
    roomId,
    requestedRole,
    roomState?.players,
    roomState?.settings?.voiceChatEnabled === true
  );

  useEffect(() => {
    if (loading) return;
    if (user) {
      setActiveUser(user);
      return;
    }
    setActiveUser(loginAsGuest());
  }, [user, loginAsGuest, loading]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeUserRef = useRef(activeUser);
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  const requestedRoleRef = useRef(requestedRole);
  useEffect(() => {
    requestedRoleRef.current = requestedRole;
  }, [requestedRole]);

  const emitJoin = useCallback(() => {
    const curUser = activeUserRef.current;
    if (!curUser) return;
    socket.emit('joinRoom', {
      roomId,
      token: localStorage.getItem('token'),
      username: curUser.username,
      avatar: curUser.avatar || null,
      role: requestedRoleRef.current || 'player',
      isGuest: !!curUser.isGuest,
      guestId: curUser.id,
      userId: curUser.id,
    });
    socket.emit('requestCanvasState', { roomId });
  }, [roomId, socket]);

  // When activeUser becomes available or updates, emit joinRoom if socket is connected
  useEffect(() => {
    if (!activeUser) return;
    if (socket.connected) {
      emitJoin();
    }
  }, [activeUser, emitJoin, socket]);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      emitJoin();
    };

    socket.on('connect', handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    socket.on('roomState', (state) => {
      setRoomState((prev) => ({
        ...prev,
        ...state,
      }));

      if (state?.status && state.status !== 'lobby') {
        setIsStartingGame(false);
      }

      if (state?.timeLeft !== undefined) {
        setTimeLeft(state.timeLeft);
      }

      if (state?.chatHistory) {
        setMessages(state.chatHistory);
      }
    });

    socket.on('playerJoined', ({ players }) => {
      setRoomState((state) => (state ? { ...state, players } : state));
    });

    socket.on('playerLeft', ({ players }) => {
      setRoomState((state) => (state ? { ...state, players } : state));
    });

    socket.on('gameStarted', ({ message }) => {
      setMessages((items) => [...items, { type: 'system', text: message }]);
      setRoomState((prev) => (prev ? { ...prev, status: 'starting' } : prev));
    });

    socket.on('wordChoices', ({ choices }) => {
      setIsStartingGame(false);
      setRoomState((s) => (s ? { ...s, wordChoices: choices, status: 'wordSelection' } : s));
    });

    socket.on('roundStarted', (round) => {
      setIsStartingGame(false);
      setGuessWindowOpen(true);
      setFreezeState(null);
      setExtraCluesData(null);
      setRoomState((state) => {
        if (!state) return state;
        return {
          ...state,
          status: 'playing',
          wordChoices: null,
          currentDrawer: round.drawer ? { ...state.currentDrawer, ...round.drawer } : state.currentDrawer,
          ...round
        };
      });
      if (round?.timeLeft !== undefined) setTimeLeft(round.timeLeft);
      setRoundSplash({
        round: round.round,
        totalRounds: round.totalRounds,
        drawerName: round.drawer?.username
      });
      setTimeout(() => setRoundSplash(null), 2500);
    });

    socket.on('roundEnded', ({ word, players }) => {
      setIsStartingGame(false);
      setFreezeState(null);
      setExtraCluesData(null);
      setRoomState((state) => (state ? { ...state, status: 'roundEnding', revealedWord: word, players: players || state.players } : state));
      setMessages((items) => [...items, { type: 'system', text: `Round over! Word was: "${word}"` }]);
    });

    socket.on('gameEnded', ({ winner, players, reason }) => {
      setIsStartingGame(false);
      setShowFinalDrawing(false);
      setFreezeState(null);
      setExtraCluesData(null);
      setRoomState((state) => (state ? {
        ...state,
        status: 'finished',
        winner,
        endReason: reason,
        players: players || state.players
      } : state));
      setMessages((items) => [
        ...items,
        {
          type: 'system',
          text: reason === 'insufficient_players'
            ? `Game over! All other players left the room.`
            : `Game Over! Winner: ${winner || 'Nobody'}`
        }
      ]);
    });

    socket.on('gameReset', ({ players, status }) => {
      setShowFinalDrawing(false);
      setIsStartingGame(false);
      setFreezeState(null);
      setExtraCluesData(null);
      setRoomState((prev) => (prev ? {
        ...prev,
        status: status || 'lobby',
        players: players || prev.players,
        winner: null,
        endReason: null,
        wordChoices: null,
        currentWord: null,
        currentDrawer: null
      } : prev));
    });

    socket.on('timerTick', ({ timeLeft, wordHint, freezeState: tickFreezeState }) => {
      setTimeLeft(timeLeft);
      if (wordHint) {
        setRoomState((s) => (s ? { ...s, wordHint } : s));
      }
      if (tickFreezeState !== undefined) {
        setFreezeState(tickFreezeState);
      }
    });

    socket.on('yourWord', ({ word }) => {
      setRoomState((s) => (s ? { ...s, selectedWord: word, currentWord: word } : s));
    });

    socket.on('chatMessage', (message) => {
      setMessages((items) => [...items.slice(-40), message]);
    });

    socket.on('error', (payload) => {
      setIsStartingGame(false);
      setError(payload.message || 'Something went wrong');
      if (payload.message && payload.message.includes('All players have left')) {
        setTimeout(() => navigate('/lobby'), 2500);
      }
    });

    socket.on('voteKickStarted', (data) => {
      setActiveVote(data);
      setHasVoted(socket.id === data.initiatorSocketId);
      setVoteNotice('');
    });

    socket.on('voteKickUpdated', (data) => {
      setActiveVote((prev) => (prev ? { ...prev, ...data } : data));
    });

    socket.on('voteKickTick', ({ timeLeft }) => {
      setActiveVote((prev) => (prev ? { ...prev, timeLeft } : null));
    });

    socket.on('voteKickEnded', ({ passed, targetUsername, reason }) => {
      setActiveVote(null);
      setHasVoted(false);
      setVoteNotice(passed ? `${targetUsername} was kicked from the room.` : `Vote kick failed: ${reason}`);
      setTimeout(() => setVoteNotice(''), 5000);
    });

    socket.on('voteKickError', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 4000);
    });

    socket.on('kickedFromRoom', ({ reason }) => {
      setKickedModal(reason || 'You were vote-kicked from the room (-50 Gold Coins penalty).');
    });

    socket.on('wordlePhaseStarted', ({ guessPhase, isDrawerLocked, phase, timeLeft }) => {
      setGuessWindowOpen(true);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          wordleState: {
            ...(prev.wordleState || {}),
            currentGuessPhase: guessPhase,
            isDrawerLocked,
            phase
          }
        };
      });
      if (timeLeft !== undefined) setTimeLeft(timeLeft);
    });

    socket.on('wordleActivity', ({ solversCount }) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          wordleState: {
            ...(prev.wordleState || {}),
            solversCount
          }
        };
      });
    });

    socket.on('voiceChatStatusChanged', ({ voiceChatEnabled }) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          settings: {
            ...(prev.settings || {}),
            voiceChatEnabled
          }
        };
      });
    });

    socket.on('powerupsStatusChanged', ({ powerupsEnabled }) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          settings: {
            ...(prev.settings || {}),
            powerupsEnabled
          }
        };
      });
    });

    socket.on('freezeTimeUpdate', (data) => {
      setFreezeState(data);
    });

    socket.on('freezeTimeEnded', () => {
      setFreezeState(null);
    });

    socket.on('extraCluesUpdated', (data) => {
      setExtraCluesData(data);
    });

    socket.on('powerupSuccess', ({ powerup, goldCoins, diamonds }) => {
      if (setUser) {
        setUser((prev) => (prev ? { ...prev, goldCoins, diamonds } : prev));
      }
      setActiveUser((prev) => (prev ? { ...prev, goldCoins, diamonds } : prev));
    });

    socket.on('powerupError', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 4000);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('roomState');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('wordChoices');
      socket.off('roundStarted');
      socket.off('roundEnded');
      socket.off('gameEnded');
      socket.off('gameReset');
      socket.off('yourWord');
      socket.off('chatMessage');
      socket.off('timerTick');
      socket.off('error');
      socket.off('voteKickStarted');
      socket.off('voteKickUpdated');
      socket.off('voteKickTick');
      socket.off('voteKickEnded');
      socket.off('voteKickError');
      socket.off('kickedFromRoom');
      socket.off('wordlePhaseStarted');
      socket.off('wordleActivity');
      socket.off('voiceChatStatusChanged');
      socket.off('powerupsStatusChanged');
      socket.off('freezeTimeUpdate');
      socket.off('freezeTimeEnded');
      socket.off('extraCluesUpdated');
      socket.off('powerupSuccess');
      socket.off('powerupError');

      socket.disconnect();
    };
  }, [roomId, socket, emitJoin, navigate]);

  const isDrawer = Boolean(
    (roomState?.currentDrawer?.socketId && socket?.id && roomState.currentDrawer.socketId === socket.id) ||
    (roomState?.currentDrawer?.userId && (activeUser?.id || activeUser?._id) && String(roomState.currentDrawer.userId) === String(activeUser.id || activeUser._id)) ||
    (roomState?.currentDrawer?.username && (activeUser?.username || user?.username) && roomState.currentDrawer.username === (activeUser?.username || user?.username))
  );
  const isHost =
    roomState?.isHost !== undefined
      ? !!roomState.isHost
      : (roomState?.hostUserId && activeUser?.id
          ? String(roomState.hostUserId) === String(activeUser.id)
          : (roomState?.hostId ? roomState.hostId === socket.id : false));
  const isWordle = roomState?.settings?.gameMode === 'wordle';
  const isDrawingAllowed = isDrawer && (!isWordle || !roomState?.wordleState?.isDrawerLocked);

  if (loading) {
    return (
      <main className="game-page-modern" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>Loading game session...</p>
      </main>
    );
  }

  const currentDrawerId = roomState?.currentDrawer?.socketId;
  const sortedPlayers = useMemo(() => {
    const list = [...(roomState?.players || [])];
    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [roomState?.players]);

  const playerRankMap = useMemo(() => {
    const ranks = {};
    let currentRank = 1;
    sortedPlayers.forEach((p, idx) => {
      if (idx > 0 && (p.score || 0) < (sortedPlayers[idx - 1].score || 0)) {
        currentRank = idx + 1;
      }
      const id = p.socketId || p.userId;
      ranks[id] = currentRank;
    });
    return ranks;
  }, [sortedPlayers]);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleLeaveRoom = () => {
    try {
      socket.emit('leaveRoom', { roomId });
    } catch {}
    navigate('/lobby');
  };

  const handleSetVoiceChat = (enabled) => {
    socket.emit('setVoiceChatEnabled', { roomId, enabled });
    setRoomState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...(prev.settings || {}),
          voiceChatEnabled: enabled
        }
      };
    });
  };

  const handleSetPowerups = (enabled) => {
    socket.emit('setPowerupsEnabled', { roomId, enabled });
    setRoomState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        settings: {
          ...(prev.settings || {}),
          powerupsEnabled: enabled
        }
      };
    });
  };

  const handleStartGame = () => {
    if (isStartingGame || roomState?.status === 'starting') return;
    if ((roomState?.players?.length || 0) < 2) {
      setError('At least 2 players are needed to start the game!');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setIsStartingGame(true);
    socket.emit('startGame', { roomId });
  };

  const handlePlayAgain = () => {
    socket.emit('playAgain', { roomId });
  };

  const currentWordDisplay = roomState?.currentWord || roomState?.selectedWord;

  const cleanSystemMessage = (text) => {
    if (!text) return '';
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu, '').trim();
  };

  const handleGuessSubmit = (e) => {
    e?.preventDefault();
    if (!guess.trim() || roomState?.status !== 'playing' || isDrawer) return;
    if (isWordle) {
      socket.emit('guessWordle', { roomId, guess: guess.trim().toUpperCase() });
    } else {
      socket.emit('guessWord', { roomId, guess: guess.trim() });
    }
    setGuess('');
  };

  const handleGuessWordDirect = (wordToGuess) => {
    if (!wordToGuess || roomState?.status !== 'playing' || isDrawer) return;
    if (isWordle) {
      socket.emit('guessWordle', { roomId, guess: wordToGuess.trim().toUpperCase() });
    } else {
      socket.emit('guessWord', { roomId, guess: wordToGuess.trim() });
    }
    setGuess('');
  };

  // Render guess hint: single words guaranteed on a single line,
  // auto-scaled font size for long words, wraps only between words if multi-word.
  const renderWordHint = (hint) => {
    if (!hint) return null;
    const wordChunks = hint.trim().split(/\s{2,}/);
    const totalLetters = (hint.match(/[^\s]/g) || []).length;
    const maxChunkLetters = Math.max(...wordChunks.map((c) => (c.match(/[^\s]/g) || []).length), 1);

    let fontSize = '22px';
    if (wordChunks.length === 1) {
      if (totalLetters > 14) fontSize = '13px';
      else if (totalLetters > 11) fontSize = '15px';
      else if (totalLetters > 9) fontSize = '17px';
      else if (totalLetters > 7) fontSize = '19px';
      else fontSize = '22px';
    } else {
      if (maxChunkLetters > 12 || totalLetters > 16) fontSize = '14px';
      else if (maxChunkLetters > 9 || totalLetters > 12) fontSize = '16px';
      else fontSize = '18px';
    }

    return (
      <strong className="canvas-hint-mask" style={{ fontSize }}>
        {wordChunks.map((chunk, idx) => (
          <span key={idx} className="hint-word-chunk">
            {chunk}
          </span>
        ))}
      </strong>
    );
  };

  // Render drawer secret word: single words on 1 line, wraps only between words.
  const renderDrawerWord = (word) => {
    if (!word) return null;
    const wordChunks = word.trim().split(/\s+/);
    const totalLetters = word.replace(/\s+/g, '').length;
    const maxChunkLetters = Math.max(...wordChunks.map((c) => c.length), 1);

    let fontSize = '20px';
    if (wordChunks.length === 1) {
      if (totalLetters > 14) fontSize = '13px';
      else if (totalLetters > 11) fontSize = '15px';
      else if (totalLetters > 8) fontSize = '17px';
      else fontSize = '20px';
    } else {
      if (maxChunkLetters > 12 || totalLetters > 16) fontSize = '14px';
      else if (maxChunkLetters > 9 || totalLetters > 12) fontSize = '16px';
      else fontSize = '18px';
    }

    return (
      <strong className="canvas-word-value" style={{ fontSize }}>
        {wordChunks.map((chunk, idx) => (
          <span key={idx} className="word-text-chunk">
            {chunk}
          </span>
        ))}
      </strong>
    );
  };

  return (
    <div className="game-page-modern">
      {/* Unified Compact Top Header Bar */}
      <header className="game-navbar-compact">
        {/* Left: Leave Button & Squiggle Logo */}
        <div className="nav-left">
          <button className="leave-room-box-btn" onClick={handleLeaveRoom} title="Leave Game Room">
            <LuArrowLeft className="btn-icon-xs" />
            <span>Leave Room</span>
          </button>
          <button
            className="nav-logo"
            onClick={handleLeaveRoom}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Squiggle"
          >
            <SquiggleLogo height={32} />
          </button>
        </div>

        {/* Center: Glowing Round Pill */}
        <div className="nav-center">
          <span className="round-badge">
            ROUND {roomState?.currentRound || 1}/{roomState?.settings?.rounds || 3}
          </span>
        </div>

        {/* Right: Room Code & User Profile */}
        <div className="nav-right">
          <div className="room-code-badge" title="Room Code">
            <span className="code-label">Room:</span>
            <strong className="code-value">{roomId}</strong>
            <button
              type="button"
              className="room-code-copy-btn"
              onClick={handleCopyInvite}
              title="Copy Room Link"
            >
              {copySuccess ? <LuCheck className="code-copy-icon is-copied" /> : <LuCopy className="code-copy-icon" />}
            </button>
          </div>

          <div className="user-profile-pill">
            <Avatar avatar={activeUser?.avatar} size={24} username={activeUser?.username} />
            <span className="user-profile-name">{activeUser?.username || 'Player'}</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Content */}
      <main className={`game-main-content ${isWordle ? 'is-wordle-mode' : ''} ${!isDrawer ? 'guesser-view-active' : 'drawer-view-active'}`}>
        {error && (
          <div className="game-error-banner">
            <LuCircleAlert style={{ marginRight: '6px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* LEFT COLUMN: Players Panel + Invite Friends + Power-Ups */}
        <aside className="game-left-col">
          {/* 3. PLAYER PANEL - Compact height */}
          <div className="players-panel-card">
            <div className="players-header">
              <div className="players-header-title-box">
                <LuUsers className="players-header-icon" />
                <span>PLAYERS ({(roomState?.players?.length || 0)}/{(roomState?.settings?.maxPlayers || 8)})</span>
              </div>

              {/* Mic toggle */}
              {requestedRole !== 'spectator' && (
                roomState?.settings?.voiceChatEnabled ? (
                  <button
                    type="button"
                    className={`players-header-mic-btn ${isForceMuted ? 'is-force-muted' : isMuted ? 'is-muted' : 'is-active'}`}
                    onClick={toggleMute}
                    disabled={isForceMuted}
                    title={isForceMuted ? 'Muted by Host' : isMuted ? 'Mic is Muted (Click to Turn ON)' : 'Mic is ON (Click to Turn OFF)'}
                  >
                    {isForceMuted || isMuted ? (
                      <LuMicOff className="header-mic-icon mic-red" />
                    ) : (
                      <LuMic className="header-mic-icon mic-green" />
                    )}
                  </button>
                ) : (
                  <div
                    className="players-header-mic-btn is-disabled"
                    title="Voice chat disabled by host"
                  >
                    <LuMicOff className="header-mic-icon mic-off" />
                  </div>
                )
              )}
            </div>

            <div className="players-list-compact">
              {sortedPlayers.map((player) => {
                const isDrawing = player.socketId === currentDrawerId;
                const isPlayerHost = player.isHost !== undefined
                  ? !!player.isHost
                  : (roomState?.hostUserId && player.userId
                      ? String(roomState.hostUserId) === String(player.userId)
                      : (roomState?.hostId ? (player.socketId === roomState.hostId || player.userId === roomState.hostId) : false));
                const rank = playerRankMap[player.socketId || player.userId] || 1;

                return (
                  <div key={player.socketId || player.userId} className={`player-card-compact ${isPlayerHost ? 'is-host' : ''} ${isDrawing ? 'is-drawing' : ''}`}>
                    <div className="player-card-left">
                      <div className="player-avatar-badge-wrap" title={`Rank ${rank} • ${player.score || 0} pts`}>
                        <Avatar avatar={player.avatar} size={32} username={player.username} />
                        <span className={`player-rank-sub-badge rank-badge-${rank <= 3 ? rank : 'default'}`}>
                          {rank}
                        </span>
                      </div>
                      <div className="player-meta-box">
                        <div className="player-name-row">
                          <span className="player-name-text" title={player.username}>{player.username}</span>
                          {roomState?.settings?.voiceChatEnabled && (
                            <span className="player-mic-mini">
                              {player.isMuted ? <LuMicOff className="mic-muted-red" /> : <LuMic className="mic-on-green" />}
                            </span>
                          )}
                        </div>
                        <span className="player-score-text">{player.score || 0} pts</span>
                      </div>
                    </div>

                    <div className="player-card-right">
                      {isPlayerHost ? (
                        <span className="host-badge-pill">
                          <LuCrown className="crown-icon" /> Host
                        </span>
                      ) : (
                        <div className="player-mod-actions">
                          {/* Vote-kick trigger */}
                          {player.socketId !== socket.id && (
                            <button
                              className="btn-player-kick"
                              title={`Call vote to kick ${player.username}`}
                              onClick={() => socket.emit('startVoteKick', { roomId, targetSocketId: player.socketId })}
                              disabled={activeVote !== null}
                            >
                              <LuUserX className="btn-icon-xs" /> Kick
                            </button>
                          )}

                          {/* Host controls to force mute */}
                          {isHost && roomState?.settings?.voiceChatEnabled && player.socketId !== socket.id && (
                            <button
                              className="btn-player-mute"
                              title={player.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                              onClick={() => socket.emit('forceMuteUser', {
                                roomId,
                                targetSocketId: player.socketId,
                                mute: !player.isMuted
                              })}
                            >
                              {player.isMuted ? <><LuVolume2 className="btn-icon-xs" /> Unmute</> : <><LuVolumeX className="btn-icon-xs" /> Mute</>}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. INVITE FRIENDS - Part of the left-side stack */}
          <div className="invite-friends-stack-box">
            {copySuccess && (
              <div className="invite-copied-toast">
                <LuCircleCheck className="toast-check-icon" />
                <span>Room link copied to clipboard!</span>
              </div>
            )}
            <button
              className={`btn-invite-friends-gradient ${copySuccess ? 'is-copied' : ''}`}
              onClick={handleCopyInvite}
              title="Copy room link to invite friends"
            >
              {copySuccess ? (
                <>
                  <LuCheck className="btn-icon-sm" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <LuUserPlus className="btn-icon-sm" />
                  <span>Invite Friends</span>
                </>
              )}
            </button>
          </div>

          {/* 5. POWER-UPS - Placed below Invite Friends */}
          <PowerupsPanel
            socket={socket}
            roomId={roomId}
            roomState={roomState}
            user={activeUser}
            setUser={setUser}
            freezeState={freezeState}
            extraCluesData={extraCluesData}
            onGuessWord={handleGuessWordDirect}
          />
        </aside>

        {/* CENTER COLUMN: HUD + Canvas + Dedicated Guess Bar Underneath */}
        <section className={`game-mid-col ${!isDrawer ? 'guesser-mid-layout' : 'drawer-mid-layout'}`}>
          {/* Top HUD above Canvas: Timer + Word Pattern */}
          {(roomState?.status === 'playing' || roomState?.status === 'wordSelection') && (
            <div className="canvas-header-bar">
              {/* Freeze Red Timer popup */}
              {freezeState?.active && freezeState.userSocketId === socket.id && (
                <div className="canvas-freeze-red-timer" title="Active Freeze Time Countdown">
                  <LuSnowflake className="freeze-pulse-icon" />
                  <span>+{freezeState.freezeSecondsRemaining}s FREEZE</span>
                </div>
              )}

              {/* Timer HUD Element with smooth color warnings */}
              <div
                className={`canvas-timer-pill ${
                  freezeState?.active && freezeState.userSocketId === socket.id
                    ? 'is-frozen'
                    : timeLeft <= 7
                    ? 'critical'
                    : timeLeft <= 15
                    ? 'warn'
                    : 'normal'
                }`}
              >
                {freezeState?.active && freezeState.userSocketId === socket.id ? (
                  <>
                    <LuSnowflake className="canvas-timer-icon freeze-snow-icon" />
                    <span className="canvas-timer-text">{freezeState.normalTimeFrozenAt ?? timeLeft}s (FROZEN)</span>
                  </>
                ) : (
                  <>
                    <LuClock className="canvas-timer-icon" />
                    <span className="canvas-timer-text">{timeLeft}s</span>
                  </>
                )}
              </div>

              {/* Word Pattern / Secret Word HUD element */}
              {isWordle ? (
                <div className="canvas-word-pill wordle-phase">
                  <span className={`wordle-nav-phase ${roomState?.wordleState?.phase === 1 ? 'blind' : 'draw'}`}>
                    {roomState?.wordleState?.phase === 1 ? <><LuLock className="btn-icon-xs" /> Blind Phase</> : <><LuPencil className="btn-icon-xs" /> Drawing Phase</>}
                  </span>
                  {isDrawer && currentWordDisplay ? (
                    <div className="canvas-drawer-word-inline">
                      <span className="canvas-word-tag">WORD:</span>
                      {renderDrawerWord(currentWordDisplay)}
                    </div>
                  ) : null}
                </div>
              ) : isDrawer && roomState?.status === 'playing' && currentWordDisplay ? (
                <div className="canvas-word-pill is-drawer">
                  <span className="canvas-word-tag">DRAW:</span>
                  {renderDrawerWord(currentWordDisplay)}
                </div>
              ) : !isDrawer && roomState?.status === 'playing' && roomState?.wordHint ? (
                <div className="canvas-word-pill is-guesser">
                  <span className="canvas-word-tag">GUESS:</span>
                  {renderWordHint(roomState.wordHint)}
                </div>
              ) : null}
            </div>
          )}

          {/* Canvas Wrapper: Slightly resized for guesser, full-size for drawer */}
          <div className={`canvas-wrapper-relative ${!isDrawer ? 'is-guesser-canvas' : 'is-drawer-canvas'}`}>
            <DrawingCanvas socket={socket} roomId={roomId} isDrawer={isDrawingAllowed} status={roomState?.status} />

            {/* OVERLAY: Blind Phase Canvas Lock for Drawer in Wordle */}
            {isWordle && isDrawer && roomState?.status === 'playing' && roomState?.wordleState?.isDrawerLocked && (
              <div className="canvas-blind-phase-overlay">
                <LuLock className="blind-phase-icon" />
                <h3>Phase 1: Blind Guessing</h3>
                <p>Drawing is locked for Guesses 1 & 2. Players are attempting deduction blindly. Canvas unlocks in Phase 2!</p>
              </div>
            )}

            {/* OVERLAY 1: Lobby Overlay (Waiting / Start Game) */}
            {(roomState?.status === 'lobby' || roomState?.status === 'starting') && (
              <div className="lobby-canvas-overlay">
                <h2>{roomState?.status === 'starting' ? 'Starting Game...' : 'Game Lobby'}</h2>
                <p className="overlay-subtitle">
                  {roomState?.status === 'starting'
                    ? 'Preparing rounds and canvas...'
                    : `${(roomState?.players?.length || 0)} / ${roomState?.settings?.maxPlayers || 8} Players Joined`}
                </p>

                <div className="lobby-voice-setting-row">
                  <span className="lobby-voice-label">Voice Chat:</span>
                  {isHost ? (
                    <button
                      type="button"
                      className={`lobby-voice-toggle-btn ${roomState?.settings?.voiceChatEnabled ? 'is-enabled' : 'is-disabled'}`}
                      onClick={() => handleSetVoiceChat(!roomState?.settings?.voiceChatEnabled)}
                      title="Click to toggle microphone access for all players"
                    >
                      {roomState?.settings?.voiceChatEnabled ? (
                        <><LuMic className="btn-icon-xs" /> Mic: Enabled (Click to Disable)</>
                      ) : (
                        <><LuMicOff className="btn-icon-xs" /> Mic: Disabled (Click to Enable)</>
                      )}
                    </button>
                  ) : (
                    <span className={`lobby-voice-badge ${roomState?.settings?.voiceChatEnabled ? 'is-enabled' : 'is-disabled'}`}>
                      {roomState?.settings?.voiceChatEnabled ? (
                        <><LuMic className="btn-icon-xs" /> Mic Enabled</>
                      ) : (
                        <><LuMicOff className="btn-icon-xs" /> Mic Disabled by Host</>
                      )}
                    </span>
                  )}
                </div>

                <div className="lobby-voice-setting-row">
                  <span className="lobby-voice-label">Power-Ups:</span>
                  {isHost ? (
                    <button
                      type="button"
                      className={`lobby-voice-toggle-btn ${roomState?.settings?.powerupsEnabled !== false ? 'is-enabled' : 'is-disabled'}`}
                      onClick={() => handleSetPowerups(roomState?.settings?.powerupsEnabled === false)}
                      title="Click to toggle Power-Ups"
                    >
                      {roomState?.settings?.powerupsEnabled !== false ? (
                        <><LuZap className="btn-icon-xs" /> Power-Ups: Enabled (Click to Disable)</>
                      ) : (
                        <><LuZap className="btn-icon-xs" /> Power-Ups: Disabled (Click to Enable)</>
                      )}
                    </button>
                  ) : (
                    <span className={`lobby-voice-badge ${roomState?.settings?.powerupsEnabled !== false ? 'is-enabled' : 'is-disabled'}`}>
                      {roomState?.settings?.powerupsEnabled !== false ? (
                        <><LuZap className="btn-icon-xs" /> Power-Ups Enabled</>
                      ) : (
                        <><LuZap className="btn-icon-xs" /> Power-Ups Disabled by Host</>
                      )}
                    </span>
                  )}
                </div>

                {isHost ? (
                  <>
                    <button
                      className={`start-game-btn ${isStartingGame || roomState?.status === 'starting' ? 'is-loading' : ''}`}
                      onClick={handleStartGame}
                      disabled={isStartingGame || roomState?.status === 'starting' || (roomState?.players?.length || 0) < 2}
                      title={(roomState?.players?.length || 0) < 2 ? 'At least 2 players are needed to start the game' : 'Start game now'}
                    >
                      {isStartingGame || roomState?.status === 'starting' ? (
                        <>
                          <span className="spinner-mini" /> STARTING GAME...
                        </>
                      ) : (roomState?.players?.length || 0) < 2 ? (
                        <>
                          <LuPlay className="btn-play-icon" /> START GAME (NEED 2+ PLAYERS)
                        </>
                      ) : (
                        <>
                          <LuPlay className="btn-play-icon" /> START GAME NOW
                        </>
                      )}
                    </button>
                    {(roomState?.players?.length || 0) < 2 && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                        Waiting for at least 1 more player to join to begin the match.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="waiting-host-box">
                    <span className="pulse-dot" />
                    <span>
                      {(roomState?.players?.length || 0) < 2
                        ? 'Waiting for at least 2 players to join...'
                        : roomState?.status === 'starting'
                        ? 'Game is starting...'
                        : 'Waiting for room host to start...'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* OVERLAY: Word Selection Waiting for Guessers */}
            {roomState?.status === 'wordSelection' && !isDrawer && (
              <div className="round-starting-overlay">
                <div className="round-starting-card">
                  <div className="round-starting-logo-box">
                    <SquiggleLogoMark size={64} id="wsWaitGrad" />
                  </div>
                  <h2>Round {roomState.currentRound || 1} Starting!</h2>
                  <p className="round-starting-drawer-text">
                    <strong>{roomState.currentDrawer?.username || 'The drawer'}</strong> is choosing a word...
                  </p>
                  <p className="round-starting-sub">Get ready to deduce and sketch!</p>
                </div>
              </div>
            )}

            {/* OVERLAY: Round Started Splash */}
            {roundSplash && (
              <div className="round-started-splash-overlay">
                <div className="round-started-splash-card">
                  <div className="splash-logo-pulse">
                    <SquiggleLogoMark size={70} id="roundSplashGrad" />
                  </div>
                  <span className="splash-round-pill">
                    Round {roundSplash.round} of {roundSplash.totalRounds || roomState?.settings?.rounds || 3}
                  </span>
                  <h2>{roundSplash.drawerName ? `${roundSplash.drawerName}'s Turn!` : 'Round Started!'}</h2>
                  <p className="splash-role-info">
                    {isDrawer ? (
                      <>You are the <strong>Drawer</strong>! Sketch the secret word.</>
                    ) : (
                      <><strong>{roomState?.currentDrawer?.username || 'The drawer'}</strong> is drawing. Make your deduction!</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* OVERLAY 2: Word Selection Modal (Drawer only) */}
            {roomState?.wordChoices && isDrawer && roomState.status === 'wordSelection' && (
              <div className="word-selection-overlay">
                <div className="word-selection-card">
                  <div style={{ marginBottom: '8px' }}>
                    <SquiggleLogoMark size={40} id="wsDrawerGrad" />
                  </div>
                  <h3>Choose a word to draw!</h3>
                  <div className="word-choices-grid">
                    {roomState.wordChoices.map((word) => {
                      const len = word.length;
                      const fontSize =
                        len >= 14 ? '0.72rem' :
                        len >= 12 ? '0.78rem' :
                        len >= 10 ? '0.82rem' :
                        len >= 8  ? '0.90rem' : '1.02rem';
                      return (
                        <button
                          key={word}
                          className="word-choice-btn"
                          style={{ fontSize }}
                          onClick={() => {
                            socket.emit('wordSelected', { roomId, word });
                            setRoomState((s) => ({
                              ...s,
                              wordChoices: null,
                              selectedWord: word,
                              currentWord: word,
                              status: 'playing',
                            }));
                          }}
                          title={word}
                        >
                          <span className="word-choice-text">{word}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="auto-pick-timer">Auto-picking in {timeLeft}s...</p>
                </div>
              </div>
            )}

            {/* OVERLAY: Freeze Time Waiting Banner for other players */}
            {freezeState?.active && freezeState.userSocketId !== socket.id && timeLeft <= 0 && (
              <div className="freeze-time-canvas-banner">
                <div className="freeze-canvas-banner-card">
                  <LuSnowflake className="freeze-banner-snowflake" />
                  <div className="freeze-banner-text">
                    <span><strong>{freezeState.username}</strong> used Freeze Time! Wait for them to finish...</span>
                    <span className="freeze-banner-remaining">({freezeState.freezeSecondsRemaining}s remaining)</span>
                  </div>
                </div>
              </div>
            )}

            {/* OVERLAY 3: Round Ended Reveal */}
            {roomState?.status === 'roundEnding' && (
              <div className="round-ended-overlay">
                <div className="round-ended-card">
                  <h2>Round Completed! <LuCircleCheck style={{ color: '#10b981', marginLeft: '6px', verticalAlign: '-2px' }} /></h2>
                  <p className="revealed-word-label">The secret word was:</p>
                  <div className="revealed-word-box">{roomState.revealedWord || roomState.currentWord}</div>
                  <p className="next-round-countdown">Next round starting shortly...</p>
                </div>
              </div>
            )}

            {/* OVERLAY 4: Game Ended Canvas Overlay (Top 3 or Top 1 Ranking Podium) */}
            {roomState?.status === 'finished' && !showFinalDrawing && (
              <div className="game-ended-canvas-overlay">
                <div className="game-ended-card">
                  {/* Header */}
                  <div className="game-ended-header-box">
                    <div className="game-ended-trophy-ring">
                      <LuTrophy className="game-ended-trophy-svg" />
                    </div>
                    <h2 className="game-ended-title">
                      {roomState?.endReason === 'insufficient_players' || sortedPlayers.length <= 1
                        ? 'Victory by Default!'
                        : 'Game Over!'}
                    </h2>
                    <p className="game-ended-sub-msg">
                      {roomState?.endReason === 'insufficient_players' || sortedPlayers.length <= 1
                        ? 'All other players left the room.'
                        : (roomState?.winner ? `${roomState.winner} won the match!` : 'Match concluded!')}
                    </p>
                  </div>

                  {/* Top 3 (or Top 1) Podium */}
                  <div className={`game-ended-podium-container podium-count-${Math.min(3, sortedPlayers.length)}`}>
                    {sortedPlayers.length >= 3 ? (
                      <>
                        {/* 2nd Place */}
                        <div className="podium-col rank-2">
                          <div className="podium-player-avatar-wrap">
                            <Avatar avatar={sortedPlayers[1]?.avatar} size={50} username={sortedPlayers[1]?.username} />
                            <span className="podium-rank-badge badge-silver">2</span>
                          </div>
                          <div className="podium-player-name" title={sortedPlayers[1]?.username}>
                            {sortedPlayers[1]?.username}
                          </div>
                          <div className="podium-player-score">{sortedPlayers[1]?.score || 0} pts</div>
                          <div className="podium-bar bar-silver">
                            <span>2nd</span>
                          </div>
                        </div>

                        {/* 1st Place */}
                        <div className="podium-col rank-1 is-first">
                          <div className="podium-crown-tag"><LuCrown /></div>
                          <div className="podium-player-avatar-wrap">
                            <Avatar avatar={sortedPlayers[0]?.avatar} size={64} username={sortedPlayers[0]?.username} />
                            <span className="podium-rank-badge badge-gold">1</span>
                          </div>
                          <div className="podium-player-name" title={sortedPlayers[0]?.username}>
                            {sortedPlayers[0]?.username}
                          </div>
                          <div className="podium-player-score">{sortedPlayers[0]?.score || 0} pts</div>
                          <div className="podium-bar bar-gold">
                            <span>1st</span>
                          </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="podium-col rank-3">
                          <div className="podium-player-avatar-wrap">
                            <Avatar avatar={sortedPlayers[2]?.avatar} size={46} username={sortedPlayers[2]?.username} />
                            <span className="podium-rank-badge badge-bronze">3</span>
                          </div>
                          <div className="podium-player-name" title={sortedPlayers[2]?.username}>
                            {sortedPlayers[2]?.username}
                          </div>
                          <div className="podium-player-score">{sortedPlayers[2]?.score || 0} pts</div>
                          <div className="podium-bar bar-bronze">
                            <span>3rd</span>
                          </div>
                        </div>
                      </>
                    ) : sortedPlayers.length === 2 ? (
                      <>
                        {/* 1st Place */}
                        <div className="podium-col rank-1 is-first">
                          <div className="podium-crown-tag"><LuCrown /></div>
                          <div className="podium-player-avatar-wrap">
                            <Avatar avatar={sortedPlayers[0]?.avatar} size={62} username={sortedPlayers[0]?.username} />
                            <span className="podium-rank-badge badge-gold">1</span>
                          </div>
                          <div className="podium-player-name" title={sortedPlayers[0]?.username}>
                            {sortedPlayers[0]?.username}
                          </div>
                          <div className="podium-player-score">{sortedPlayers[0]?.score || 0} pts</div>
                          <div className="podium-bar bar-gold">
                            <span>1st</span>
                          </div>
                        </div>

                        {/* 2nd Place */}
                        <div className="podium-col rank-2">
                          <div className="podium-player-avatar-wrap">
                            <Avatar avatar={sortedPlayers[1]?.avatar} size={52} username={sortedPlayers[1]?.username} />
                            <span className="podium-rank-badge badge-silver">2</span>
                          </div>
                          <div className="podium-player-name" title={sortedPlayers[1]?.username}>
                            {sortedPlayers[1]?.username}
                          </div>
                          <div className="podium-player-score">{sortedPlayers[1]?.score || 0} pts</div>
                          <div className="podium-bar bar-silver">
                            <span>2nd</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* 1 Player Left */
                      <div className="podium-col rank-1 is-solo-winner">
                        <div className="podium-crown-tag"><LuCrown /></div>
                        <div className="podium-player-avatar-wrap">
                          <Avatar avatar={sortedPlayers[0]?.avatar} size={72} username={sortedPlayers[0]?.username} />
                          <span className="podium-rank-badge badge-gold">1</span>
                        </div>
                        <div className="podium-player-name" title={sortedPlayers[0]?.username}>
                          {sortedPlayers[0]?.username}
                        </div>
                        <div className="podium-player-score">{sortedPlayers[0]?.score || 0} pts</div>
                        <div className="podium-bar bar-solo">
                          <span>Champion</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="game-ended-actions">
                    {isHost && (
                      <button
                        type="button"
                        className="btn-game-ended-action btn-game-ended-playagain"
                        onClick={handlePlayAgain}
                        title="Reset room for another game"
                      >
                        <LuRotateCcw className="btn-icon-xs" /> Play Again
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-game-ended-action btn-game-ended-leave"
                      onClick={handleLeaveRoom}
                      title="Return to lobby"
                    >
                      <LuArrowLeft className="btn-icon-xs" /> Return to Lobby
                    </button>

                    <button
                      type="button"
                      className="btn-game-ended-action btn-game-ended-viewcanvas"
                      onClick={() => setShowFinalDrawing(true)}
                      title="View canvas drawing without overlay"
                    >
                      <LuEye className="btn-icon-xs" /> View Drawing
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Minimized floating button to restore overlay when inspecting canvas */}
            {roomState?.status === 'finished' && showFinalDrawing && (
              <button
                type="button"
                className="btn-restore-ended-overlay"
                onClick={() => setShowFinalDrawing(false)}
                title="Show match results"
              >
                <LuTrophy className="btn-icon-xs" />
                <span>Show Results</span>
              </button>
            )}
          </div>

          {/* 7 & 8. DEDICATED GUESS BAR DIRECTLY UNDERNEATH CANVAS (GUESSER ONLY) */}
          {!isDrawer && (
            <div className="guesser-bottom-bar-wrapper">
              <form className="guesser-control-bar" onSubmit={handleGuessSubmit}>
                <div className="guesser-bar-tag">
                  <LuTarget className="guesser-target-icon" />
                  <span>I Think...</span>
                </div>

                <div className="guesser-bar-input-wrap">
                  <input
                    type="text"
                    className="guesser-bar-input"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder={
                      roomState?.status !== 'playing'
                        ? 'Waiting for round to start...'
                        : isWordle
                        ? `Type 5-letter deduction (${6 - (roomState?.wordleState?.guesses?.length || 0)} tries left)...`
                        : 'Type your guess here...'
                    }
                    disabled={roomState?.status !== 'playing' || requestedRole === 'spectator'}
                    autoComplete="off"
                    maxLength={isWordle ? 5 : 40}
                  />
                </div>

                <button
                  type="submit"
                  className="guesser-bar-submit-btn"
                  disabled={!guess.trim() || roomState?.status !== 'playing' || requestedRole === 'spectator'}
                  title="Submit your guess"
                >
                  <span>GUESS</span>
                  <LuArrowRight className="guesser-btn-arrow" />
                </button>
              </form>

              {/* If Wordle mode is active, also render the compact Wordle keyboard/board underneath */}
              {isWordle && roomState?.status === 'playing' && (
                <div className="guesser-wordle-board-container">
                  <WordleBoard
                    wordleState={roomState?.wordleState}
                    isDrawer={false}
                    onKeyInput={(letter) => {
                      if (letter === 'ENTER') {
                        handleGuessSubmit();
                      } else if (letter === 'BACKSPACE') {
                        setGuess((prev) => prev.slice(0, -1));
                      } else if (guess.length < 5) {
                        setGuess((prev) => (prev + letter).toUpperCase());
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Drawer Banner when Drawer is drawing */}
          {isDrawer && roomState?.status === 'playing' && (
            <div className="drawer-active-banner">
              <LuPaintbrush className="drawer-banner-icon" />
              <span>You are drawing! Watch player guesses in live chat.</span>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Live Chat Full Height */}
        <aside className="game-right-col">
          <div className="chat-header">
            <div className="chat-header-title">
              <LuMessageSquare className="chat-header-icon" />
              <span>LIVE CHAT</span>
            </div>
            <span className="chat-online-badge">
              <span className="online-green-dot" /> {(roomState?.players?.length || 1)} online
            </span>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => {
              const isSystem = message.type === 'system';
              const senderName = isSystem ? 'System' : message.username || message.sender || 'Unknown';
              const msgTime = message.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              if (isSystem) {
                return (
                  <div key={`${index}-${message.text}`} className="chat-msg-card system">
                    <div className="chat-sys-content">
                      <LuInfo className="chat-sys-icon" />
                      <span>{cleanSystemMessage(message.text)}</span>
                    </div>
                    <span className="chat-msg-time">{msgTime}</span>
                  </div>
                );
              }

              return (
                <div key={`${index}-${message.text}-${index}`} className="chat-msg-card player">
                  <div className="chat-msg-header">
                    <span className="chat-sender-name">{senderName}</span>
                    <span className="chat-msg-time">{msgTime}</span>
                  </div>
                  <div className="chat-msg-text">{message.text}</div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          <div className="chat-input-area" ref={emojiPickerRef}>
            {/* Popover for Full Emojis + Text Emojis */}
            {showEmojiPicker && (
              <div className="chat-emoji-popover">
                <div className="emoji-popover-tabs">
                  <button
                    type="button"
                    className={`emoji-tab-btn ${emojiTab === 'emojis' ? 'active' : ''}`}
                    onClick={() => setEmojiTab('emojis')}
                  >
                    Emojis
                  </button>
                  <button
                    type="button"
                    className={`emoji-tab-btn ${emojiTab === 'text' ? 'active' : ''}`}
                    onClick={() => setEmojiTab('text')}
                  >
                    Text Emojis
                  </button>
                </div>

                <div className="emoji-popover-body">
                  {emojiTab === 'emojis' ? (
                    <div className="emoji-grid">
                      {POPULAR_EMOJIS.map((em, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="emoji-grid-item"
                          onClick={() => handleInsertEmoji(em)}
                          title={`Insert ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-emoji-grid">
                      {TEXT_EMOJIS.map((tem, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="text-emoji-item"
                          onClick={() => handleInsertEmoji(tem)}
                          title={`Insert ${tem}`}
                        >
                          {tem}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <form className="chat-composer-form" onSubmit={handleSendChat}>
              <div className="chat-input-box">
                <input
                  ref={chatInputRef}
                  name="chatInput"
                  type="text"
                  className="chat-input-modern"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a chat message..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  className={`chat-smile-btn ${showEmojiPicker ? 'active' : ''}`}
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  title="Emoji & text emoji panel"
                >
                  <LuSmile className="chat-smile-icon" />
                </button>
              </div>
              <button
                type="submit"
                className="chat-send-btn"
                title="Send message"
                disabled={!chatInput.trim()}
              >
                <LuSend className="send-plane-icon" />
              </button>
            </form>
          </div>
        </aside>
      </main>

      {/* Hidden WebRTC Remote Audio Elements */}
      {Object.entries(remoteStreams).map(([socketId, stream]) => {
        if (!stream) return null;
        return (
          <audio
            key={socketId}
            ref={(el) => {
              if (el) {
                el.srcObject = stream;
                el.volume = 1.0;
              }
            }}
            autoPlay
            playsInline
            muted={false}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
          />
        );
      })}

      {/* Vote Kick Toast Notification */}
      {voteNotice && (
        <div className="vote-kick-toast-notification">
          <LuInfo className="vote-toast-icon" />
          <span>{voteNotice}</span>
        </div>
      )}

      {/* Active Vote Kick Floating Modal */}
      {activeVote && (
        <div className="vote-kick-modal-overlay">
          <div className="vote-kick-card">
            <div className="vote-kick-card-header">
              <span className="vote-kick-badge">
                <LuVote className="vote-badge-icon" /> VOTE KICK
              </span>
              <span className="vote-kick-timer">
                <LuClock className="vote-timer-icon" /> {activeVote.timeLeft}s
              </span>
            </div>

            <div className="vote-kick-body">
              <p className="vote-kick-title">
                Kick <strong>{activeVote.targetUsername}</strong> from match?
              </p>
              <p className="vote-kick-initiator">
                Initiated by <span>{activeVote.initiatorUsername}</span>
              </p>

              <div className="vote-kick-progress-bar-wrap">
                <div
                  className="vote-kick-progress-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.round(((activeVote.currentVotes || activeVote.yesVotes || 1) / (activeVote.votesRequired || 1)) * 100))}%`
                  }}
                />
              </div>

              <div className="vote-kick-stats-row">
                <span>Yes: <strong>{activeVote.currentVotes || activeVote.yesVotes || 1}</strong> / {activeVote.votesRequired} needed</span>
                {activeVote.noVotes !== undefined && (
                  <span>No: <strong>{activeVote.noVotes}</strong></span>
                )}
              </div>

              {socket.id === activeVote.targetSocketId ? (
                <div className="vote-kick-status-msg vote-kick-status-msg--warning">
                  <LuCircleAlert className="vote-msg-icon" /> A vote kick has been called against you.
                </div>
              ) : hasVoted ? (
                <div className="vote-kick-status-msg vote-kick-status-msg--voted">
                  <LuCircleCheck className="vote-msg-icon" /> Your vote has been recorded!
                </div>
              ) : (
                <div className="vote-kick-action-buttons">
                  <button
                    className="btn-vote-yes"
                    onClick={() => {
                      socket.emit('castVoteKick', { roomId, vote: true });
                      setHasVoted(true);
                    }}
                  >
                    <LuCheck className="btn-vote-icon" /> Vote Yes
                  </button>
                  <button
                    className="btn-vote-no"
                    onClick={() => {
                      socket.emit('castVoteKick', { roomId, vote: false });
                      setHasVoted(true);
                    }}
                  >
                    <LuX className="btn-vote-icon" /> Vote No
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kicked from room full-screen overlay */}
      {kickedModal && (
        <div className="kicked-overlay-backdrop">
          <div className="kicked-modal-card">
            <div className="kicked-icon">
              <LuBan className="kicked-ban-icon" />
            </div>
            <h2 className="kicked-title">You Were Vote-Kicked</h2>
            <p className="kicked-text">{kickedModal}</p>
            <div className="kicked-penalty-chip">
              <LuCoins className="penalty-coin-icon" />
              <span>Penalty:</span>
              <strong>-50 Gold Coins</strong>
            </div>
            <button
              className="btn-kicked-home"
              onClick={() => navigate('/')}
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}