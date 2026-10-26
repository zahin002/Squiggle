// client/src/components/WordleBoard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaLock,
  FaPencilAlt,
  FaCheckCircle,
  FaLightbulb,
  FaTimesCircle,
  FaTrophy,
  FaQuestionCircle
} from 'react-icons/fa';
import '../styles/Wordle.css';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

const GUESS_POINTS = [100, 80, 60, 40, 20, 10];

export default function WordleBoard({
  socket,
  roomId,
  isDrawer,
  roomState,
  currentWord,
  onGuessSubmitted
}) {
  const [currentInput, setCurrentInput] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [solvedInfo, setSolvedInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRules, setShowRules] = useState(false);

  const wordleState = roomState?.wordleState || {};
  const currentGuessPhase = wordleState.currentGuessPhase || 1;
  const isDrawerLocked = wordleState.isDrawerLocked ?? true;
  const phase = wordleState.phase || (currentGuessPhase <= 2 ? 1 : 2);

  // Sync initial state from roomState
  useEffect(() => {
    if (wordleState.myGuesses && wordleState.myGuesses.length > 0) {
      setGuesses(wordleState.myGuesses);
    }
    if (wordleState.isSolved) {
      setIsSolved(true);
      setSolvedInfo(wordleState.mySolvedInfo);
    }
  }, [wordleState]);

  // Socket listeners for Wordle guess feedback
  useEffect(() => {
    if (!socket) return;

    const handleGuessResult = (data) => {
      if (data.myGuesses) {
        setGuesses(data.myGuesses);
      }
      if (data.isCorrect) {
        setIsSolved(true);
        setSolvedInfo({ guessNum: data.guessNumber, scoreAwarded: data.scoreAwarded });
      }
      setCurrentInput('');
      setErrorMessage('');
      if (onGuessSubmitted) onGuessSubmitted();
    };

    const handleWordleError = ({ message }) => {
      setErrorMessage(message || 'Invalid guess');
      setTimeout(() => setErrorMessage(''), 3500);
    };

    socket.on('wordleGuessResult', handleGuessResult);
    socket.on('wordleError', handleWordleError);

    return () => {
      socket.off('wordleGuessResult', handleGuessResult);
      socket.off('wordleError', handleWordleError);
    };
  }, [socket, onGuessSubmitted]);

  // Reset when round changes
  useEffect(() => {
    setGuesses([]);
    setIsSolved(false);
    setSolvedInfo(null);
    setCurrentInput('');
    setErrorMessage('');
  }, [roomState?.currentRound]);

  // Clear unsubmitted input when phase advances
  useEffect(() => {
    setCurrentInput('');
    setErrorMessage('');
  }, [currentGuessPhase]);

  // Compute effective guesses by padding any missed phases as skipped rows
  const effectiveGuesses = useMemo(() => {
    if (isSolved) return guesses;
    const list = [...guesses];
    while (list.length < currentGuessPhase - 1 && list.length < 6) {
      list.push({
        guess: '-----',
        evaluation: Array.from({ length: 5 }, () => ({ letter: '—', status: 'skipped' })),
        guessNumber: list.length + 1,
        isCorrect: false,
        isSkipped: true
      });
    }
    return list;
  }, [guesses, currentGuessPhase, isSolved]);

  // Calculate keyboard letter colors based on previous guesses (ignoring skipped rows)
  const keyboardLetterStatus = useMemo(() => {
    const statuses = {};
    effectiveGuesses.forEach(({ evaluation, isSkipped }) => {
      if (!evaluation || isSkipped) return;
      evaluation.forEach(({ letter, status }) => {
        if (!letter || letter === '—') return;
        const current = statuses[letter];
        if (status === 'correct') {
          statuses[letter] = 'correct';
        } else if (status === 'present' && current !== 'correct') {
          statuses[letter] = 'present';
        } else if (status === 'absent' && !current) {
          statuses[letter] = 'absent';
        }
      });
    });
    return statuses;
  }, [effectiveGuesses]);

  // Handle submitting guess
  const handleSubmit = useCallback(() => {
    if (isDrawer) return;
    if (isSolved) return;
    if (effectiveGuesses.length >= 6) {
      setErrorMessage('Maximum 6 guesses reached.');
      return;
    }
    if (effectiveGuesses.length >= currentGuessPhase) {
      setErrorMessage(`Guess submitted for Phase ${currentGuessPhase}! Please wait for next phase.`);
      return;
    }
    if (currentInput.length !== 5) {
      setErrorMessage('Word must be exactly 5 letters.');
      return;
    }

    socket.emit('submitWordleGuess', { roomId, guess: currentInput });
  }, [isDrawer, isSolved, effectiveGuesses.length, currentGuessPhase, currentInput, socket, roomId]);

  // Physical keyboard handling
  useEffect(() => {
    if (isDrawer || isSolved) return;

    const handleKeyDown = (e) => {
      // Don't capture keyboard if user is typing in chat or input elsewhere
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setCurrentInput((prev) => prev.slice(0, -1));
        setErrorMessage('');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setCurrentInput((prev) => (prev.length < 5 ? prev + e.key.toUpperCase() : prev));
        setErrorMessage('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawer, isSolved, handleSubmit]);

  const handleKeyClick = (key) => {
    if (isDrawer || isSolved) return;

    if (key === 'ENTER') {
      handleSubmit();
    } else if (key === 'BACKSPACE') {
      setCurrentInput((prev) => prev.slice(0, -1));
      setErrorMessage('');
    } else {
      setCurrentInput((prev) => (prev.length < 5 ? prev + key : prev));
      setErrorMessage('');
    }
  };

  const potentialPoints = GUESS_POINTS[effectiveGuesses.length] || 10;

  // ── Render Drawer View ────────────────────────────────────────────────────────
  if (isDrawer) {
    return (
      <div className="wordle-drawer-panel">
        <div className="wordle-banner-header">
          <div className="wordle-phase-indicator">
            {phase === 1 ? (
              <span className="phase-chip phase-chip--locked">
                <FaLock /> Phase 1: Blind Guessing (Guesses 1 & 2)
              </span>
            ) : (
              <span className="phase-chip phase-chip--active">
                <FaPencilAlt /> Phase 2: Drawing Unlocked (Guesses 3 to 6)
              </span>
            )}
            <span className="phase-guess-badge">Guess {currentGuessPhase} / 6</span>
          </div>

          <div className="wordle-secret-pill">
            <span>SECRET WORD:</span>
            <strong>{currentWord?.toUpperCase() || '?????'}</strong>
          </div>
        </div>

        <div className="wordle-drawer-guide">
          {phase === 1 ? (
            <p className="drawer-guide-text locked">
              <FaLock className="guide-icon" /> Drawing canvas is locked during Guesses 1 & 2. Players are attempting deduction blindly!
            </p>
          ) : (
            <p className="drawer-guide-text unlocked">
              <FaPencilAlt className="guide-icon" /> Canvas unlocked! Sketch hints on the canvas to help remaining players solve the word.
            </p>
          )}
        </div>

        <div className="wordle-solver-stats">
          <div className="solver-stat-box">
            <span className="stat-label">Players Solved</span>
            <span className="stat-value">{wordleState.solversCount || 0} / {wordleState.totalGuessers || 0}</span>
          </div>
          <div className="solver-stat-box">
            <span className="stat-label">Potential Drawer Bonus</span>
            <span className="stat-value highlight">
              {(wordleState.solversCount || 0) > Math.floor((wordleState.totalGuessers || 1) / 2)
                ? '+80 pts (Majority)'
                : (wordleState.solversCount || 0) > 0
                ? '+50 pts'
                : '+10 pts'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Guesser View (Full Wordle Board + Keyboard) ────────────────────────
  return (
    <div className="wordle-guesser-panel">
      {/* Wordle Top Status Bar */}
      <div className="wordle-status-bar">
        <div className="wordle-phase-tags">
          <span className={`phase-badge ${phase === 1 ? 'phase-badge--blind' : 'phase-badge--draw'}`}>
            {phase === 1 ? <><FaLock /> Phase 1: Blind Guessing</> : <><FaPencilAlt /> Phase 2: Drawing Active</>}
          </span>
          <span className="guess-count-badge">
            Guess {effectiveGuesses.length + 1 <= 6 ? effectiveGuesses.length + 1 : 6} / 6
          </span>
        </div>

        <div className="wordle-reward-potential">
          {!isSolved && effectiveGuesses.length < 6 && (
            <span className="potential-badge">
              <FaTrophy className="potential-icon" /> Solve for <strong>+{potentialPoints} pts</strong>
            </span>
          )}
          <button
            type="button"
            className="btn-wordle-rules-toggle"
            onClick={() => setShowRules(!showRules)}
            title="Wordle Mode Rules & Scoring"
          >
            <FaQuestionCircle />
          </button>
        </div>
      </div>

      {/* Rules Dropdown Modal */}
      {showRules && (
        <div className="wordle-rules-card">
          <h4>Wordle Mode Rules & Points</h4>
          <ul>
            <li><strong>Guess 1:</strong> +100 Points</li>
            <li><strong>Guess 2:</strong> +80 Points (Blind Guessing)</li>
            <li><strong>Guess 3:</strong> +60 Points (Drawing Unlocks)</li>
            <li><strong>Guess 4:</strong> +40 Points</li>
            <li><strong>Guess 5:</strong> +20 Points</li>
            <li><strong>Guess 6:</strong> +10 Points</li>
          </ul>
          <p className="rules-note">
            <span><span className="wordle-color-dot green"></span>Green = Correct spot</span>
            <span>•</span>
            <span><span className="wordle-color-dot yellow"></span>Yellow = Wrong spot</span>
            <span>•</span>
            <span><span className="wordle-color-dot gray"></span>Gray = Not in word</span>
          </p>
        </div>
      )}

      {/* Solved celebration banner */}
      {isSolved && (
        <div className="wordle-solved-banner">
          <FaCheckCircle className="solved-banner-icon" />
          <span>Solved on Guess {solvedInfo?.guessNum || guesses.length}/6! (+{solvedInfo?.scoreAwarded || 50} pts)</span>
        </div>
      )}

      {/* Error message toast */}
      {errorMessage && (
        <div className="wordle-error-toast">
          <FaTimesCircle /> {errorMessage}
        </div>
      )}

      {/* 6x5 Wordle Tiles Grid */}
      <div className="wordle-grid">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const guessData = effectiveGuesses[rowIndex];
          const isCurrentRow = rowIndex === effectiveGuesses.length && !isSolved && rowIndex < 6;

          return (
            <div
              key={rowIndex}
              className={`wordle-row ${isCurrentRow ? 'wordle-row--active' : ''} ${guessData?.isSkipped ? 'wordle-row--skipped' : ''}`}
            >
              {Array.from({ length: 5 }).map((_, colIndex) => {
                let letter = '';
                let status = 'empty';

                if (guessData) {
                  letter = guessData.evaluation?.[colIndex]?.letter || guessData.guess?.[colIndex] || '';
                  status = guessData.isSkipped ? 'skipped' : (guessData.evaluation?.[colIndex]?.status || 'absent');
                } else if (isCurrentRow) {
                  letter = currentInput[colIndex] || '';
                  status = letter ? 'filled' : 'empty';
                }

                return (
                  <div
                    key={colIndex}
                    className={`wordle-tile wordle-tile--${status} ${letter && !guessData?.isSkipped ? 'wordle-tile--pop' : ''}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Interactive Virtual Keyboard */}
      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="wordle-keyboard-row">
            {row.map((key) => {
              const status = keyboardLetterStatus[key] || '';
              const isSpecial = key === 'ENTER' || key === 'BACKSPACE';

              return (
                <button
                  key={key}
                  type="button"
                  className={`wordle-key ${isSpecial ? 'wordle-key--special' : ''} ${status ? `wordle-key--${status}` : ''}`}
                  onClick={() => handleKeyClick(key)}
                  disabled={isSolved || effectiveGuesses.length >= 6}
                >
                  {key === 'BACKSPACE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
