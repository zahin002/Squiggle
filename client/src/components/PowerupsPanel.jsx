// client/src/components/PowerupsPanel.jsx

import React, { useState } from 'react';
import {
  FaLightbulb,
  FaBullseye,
  FaSnowflake,
  FaCoins,
  FaGem,
  FaLock,
  FaCheck,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import '../styles/PowerupsPanel.css';

export default function PowerupsPanel({
  socket,
  roomId,
  roomState,
  user,
  setUser,
  freezeState,
  extraCluesData,
  onGuessWord
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [powerupToast, setPowerupToast] = useState(null);

  const gameMode = roomState?.settings?.gameMode || 'standard';
  const isPowerupsAllowed = gameMode === 'standard' && roomState?.settings?.powerupsEnabled !== false;
  const isGuest = !user || user.isGuest;

  const showToast = (message, type = 'info') => {
    setPowerupToast({ message, type });
    setTimeout(() => {
      setPowerupToast(null);
    }, 4000);
  };

  // ── Calculate Remaining Letters for Hint Steal ───────────────────
  const wordHint = roomState?.wordHint || '';
  // Count unrevealed underscores in hint
  const unrevealedLetterCount = (wordHint.match(/_/g) || []).length;
  
  let hintGoldCost = 100;
  let hintDiamondCost = 1;
  if (unrevealedLetterCount === 1) {
    hintGoldCost = 300;
    hintDiamondCost = 2;
  } else if (unrevealedLetterCount === 2) {
    hintGoldCost = 200;
    hintDiamondCost = 1;
  } else {
    hintGoldCost = 100;
    hintDiamondCost = 1;
  }

  // ── Calculate Extra Clues Cost & Options ─────────────────────────
  const clueStage = extraCluesData?.stage || 0;
  const clueOptions = extraCluesData?.options || [];
  const nextClueGoldCost = extraCluesData?.nextCostGold ?? 150;

  // ── Calculate Freeze Time Cost ───────────────────────────────────
  const freezeActive = !!freezeState?.active;
  const freezeSeconds = freezeState?.freezeSecondsRemaining || 0;
  const isFreezeUser = freezeState?.userSocketId === socket?.id;
  // If user already purchased, cost doubles: 200, 400, 800... / 1, 2, 4, 8...
  const freezePurchases = (roomState?.freezeState?.purchasesByUser?.[socket?.id] || 0);
  const nextFreezeCostGold = 200 * Math.pow(2, freezePurchases);
  const nextFreezeCostDiamond = 1 * Math.pow(2, freezePurchases);

  // ── Action Handlers ──────────────────────────────────────────────
  const handleUseHintSteal = (currency) => {
    if (!isPowerupsAllowed) return;
    if (isGuest) {
      showToast('Sign in with an account to spend Gold Coins or Diamonds!', 'error');
      return;
    }
    socket.emit('useHintSteal', { roomId, currency });
  };

  const handleUseExtraClues = (currency = 'gold') => {
    if (!isPowerupsAllowed) return;
    if (isGuest) {
      showToast('Sign in with an account to spend Gold Coins or Diamonds!', 'error');
      return;
    }
    socket.emit('useExtraClues', { roomId, currency });
  };

  const handleUseFreezeTime = (currency = 'gold') => {
    if (!isPowerupsAllowed) return;
    if (isGuest) {
      showToast('Sign in with an account to spend Gold Coins or Diamonds!', 'error');
      return;
    }
    socket.emit('useFreezeTime', { roomId, currency });
  };

  if (!isPowerupsAllowed) {
    return (
      <div className="powerups-container powerups-disabled-card">
        <div className="powerups-disabled-header">
          <FaLock className="powerup-lock-icon" />
          <span>
            {gameMode !== 'standard'
              ? `Power-Ups are disabled in ${gameMode.toUpperCase()} mode`
              : 'Power-Ups are disabled by room host'}
          </span>
        </div>
        <p className="powerups-disabled-desc">
          {gameMode !== 'standard'
            ? 'Play in Standard Mode to use Hint Steal, Extra Clues, and Freeze Time.'
            : 'The host disabled power-ups in lobby settings.'}
        </p>
      </div>
    );
  }

  return (
    <div className="powerups-container">
      {/* Header Bar */}
      <div className="powerups-header-bar" onClick={() => setCollapsed(!collapsed)}>
        <div className="powerups-header-left">
          <span className="powerups-header-title">
            ⚡ Power-Ups
          </span>
          <div className="powerups-wallet-mini">
            <span className="wallet-coin-item" title="Gold Coins">
              <FaCoins className="coin-icon" /> {user?.goldCoins || 0}
            </span>
            <span className="wallet-gem-item" title="Diamonds">
              <FaGem className="gem-icon" /> {user?.diamonds || 0}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="powerups-toggle-collapse-btn"
          aria-label={collapsed ? 'Expand power-ups' : 'Collapse power-ups'}
        >
          {collapsed ? <FaChevronDown /> : <FaChevronUp />}
        </button>
      </div>

      {/* Power-up feedback toast */}
      {powerupToast && (
        <div className={`powerup-toast-message ${powerupToast.type}`}>
          {powerupToast.message}
        </div>
      )}

      {/* Power-Up Items */}
      {!collapsed && (
        <div className="powerups-grid">
          {/* 1. Hint Steal */}
          <div className="powerup-card">
            <div className="powerup-card-top">
              <div className="powerup-icon-box hint">
                <FaLightbulb />
              </div>
              <div className="powerup-info">
                <div className="powerup-name">Hint Steal</div>
                <div className="powerup-sub">
                  {unrevealedLetterCount > 0
                    ? `${unrevealedLetterCount} letter${unrevealedLetterCount > 1 ? 's' : ''} remaining`
                    : 'All letters revealed'}
                </div>
              </div>
            </div>

            <div className="powerup-actions-row">
              <button
                type="button"
                className="btn-powerup-buy btn-gold"
                onClick={() => handleUseHintSteal('gold')}
                disabled={unrevealedLetterCount === 0 || (user?.goldCoins || 0) < hintGoldCost}
                title={`Reveal 1 letter for ${hintGoldCost} Gold Coins`}
              >
                <FaCoins className="btn-curr-icon" />
                <span>{hintGoldCost}</span>
              </button>
              <button
                type="button"
                className="btn-powerup-buy btn-diamond"
                onClick={() => handleUseHintSteal('diamonds')}
                disabled={unrevealedLetterCount === 0 || (user?.diamonds || 0) < hintDiamondCost}
                title={`Reveal 1 letter for ${hintDiamondCost} Diamond`}
              >
                <FaGem className="btn-curr-icon" />
                <span>{hintDiamondCost}</span>
              </button>
            </div>
          </div>

          {/* 2. Extra Clues (Eliminating Options) */}
          <div className="powerup-card extra-clues-card">
            <div className="powerup-card-top">
              <div className="powerup-icon-box clue">
                <FaBullseye />
              </div>
              <div className="powerup-info">
                <div className="powerup-name">Extra Clues</div>
                <div className="powerup-sub">
                  {clueStage === 0
                    ? 'Get 5 multiple-choice options'
                    : `${clueOptions.length} option${clueOptions.length > 1 ? 's' : ''} remaining`}
                </div>
              </div>
            </div>

            {/* Display options as clickable guess buttons */}
            {clueOptions.length > 0 && (
              <div className="clue-options-list">
                {clueOptions.map((opt, idx) => (
                  <button
                    key={`${opt}-${idx}`}
                    type="button"
                    className="clue-option-pill"
                    onClick={() => onGuessWord(opt)}
                    title={`Click to guess "${opt}"`}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="powerup-actions-row">
              {clueStage === 0 ? (
                <>
                  <button
                    type="button"
                    className="btn-powerup-buy btn-gold"
                    onClick={() => handleUseExtraClues('gold')}
                    disabled={(user?.goldCoins || 0) < 150}
                    title="Get 5 options for 150 Gold Coins"
                  >
                    <FaCoins className="btn-curr-icon" />
                    <span>150</span>
                  </button>
                  <button
                    type="button"
                    className="btn-powerup-buy btn-diamond"
                    onClick={() => handleUseExtraClues('diamonds')}
                    disabled={(user?.diamonds || 0) < 1}
                    title="Get 5 options for 1 Diamond"
                  >
                    <FaGem className="btn-curr-icon" />
                    <span>1</span>
                  </button>
                </>
              ) : clueStage < 5 && nextClueGoldCost !== null ? (
                <button
                  type="button"
                  className="btn-powerup-buy btn-gold btn-full-width"
                  onClick={() => handleUseExtraClues('gold')}
                  disabled={(user?.goldCoins || 0) < nextClueGoldCost}
                  title={`Eliminate 1 wrong option for ${nextClueGoldCost} Gold Coins`}
                >
                  <FaCoins className="btn-curr-icon" />
                  <span>Eliminate 1 Option (+{nextClueGoldCost} 🪙)</span>
                </button>
              ) : (
                <div className="clue-final-tag">
                  <FaCheck /> 1 Option Remaining!
                </div>
              )}
            </div>
          </div>

          {/* 3. Freeze Time */}
          <div className="powerup-card freeze-card">
            <div className="powerup-card-top">
              <div className={`powerup-icon-box freeze ${freezeActive ? 'pulse' : ''}`}>
                <FaSnowflake />
              </div>
              <div className="powerup-info">
                <div className="powerup-name">Freeze Time</div>
                <div className="powerup-sub">
                  {freezeActive
                    ? isFreezeUser
                      ? `Active! +${freezeSeconds}s remaining`
                      : `Active for ${freezeState?.username}`
                    : 'Stop clock & get +20s'}
                </div>
              </div>
            </div>

            <div className="powerup-actions-row">
              <button
                type="button"
                className={`btn-powerup-buy btn-gold ${freezeActive && isFreezeUser ? 'is-active-freeze' : ''}`}
                onClick={() => handleUseFreezeTime('gold')}
                disabled={
                  (user?.goldCoins || 0) < nextFreezeCostGold ||
                  (freezeActive && !isFreezeUser)
                }
                title={`Stop clock and add +20 seconds for ${nextFreezeCostGold} Gold Coins`}
              >
                <FaCoins className="btn-curr-icon" />
                <span>{nextFreezeCostGold}</span>
              </button>
              <button
                type="button"
                className={`btn-powerup-buy btn-diamond ${freezeActive && isFreezeUser ? 'is-active-freeze' : ''}`}
                onClick={() => handleUseFreezeTime('diamonds')}
                disabled={
                  (user?.diamonds || 0) < nextFreezeCostDiamond ||
                  (freezeActive && !isFreezeUser)
                }
                title={`Stop clock and add +20 seconds for ${nextFreezeCostDiamond} Diamond${nextFreezeCostDiamond > 1 ? 's' : ''}`}
              >
                <FaGem className="btn-curr-icon" />
                <span>{nextFreezeCostDiamond}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
