import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaTimes,
  FaGripLines,
  FaLightbulb,
  FaArrowRight,
  FaPalette,
  FaPaintBrush,
  FaQuestion
} from 'react-icons/fa';
import WordleBoard from './WordleBoard';
import PowerupsPanel from './PowerupsPanel';
import '../styles/DraggableGuessWindow.css';

export default function DraggableGuessWindow({
  isOpen,
  onClose,
  isWordle,
  socket,
  roomId,
  roomState,
  isDrawer,
  currentWord,
  guess,
  setGuess,
  onGuessWord,
  user,
  setUser,
  freezeState
}) {
  const windowRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hasInitializedPos, setHasInitializedPos] = useState(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Initialize position to center-right of screen (near chat sidebar)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const defaultX = Math.max(16, window.innerWidth - 410);
    const defaultY = Math.max(76, Math.min(100, Math.floor(window.innerHeight * 0.12)));
    setPos({ x: defaultX, y: defaultY });
    setHasInitializedPos(true);
  }, []);

  const handleStartDrag = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return;

    isDraggingRef.current = true;
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    const handleMove = (moveEvt) => {
      if (!isDraggingRef.current) return;
      const curX = moveEvt.clientX ?? moveEvt.touches?.[0]?.clientX;
      const curY = moveEvt.clientY ?? moveEvt.touches?.[0]?.clientY;
      if (curX == null || curY == null) return;

      const windowWidth = windowRef.current?.offsetWidth || 380;
      const windowHeight = windowRef.current?.offsetHeight || 480;

      const newX = Math.max(10, Math.min(window.innerWidth - windowWidth - 10, curX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - windowHeight - 10, curY - dragOffsetRef.current.y));

      setPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={`draggable-guess-window ${isWordle ? 'is-wordle' : 'is-standard'}`}
      style={{
        left: hasInitializedPos ? `${pos.x}px` : 'auto',
        top: hasInitializedPos ? `${pos.y}px` : 'auto',
        right: !hasInitializedPos ? '400px' : 'auto'
      }}
    >
      {/* Decorative background doodles matching reference aesthetic */}
      <div className="doodle-layer" aria-hidden="true">
        <FaPalette className="doodle-bg doodle-palette" />
        <FaPaintBrush className="doodle-bg doodle-brush" />
        <FaQuestion className="doodle-bg doodle-q" />
        <span className="doodle-bg doodle-sparkle doodle-sparkle-1">✦</span>
        <span className="doodle-bg doodle-sparkle doodle-sparkle-2">✦</span>
        <svg className="doodle-bg doodle-wave-svg" viewBox="0 0 120 40" fill="none">
          <path
            d="M 10 20 Q 35 5 60 20 T 110 20"
            stroke="rgba(139, 92, 246, 0.18)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Draggable Header Grip Bar */}
      <div className="draggable-header" onMouseDown={handleStartDrag} onTouchStart={handleStartDrag}>
        <div className="draggable-title-area">
          <FaGripLines className="drag-grip-icon" />
          <span className="draggable-title">
            {isWordle ? 'Wordle Mode' : 'Submit Guess'}
          </span>
          <span className="drag-hint-pill">Drag to move</span>
        </div>
        <button
          type="button"
          className="draggable-close-btn"
          onClick={onClose}
          title="Close window (reopen from Live Chat)"
        >
          <FaTimes />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="draggable-body">
        {isWordle ? (
          <WordleBoard
            socket={socket}
            roomId={roomId}
            isDrawer={isDrawer}
            roomState={roomState}
            currentWord={currentWord}
          />
        ) : (
          <div className="standard-guess-box">
            <div className="standard-guess-header">
              <span className="standard-guess-badge">
                <FaLightbulb className="standard-badge-icon" /> GUESS THE WORD
              </span>
              {roomState?.wordHint && (
                <div className="standard-hint-pill" title="Word Hint">
                  {roomState.wordHint}
                </div>
              )}
            </div>

            <form
              className="standard-guess-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!guess.trim()) return;
                onGuessWord(guess.trim());
              }}
            >
              <div className="standard-guess-input-wrap">
                <input
                  type="text"
                  className="standard-guess-input"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="🎯 Enter your guess here..."
                  disabled={isDrawer || roomState?.status !== 'playing'}
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="submit"
                  className="standard-guess-submit-btn"
                  disabled={!guess.trim() || isDrawer || roomState?.status !== 'playing'}
                >
                  <span>GUESS</span>
                  <FaArrowRight className="guess-btn-arrow" />
                </button>
              </div>
            </form>

            {/* Power-Ups Panel (Hint Steal, Freeze Time) */}
            <PowerupsPanel
              socket={socket}
              roomId={roomId}
              roomState={roomState}
              user={user}
              setUser={setUser}
              freezeState={freezeState}
              onGuessWord={onGuessWord}
            />
          </div>
        )}
      </div>
    </div>
  );
}
