import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  FaUserSlash,
  FaVoteYea,
  FaStopwatch,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCoins,
  FaBan,
  FaInfoCircle,
  FaLock,
  FaPencilAlt,
  FaArrowLeft,
  FaPlay,
  FaTrophy,
  FaCopy,
  FaMicrophone,
  FaMicrophoneSlash,
  FaUserCircle,
  FaUsers,
  FaUserPlus,
  FaCrown,
  FaVolumeUp,
  FaVolumeMute,
  FaCommentDots,
  FaSmile,
  FaPaperPlane,
  FaGamepad,
  FaLightbulb,
  FaPaintBrush,
  FaArrowRight,
  FaSnowflake,
  FaBolt,
  FaGem
} from 'react-icons/fa';
import DrawingCanvas from '../components/DrawingCanvas';
import WordleBoard from '../components/WordleBoard';
import DraggableGuessWindow from '../components/DraggableGuessWindow';
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
  const [guessWindowOpen, setGuessWindowOpen] = useState(true);
  const [freezeState, setFreezeState] = useState(null);
  const [extraCluesData, setExtraCluesData] = useState(null);

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
      setRoomState((state) => (state ? { ...state, status: 'playing', ...round } : state));
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

    socket.on('gameEnded', ({ winner, players }) => {
      setIsStartingGame(false);
      setFreezeState(null);
      setExtraCluesData(null);
      setRoomState((state) => (state ? { ...state, status: 'finished', winner, players: players || state.players } : state));
      setMessages((items) => [...items, { type: 'system', text: `Game Over! Winner: ${winner || 'Nobody'}` }]);
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

  const isDrawer = roomState?.currentDrawer?.socketId === socket.id;
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
    if (isStartingGame || roomState?.status === 'starting' || (roomState?.players?.length || 0) < 1) return;
    setIsStartingGame(true);
    socket.emit('startGame', { roomId });
  };

  const currentWordDisplay = roomState?.currentWord || roomState?.selectedWord;

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
        {/* Left: Leave Button (Leftest in Red Box) & Logo */}
        <div className="nav-left">
          <button className="leave-room-box-btn" onClick={handleLeaveRoom} title="Leave Game Room">
            <FaArrowLeft className="btn-icon-xs" /> Leave Room
          </button>
          <button className="nav-logo" onClick={handleLeaveRoom} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Squiggle">
            <SquiggleLogo height={32} />
          </button>
        </div>

        {/* Center: Live Round */}
        <div className="nav-center">
          <span className="round-badge">
            ROUND {roomState?.currentRound || 1}/{roomState?.settings?.rounds || 3}
          </span>
        </div>

        {/* Right: Room Code, User */}
        <div className="nav-right">
          <div className="room-code-badge">
            <span className="code-label">Room Code:</span>
            <strong className="code-value">{roomId}</strong>
          </div>

          <div className="user-profile-pill">
            <FaUserCircle className="user-profile-avatar" />
            <span className="user-profile-name">{activeUser?.username || 'Player'}</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Content (100vh - 48px) */}
      <main className={`game-main-content ${isWordle ? 'is-wordle-mode' : ''}`}>
        {error && (
          <div className="game-error-banner">
            <FaExclamationTriangle style={{ marginRight: '6px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* LEFT SIDEBAR: Players */}
        <aside className="game-left-col">
          <div className="players-header">
            <div className="players-header-title-box">
              <FaUsers className="players-header-icon" />
              <span>PLAYERS ({(roomState?.players?.length || 0)}/{(roomState?.settings?.maxPlayers || 8)})</span>
            </div>

            {/* Mic icon beside players(x/y) */}
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
                    <FaMicrophoneSlash className="header-mic-icon mic-red" />
                  ) : (
                    <FaMicrophone className="header-mic-icon mic-green" />
                  )}
                </button>
              ) : (
                <div
                  className="players-header-mic-btn is-disabled"
                  title="Voice chat disabled by host"
                >
                  <FaMicrophoneSlash className="header-mic-icon mic-off" />
                </div>
              )
            )}
          </div>
          <div className="players-list">
            {sortedPlayers.map((player) => {
              const isDrawing = player.socketId === currentDrawerId;
              const isPlayerHost = player.isHost !== undefined
                ? !!player.isHost
                : (roomState?.hostUserId && player.userId
                    ? String(roomState.hostUserId) === String(player.userId)
                    : (roomState?.hostId ? (player.socketId === roomState.hostId || player.userId === roomState.hostId) : false));
              const rank = playerRankMap[player.socketId || player.userId] || 1;

              return (
                <div key={player.socketId || player.userId} className={`player-card-vertical ${isPlayerHost ? 'is-host' : ''} ${isDrawing ? 'is-drawing' : ''}`}>
                  <div className="player-card-left">
                    <div className={`player-avatar-circle rank-badge-${rank <= 3 ? rank : 'default'}`} title={`Rank ${rank} • ${player.score || 0} pts`}>
                      <span className="player-rank-number">{rank}</span>
                    </div>
                    <div className="player-meta-box">
                      <div className="player-name-row">
                        <span className="player-name-text" title={player.username}>{player.username}</span>
                        {roomState?.settings?.voiceChatEnabled && (
                          <span className="player-mic-mini">
                            {player.isMuted ? <FaMicrophoneSlash className="mic-muted-red" /> : <FaMicrophone className="mic-on-green" />}
                          </span>
                        )}
                      </div>
                      <span className="player-score-text">{player.score || 0} pts</span>
                    </div>
                  </div>

                  <div className="player-card-right">
                    {isPlayerHost ? (
                      <span className="host-badge-pill">
                        <FaCrown className="crown-icon" /> Host
                      </span>
                    ) : (
                      <div className="player-mod-actions">
                        {/* Vote-kick trigger for other players */}
                        {player.socketId !== socket.id && (
                          <button
                            className="btn-player-kick"
                            title={`Call vote to kick ${player.username}`}
                            onClick={() => socket.emit('startVoteKick', { roomId, targetSocketId: player.socketId })}
                            disabled={activeVote !== null}
                          >
                            <FaUserSlash className="btn-icon-xs" /> Kick
                          </button>
                        )}

                        {/* Host controls to force mute other active players */}
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
                            {player.isMuted ? <><FaVolumeUp className="btn-icon-xs" /> Unmute</> : <><FaVolumeMute className="btn-icon-xs" /> Mute</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decorative floating dots/curves in empty player space */}
          <div className="players-ambient-decor">
            <span className="decor-dot dot-1" />
            <span className="decor-dot dot-2" />
            <span className="decor-dot dot-3" />
            <svg className="decor-squiggle-curve" viewBox="0 0 160 50" fill="none">
              <path d="M10 35 C 40 10, 80 45, 110 20 C 130 5, 150 25, 155 30" stroke="rgba(124, 77, 255, 0.18)" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          {/* Invite Friends Button at bottom with copied popup toast */}
          <div className="invite-friends-wrapper">
            {copySuccess && (
              <div className="invite-copied-toast">
                <FaCheckCircle className="toast-check-icon" />
                <span>Room link copied to clipboard!</span>
              </div>
            )}
            <button
              className={`invite-friends-btn ${copySuccess ? 'is-copied' : ''}`}
              onClick={handleCopyInvite}
              title="Copy room link to invite friends"
            >
              {copySuccess ? (
                <>
                  <FaCheck className="btn-icon-sm" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <FaUserPlus className="btn-icon-sm" />
                  <span>Invite Friends</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* CENTER COLUMN: Canvas & Canvas Overlays (NO SCROLLING) */}
        <section className="game-mid-col">
          {/* Top Bar above Canvas: Clock/Timer + Word Display */}
          {(roomState?.status === 'playing' || roomState?.status === 'wordSelection') && (
            <div className="canvas-header-bar">
              {/* Freeze Red Timer popup to the left of normal timer */}
              {freezeState?.active && freezeState.userSocketId === socket.id && (
                <div className="canvas-freeze-red-timer" title="Active Freeze Time Countdown">
                  <FaSnowflake className="freeze-pulse-icon" />
                  <span>+{freezeState.freezeSecondsRemaining}s FREEZE</span>
                </div>
              )}

              {/* Clock Timer - big and prominent */}
              <div className={`canvas-timer-pill ${timeLeft <= 10 && !(freezeState?.active && freezeState.userSocketId === socket.id) ? 'warn' : ''} ${freezeState?.active && freezeState.userSocketId === socket.id ? 'is-frozen' : ''}`}>
                {freezeState?.active && freezeState.userSocketId === socket.id ? (
                  <>
                    <FaSnowflake className="canvas-timer-icon freeze-snow-icon" />
                    <span className="canvas-timer-text">{freezeState.normalTimeFrozenAt ?? timeLeft}s (FROZEN)</span>
                  </>
                ) : (
                  <>
                    <FaStopwatch className="canvas-timer-icon" />
                    <span className="canvas-timer-text">{timeLeft}s</span>
                  </>
                )}
              </div>

              {/* Word Display (Draw / Guess / Wordle Phase) */}
              {isWordle ? (
                <div className="canvas-word-pill wordle-phase">
                  <span className={`wordle-nav-phase ${roomState?.wordleState?.phase === 1 ? 'blind' : 'draw'}`}>
                    {roomState?.wordleState?.phase === 1 ? <><FaLock className="btn-icon-xs" /> Blind Phase</> : <><FaPencilAlt className="btn-icon-xs" /> Drawing Phase</>}
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

          <div className="canvas-wrapper-relative">
            <DrawingCanvas socket={socket} roomId={roomId} isDrawer={isDrawingAllowed} status={roomState?.status} />

            {/* OVERLAY: Blind Phase Canvas Lock for Drawer */}
            {isWordle && isDrawer && roomState?.status === 'playing' && roomState?.wordleState?.isDrawerLocked && (
              <div className="canvas-blind-phase-overlay">
                <FaLock className="blind-phase-icon" />
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
                        <><FaMicrophone className="btn-icon-xs" /> Mic: Enabled (Click to Disable)</>
                      ) : (
                        <><FaMicrophoneSlash className="btn-icon-xs" /> Mic: Disabled (Click to Enable)</>
                      )}
                    </button>
                  ) : (
                    <span className={`lobby-voice-badge ${roomState?.settings?.voiceChatEnabled ? 'is-enabled' : 'is-disabled'}`}>
                      {roomState?.settings?.voiceChatEnabled ? (
                        <><FaMicrophone className="btn-icon-xs" /> Mic Enabled</>
                      ) : (
                        <><FaMicrophoneSlash className="btn-icon-xs" /> Mic Disabled by Host</>
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
                      title="Click to toggle Power-Ups (Hint Steal, Extra Clues, Freeze Time)"
                    >
                      {roomState?.settings?.powerupsEnabled !== false ? (
                        <><FaBolt className="btn-icon-xs" /> Power-Ups: Enabled (Click to Disable)</>
                      ) : (
                        <><FaBolt className="btn-icon-xs" /> Power-Ups: Disabled (Click to Enable)</>
                      )}
                    </button>
                  ) : (
                    <span className={`lobby-voice-badge ${roomState?.settings?.powerupsEnabled !== false ? 'is-enabled' : 'is-disabled'}`}>
                      {roomState?.settings?.powerupsEnabled !== false ? (
                        <><FaBolt className="btn-icon-xs" /> Power-Ups Enabled</>
                      ) : (
                        <><FaBolt className="btn-icon-xs" /> Power-Ups Disabled by Host</>
                      )}
                    </span>
                  )}
                </div>

                {isHost ? (
                  <button
                    className={`start-game-btn ${isStartingGame || roomState?.status === 'starting' ? 'is-loading' : ''}`}
                    onClick={handleStartGame}
                    disabled={isStartingGame || roomState?.status === 'starting' || (roomState?.players?.length || 0) < 1}
                  >
                    {isStartingGame || roomState?.status === 'starting' ? (
                      <>
                        <span className="spinner-mini" /> STARTING GAME...
                      </>
                    ) : (
                      <>
                        <FaPlay className="btn-play-icon" /> START GAME NOW
                      </>
                    )}
                  </button>
                ) : (
                  <div className="waiting-host-box">
                    <span className="pulse-dot" />
                    <span>{roomState?.status === 'starting' ? 'Game is starting...' : 'Waiting for room host to start...'}</span>
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

            {/* OVERLAY: Round Started Splash (Active for 2.5s on roundStarted) */}
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
                      const fontSize = len > 14 ? '0.78rem' : len > 11 ? '0.86rem' : len > 8 ? '0.94rem' : '1.02rem';
                      return (
                        <button
                          key={word}
                          className="word-choice-btn"
                          style={{ fontSize }}
                          onClick={() => {
                            socket.emit('wordSelected', { roomId, word });
                            setRoomState((s) => ({ ...s, wordChoices: null, selectedWord: word, currentWord: word }));
                          }}
                          title={word}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                  <p className="auto-pick-timer">Auto-picking in {timeLeft}s...</p>
                </div>
              </div>
            )}

            {/* OVERLAY: Freeze Time Waiting Banner for other players when normal time expires */}
            {freezeState?.active && freezeState.userSocketId !== socket.id && timeLeft <= 0 && (
              <div className="freeze-time-canvas-banner">
                <div className="freeze-canvas-banner-card">
                  <FaSnowflake className="freeze-banner-snowflake" />
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
                  <h2>Round Completed! <FaCheckCircle style={{ color: '#10b981', marginLeft: '6px', verticalAlign: '-2px' }} /></h2>
                  <p className="revealed-word-label">The secret word was:</p>
                  <div className="revealed-word-box">{roomState.revealedWord || roomState.currentWord}</div>
                  <p className="next-round-countdown">Next round starting shortly...</p>
                </div>
              </div>
            )}

            {/* OVERLAY 4: Game Ended Podium */}
            {roomState?.status === 'finished' && (
              <div className="game-ended-overlay">
                <div className="game-ended-card">
                  <h2><FaTrophy style={{ color: '#f59e0b', marginRight: '8px', verticalAlign: '-2px' }} /> Game Over!</h2>
                  <p className="winner-announcement">
                    Winner: <strong>{roomState.winner || sortedPlayers[0]?.username || 'Player'}</strong>!
                  </p>
                  <div className="podium-scores-list">
                    {sortedPlayers.slice(0, 5).map((p, idx) => (
                      <div key={p.socketId || idx} className="podium-player-row">
                        <span className="podium-rank">#{idx + 1}</span>
                        <span className="podium-name">{p.username}</span>
                        <span className="podium-score">{p.score || 0} pts</span>
                      </div>
                    ))}
                  </div>
                  <button className="start-game-btn" onClick={handleLeaveRoom} style={{ marginTop: '12px' }}>
                    Return to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR: Live Chat & Guess Input */}
        <aside className="game-right-col">
          <div className="chat-header">
            <div className="chat-header-title">
              <FaCommentDots className="chat-header-icon" />
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
                      <FaUsers className="chat-sys-icon" />
                      <span>{message.text}</span>
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
            {/* Floating popover for Full Emojis + Text Emojis (opened only on clicking smile icon) */}
            {showEmojiPicker && (
              <div className="chat-emoji-popover">
                <div className="emoji-popover-tabs">
                  <button
                    type="button"
                    className={`emoji-tab-btn ${emojiTab === 'emojis' ? 'active' : ''}`}
                    onClick={() => setEmojiTab('emojis')}
                  >
                    😀 Emojis
                  </button>
                  <button
                    type="button"
                    className={`emoji-tab-btn ${emojiTab === 'text' ? 'active' : ''}`}
                    onClick={() => setEmojiTab('text')}
                  >
                    (•‿•) Text Emojis
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
                  <FaSmile className="chat-smile-icon" />
                </button>
              </div>
              <button
                type="submit"
                className="chat-send-btn"
                title="Send message"
                disabled={!chatInput.trim()}
              >
                <FaPaperPlane className="send-plane-icon" />
              </button>
            </form>
          </div>

          {/* In-Game Floating Guess Trigger Bar (For Guessers) */}
          {roomState?.status === 'playing' && requestedRole !== 'spectator' && !isDrawer && (
            <div className="guess-trigger-bar">
              <button
                type="button"
                className={`btn-trigger-guess-modal ${guessWindowOpen ? 'is-active' : ''}`}
                onClick={() => setGuessWindowOpen((prev) => !prev)}
                title={guessWindowOpen ? 'Hide draggable guess window' : 'Open draggable guess window'}
              >
                <div className="trigger-guess-left">
                  <span className="trigger-guess-icon-pulse">
                    {isWordle ? '🟩' : '🎯'}
                  </span>
                  <div className="trigger-guess-text">
                    <span className="trigger-guess-title">
                      {isWordle ? 'Wordle Mode Guesser' : 'Submit Your Guess'}
                    </span>
                    <span className="trigger-guess-sub">
                      {isWordle
                        ? `Phase ${roomState?.wordleState?.phase || 1} • Guess ${roomState?.wordleState?.currentGuessPhase || 1}/6`
                        : (roomState?.wordHint ? `Hint: ${roomState.wordHint}` : 'Tap to open draggable guess box')}
                    </span>
                  </div>
                </div>
                <span className={`trigger-guess-badge ${guessWindowOpen ? 'active' : ''}`}>
                  {guessWindowOpen ? 'ACTIVE' : 'OPEN'}
                </span>
              </button>
            </div>
          )}

          {/* Drawer Banner */}
          {isDrawer && roomState?.status === 'playing' && (
            <div className="drawer-active-banner">
              <FaPaintBrush className="drawer-banner-icon" />
              <span>You are drawing! Watch player guesses in live chat.</span>
            </div>
          )}

          {/* Lobby Waiting Card */}
          {roomState?.status === 'lobby' && (
            <div className="lobby-waiting-status-card">
              <FaGamepad className="waiting-pad-icon" />
              <span>Waiting to start...</span>
            </div>
          )}
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
          <FaInfoCircle className="vote-toast-icon" />
          <span>{voteNotice}</span>
        </div>
      )}

      {/* Active Vote Kick Floating Modal */}
      {activeVote && (
        <div className="vote-kick-modal-overlay">
          <div className="vote-kick-card">
            <div className="vote-kick-card-header">
              <span className="vote-kick-badge">
                <FaVoteYea className="vote-badge-icon" /> VOTE KICK
              </span>
              <span className="vote-kick-timer">
                <FaStopwatch className="vote-timer-icon" /> {activeVote.timeLeft}s
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
                  <FaExclamationTriangle className="vote-msg-icon" /> A vote kick has been called against you.
                </div>
              ) : hasVoted ? (
                <div className="vote-kick-status-msg vote-kick-status-msg--voted">
                  <FaCheckCircle className="vote-msg-icon" /> Your vote has been recorded!
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
                    <FaCheck className="btn-vote-icon" /> Vote Yes
                  </button>
                  <button
                    className="btn-vote-no"
                    onClick={() => {
                      socket.emit('castVoteKick', { roomId, vote: false });
                      setHasVoted(true);
                    }}
                  >
                    <FaTimes className="btn-vote-icon" /> Vote No
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Draggable Floating Guess / Wordle Window */}
      <DraggableGuessWindow
        isOpen={guessWindowOpen && roomState?.status === 'playing' && requestedRole !== 'spectator' && !isDrawer}
        onClose={() => setGuessWindowOpen(false)}
        isWordle={isWordle}
        socket={socket}
        roomId={roomId}
        roomState={roomState}
        isDrawer={isDrawer}
        currentWord={currentWordDisplay}
        guess={guess}
        setGuess={setGuess}
        onGuessWord={(guessedWord) => {
          socket.emit('guessWord', { roomId, guess: guessedWord });
          setGuess('');
        }}
        user={activeUser}
        setUser={setUser}
        freezeState={freezeState}
        extraCluesData={extraCluesData}
      />

      {/* Kicked from room full-screen overlay */}
      {kickedModal && (
        <div className="kicked-overlay-backdrop">
          <div className="kicked-modal-card">
            <div className="kicked-icon">
              <FaBan className="kicked-ban-icon" />
            </div>
            <h2 className="kicked-title">You Were Vote-Kicked</h2>
            <p className="kicked-text">{kickedModal}</p>
            <div className="kicked-penalty-chip">
              <FaCoins className="penalty-coin-icon" />
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