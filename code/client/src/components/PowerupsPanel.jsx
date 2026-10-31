// client/src/components/PowerupsPanel.jsx

import React, { useState } from 'react';
import {
  LuLightbulb,
  LuSnowflake,
  LuCoins,
  LuGem,
  LuChevronDown,
  LuChevronUp,
  LuZap
} from 'react-icons/lu';
import '../styles/PowerupsPanel.css';

export default function PowerupsPanel({
  socket,
  roomId,
  roomState,
  user,
  setUser,
  freezeState,
  onGuessWord
}) {
  const [collapsed, setCollapsed] = useState(true);
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

  // If power-ups are disabled by the host or not available in the current mode, do not render the feature
  if (!isPowerupsAllowed) {
    return null;
  }

  // ── Calculate Remaining Letters for Hint Steal ───────────────────
  const wordHint = roomState?.wordHint || '';
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

  // ── Calculate Freeze Time Cost ───────────────────────────────────
  const freezeActive = !!freezeState?.active;
  const freezeSeconds = freezeState?.freezeSecondsRemaining || 0;
  const isFreezeUser = freezeState?.userSocketId === socket?.id;
  const freezePurchases = (roomState?.freezeState?.purchasesByUser?.[socket?.id] || 0);
  const nextFreezeCostGold = 200 * Math.pow(2, freezePurchases);
  const nextFreezeCostDiamond = 1 * Math.pow(2, freezePurchases);

  // ── Action Handlers ──────────────────────────────────────────────
  const handleUseHintSteal = (currency) => {
    if (!isPowerupsAllowed) return;
    if (isGuest) {
      showToast('Sign in to spend Gold Coins or Diamonds!', 'error');
      return;
    }
    socket.emit('useHintSteal', { roomId, currency });
  };

  const handleUseFreezeTime = (currency = 'gold') => {
    if (!isPowerupsAllowed) return;
    if (isGuest) {
      showToast('Sign in to spend Gold Coins or Diamonds!', 'error');
      return;
    }
    socket.emit('useFreezeTime', { roomId, currency });
  };

  return (
    <div className="powerups-container">
      {/* Header Bar */}
      <div className="powerups-header-bar" onClick={() => setCollapsed(!collapsed)}>
        <div className="powerups-header-left">
          <span className="powerups-header-title">
            <LuZap className="powerups-bolt-icon" />
            <span>Power-Ups</span>
          </span>
          <div className="powerups-wallet-mini">
            <span className="wallet-coin-item" title="Gold Coins">
              <LuCoins className="coin-icon" />
              <span>{user?.goldCoins || 0}</span>
            </span>
            <span className="wallet-gem-item" title="Diamonds">
              <LuGem className="gem-icon" />
              <span>{user?.diamonds || 0}</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          className="powerups-toggle-collapse-btn"
          aria-label={collapsed ? 'Expand power-ups' : 'Collapse power-ups'}
        >
          {collapsed ? <LuChevronDown /> : <LuChevronUp />}
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
                <LuLightbulb />
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
                <LuCoins className="btn-curr-icon" />
                <span>{hintGoldCost}</span>
              </button>
              <button
                type="button"
                className="btn-powerup-buy btn-diamond"
                onClick={() => handleUseHintSteal('diamonds')}
                disabled={unrevealedLetterCount === 0 || (user?.diamonds || 0) < hintDiamondCost}
                title={`Reveal 1 letter for ${hintDiamondCost} Diamond`}
              >
                <LuGem className="btn-curr-icon" />
                <span>{hintDiamondCost}</span>
              </button>
            </div>
          </div>



          {/* 3. Freeze Time */}
          <div className="powerup-card freeze-card">
            <div className="powerup-card-top">
              <div className={`powerup-icon-box freeze ${freezeActive ? 'pulse' : ''}`}>
                <LuSnowflake />
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
                <LuCoins className="btn-curr-icon" />
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
                <LuGem className="btn-curr-icon" />
                <span>{nextFreezeCostDiamond}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
