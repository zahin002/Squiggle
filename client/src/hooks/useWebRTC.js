import { useEffect, useRef, useState, useCallback } from 'react';

// Free STUN servers for WebRTC ICE traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function useWebRTC(socket, roomId, role = 'player', players = []) {
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isForceMuted, setIsForceMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }

  // Refs for values that must be fresh inside callbacks
  const peerConnections = useRef({});   // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const isMutedRef = useRef(false);
  const isForceMutedRef = useRef(false);
  const iceCandidateQueue = useRef({}); // { socketId: RTCIceCandidate[] }
  const pendingSignals = useRef([]);    // signals received before mic was ready

  // Sync ref values
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isForceMutedRef.current = isForceMuted; }, [isForceMuted]);

  // ── Helper: Create a new RTCPeerConnection ──────────────────────────
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    console.log(`[WebRTC] Creating RTCPeerConnection for peer: ${targetSocketId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    // Attach local stream tracks (players only — spectators have no stream)
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log(`[WebRTC] ✅ Attached local audio track to peer: ${targetSocketId}`);
      });
    } else {
      // Spectator: add a receive-only transceiver so the SDP includes
      // an audio m-line and the remote peer knows to send us their audio
      pc.addTransceiver('audio', { direction: 'recvonly' });
      console.log(`[WebRTC] 👁️ Spectator: added recvonly audio transceiver for peer: ${targetSocketId}`);
    }

    // Exchange ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtcSignal', {
          targetSocketId,
          signal: { candidate: event.candidate },
        });
      }
    };

    // Receive Remote Audio Tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] ✅ Received remote audio track from peer: ${targetSocketId}`);
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => ({
        ...prev,
        [targetSocketId]: remoteStream,
      }));
    };

    // Log state changes for debugging
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${targetSocketId}: ${pc.iceConnectionState}`);
    };
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetSocketId}: ${pc.connectionState}`);
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        removePeer(targetSocketId);
      }
    };

    return pc;
  }, [socket]);

  // ── Helper: Remove Peer Connection ─────────────────────────────────
  const removePeer = useCallback((socketId) => {
    const pc = peerConnections.current[socketId];
    if (pc) {
      console.log(`[WebRTC] Closing peer connection with: ${socketId}`);
      pc.close();
      delete peerConnections.current[socketId];
    }
    delete iceCandidateQueue.current[socketId];
    setRemoteStreams(prev => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
  }, []);

  // ── Core signal processor (used by both listener and queue flush) ───
  const processSignal = useCallback(async ({ senderSocketId, signal }) => {
    try {
      let pc = peerConnections.current[senderSocketId];

      // Lazily create peer connection for incoming signals
      if (!pc) {
        pc = createPeerConnection(senderSocketId);
      }

      if (signal.offer) {
        console.log(`[WebRTC] Processing OFFER from: ${senderSocketId}`);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtcSignal', {
          targetSocketId: senderSocketId,
          signal: { answer },
        });

        // Flush queued ICE candidates
        const q = iceCandidateQueue.current[senderSocketId] || [];
        for (const c of q) {
          await pc.addIceCandidate(c).catch(e => console.warn('[WebRTC] queued candidate fail:', e));
        }
        iceCandidateQueue.current[senderSocketId] = [];
      }
      else if (signal.answer) {
        console.log(`[WebRTC] Processing ANSWER from: ${senderSocketId}`);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));

        // Flush queued ICE candidates
        const q = iceCandidateQueue.current[senderSocketId] || [];
        for (const c of q) {
          await pc.addIceCandidate(c).catch(e => console.warn('[WebRTC] queued candidate fail:', e));
        }
        iceCandidateQueue.current[senderSocketId] = [];
      }
      else if (signal.candidate) {
        const iceCandidate = new RTCIceCandidate(signal.candidate);
        if (pc.remoteDescription) {
          await pc.addIceCandidate(iceCandidate).catch(e => console.warn('[WebRTC] ICE add fail:', e));
        } else {
          if (!iceCandidateQueue.current[senderSocketId]) {
            iceCandidateQueue.current[senderSocketId] = [];
          }
          iceCandidateQueue.current[senderSocketId].push(iceCandidate);
        }
      }
    } catch (err) {
      console.error('[WebRTC] Signal processing error:', err);
    }
  }, [socket, createPeerConnection]);

  // Keep a ref so the socket listener always calls the latest version
  const processSignalRef = useRef(processSignal);
  useEffect(() => { processSignalRef.current = processSignal; }, [processSignal]);

  // ── 1. Request mic (async, non-blocking) ────────────────────────────
  useEffect(() => {
    if (role === 'spectator') {
      console.log('[WebRTC] Spectator mode — no mic requested.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        console.log('[WebRTC] Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        const shouldMute = isMutedRef.current || isForceMutedRef.current;
        stream.getAudioTracks().forEach(t => { t.enabled = !shouldMute; });

        localStreamRef.current = stream;
        setLocalStream(stream);
        console.log('[WebRTC] ✅ Microphone stream acquired.');

        // ── Flush any signals that arrived while waiting for the mic ──
        const queued = [...pendingSignals.current];
        pendingSignals.current = [];
        if (queued.length > 0) {
          console.log(`[WebRTC] Flushing ${queued.length} queued signal(s) now that mic is ready.`);
          for (const sig of queued) {
            await processSignalRef.current(sig);
          }
        }
      } catch (err) {
        console.error('[WebRTC] ❌ Microphone permission denied or failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
    };
  }, [role]);

  // ── 2. Register signaling listeners (SYNCHRONOUS — never misses events) ──
  useEffect(() => {
    const handleSignal = async (data) => {
      // If we're a player and our mic isn't ready yet, queue the signal
      if (role !== 'spectator' && !localStreamRef.current) {
        console.log(`[WebRTC] ⏳ Queuing signal from ${data.senderSocketId} — waiting for mic.`);
        pendingSignals.current.push(data);
        return;
      }

      // Mic is ready (or we're a spectator), process immediately
      await processSignalRef.current(data);
    };

    const handleForceMute = ({ mute }) => {
      console.log(`[WebRTC] Host force-mute: ${mute}`);
      setIsForceMuted(mute);

      if (localStreamRef.current) {
        if (mute) {
          // Host is force-muting: always disable the audio track
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
        } else {
          // Host is removing force-mute: only re-enable if the player
          // hasn't self-muted. Never bypass the player's own decision.
          const playerWantsMic = !isMutedRef.current;
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = playerWantsMic; });
        }
      }

      // Sync icon state: when force-muting, always show muted.
      // When removing force-mute, show the player's own mute state.
      socket.emit('toggleSelfMute', { roomId, mute: mute ? true : isMutedRef.current });
    };

    const handlePlayerLeft = ({ socketId }) => {
      removePeer(socketId);
    };

    socket.on('webrtcSignal', handleSignal);
    socket.on('forceMutedByHost', handleForceMute);
    socket.on('playerLeft', handlePlayerLeft);

    return () => {
      socket.off('webrtcSignal', handleSignal);
      socket.off('forceMutedByHost', handleForceMute);
      socket.off('playerLeft', handlePlayerLeft);
    };
  }, [socket, roomId, role, removePeer]);

  // ── 3. Outbound connection initiator ────────────────────────────────
  const initiateConnections = useCallback((playersList) => {
    if (!playersList || playersList.length === 0) return;

    // Players must have their mic stream before initiating
    if (role !== 'spectator' && !localStreamRef.current) {
      console.log('[WebRTC] Deferring connections — mic stream not ready yet.');
      return;
    }

    playersList.forEach(p => {
      // Skip self and already-connected peers
      if (p.socketId === socket.id || peerConnections.current[p.socketId]) return;

      // Polite Peer Pattern: only the lexicographically smaller socket ID sends the offer.
      if (socket.id < p.socketId) {
        const pc = createPeerConnection(p.socketId);
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            console.log(`[WebRTC] Sending OFFER to: ${p.socketId}`);
            socket.emit('webrtcSignal', {
              targetSocketId: p.socketId,
              signal: { offer: pc.localDescription },
            });
          })
          .catch(err => console.error('[WebRTC] Offer error:', err));
      } else {
        console.log(`[WebRTC] Waiting for offer from: ${p.socketId}`);
      }
    });
  }, [socket, role, createPeerConnection]);

  // ── 4. Auto-trigger connections when stream or player list changes ──
  useEffect(() => {
    if (role === 'spectator') {
      initiateConnections(players);
    } else if (localStream && players && players.length > 0) {
      initiateConnections(players);
    }
  }, [localStream, players, role, initiateConnections]);

  // ── 5. Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      console.log('[WebRTC] Unmounting — cleaning up all connections.');
      Object.keys(peerConnections.current).forEach(id => removePeer(id));
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      pendingSignals.current = [];
    };
  }, [removePeer]);

  // ── 6. Toggle self-mute ─────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (isForceMuted) {
      console.log('[WebRTC] Cannot unmute — host force-muted.');
      return;
    }

    const next = !isMuted;
    setIsMuted(next);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !next; });
    }

    socket.emit('toggleSelfMute', { roomId, mute: next });
  }, [isMuted, isForceMuted, socket, roomId]);

  return {
    localStream,
    isMuted,
    isForceMuted,
    remoteStreams,
    toggleMute,
    initiateConnections,
  };
}
