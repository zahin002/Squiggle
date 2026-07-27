import { useEffect, useRef, useState, useCallback } from 'react';

// Free turn servers configuration for WebRTC ICE traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function useWebRTC(socket, roomId, role = 'player') {
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isForceMuted, setIsForceMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }

  // Use refs to avoid closure stale state in callbacks
  const peerConnections = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const isMutedRef = useRef(false);
  const isForceMutedRef = useRef(false);

  // Sync ref values
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isForceMutedRef.current = isForceMuted; }, [isForceMuted]);

  // ── Helper: Get/Initialize Local Audio Stream ───────────────────────
  const initLocalStream = useCallback(async () => {
    // Spectators do not capture audio input (listen-only)
    if (role === 'spectator') {
      console.log('[WebRTC] Spectator joined in listen-only mode. No mic requested.');
      return null;
    }

    if (localStreamRef.current) return localStreamRef.current;

    try {
      console.log('[WebRTC] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      // Enforce initial mute states on tracks
      const isMutedState = isMutedRef.current || isForceMutedRef.current;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMutedState;
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[WebRTC] Microphone permission denied or failed:', err);
      return null;
    }
  }, [role]);

  // ── Helper: Create a new RTCPeerConnection ──────────────────────────
  const createPeerConnection = useCallback((targetSocketId, stream) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    console.log(`[WebRTC] Creating RTCPeerConnection for peer: ${targetSocketId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    // Attach local stream tracks (players only)
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
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
      console.log(`[WebRTC] Received remote stream track from peer: ${targetSocketId}`);
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => ({
        ...prev,
        [targetSocketId]: remoteStream,
      }));
    };

    // Handle Connection State Changes (cleanup on disconnect/fail)
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetSocketId} is: ${pc.connectionState}`);
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
    setRemoteStreams(prev => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
  }, []);

  // ── 1. Initialize RTC and setup signaling handlers ──────────────────
  useEffect(() => {
    let streamInstance = null;

    const setupSignaling = async () => {
      streamInstance = await initLocalStream();

      // Listen for signals from other peers
      socket.on('webrtcSignal', async ({ senderSocketId, signal }) => {
        try {
          let pc = peerConnections.current[senderSocketId];

          // Initialize peer connection if it doesn't exist yet
          if (!pc) {
            pc = createPeerConnection(senderSocketId, streamInstance);
          }

          if (signal.offer) {
            console.log(`[WebRTC] Received offer from peer: ${senderSocketId}`);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('webrtcSignal', {
              targetSocketId: senderSocketId,
              signal: { answer },
            });
          } 
          else if (signal.answer) {
            console.log(`[WebRTC] Received answer from peer: ${senderSocketId}`);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          } 
          else if (signal.candidate) {
            // Wait for remote description to be set before adding candidates
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          }
        } catch (err) {
          console.error('[WebRTC] Error handling WebRTC signal:', err);
        }
      });

      // Listen for force mute requests from the host
      socket.on('forceMutedByHost', ({ mute }) => {
        console.log(`[WebRTC] Host force-muted is: ${mute}`);
        setIsForceMuted(mute);
        
        // Physically disable/enable the stream audio track
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !mute;
          });
        }
        
        // Sync state back to the lobby
        socket.emit('toggleSelfMute', { roomId, mute });
      });

      // Clean up peers on player disconnect
      socket.on('playerLeft', ({ socketId }) => {
        removePeer(socketId);
      });
    };

    setupSignaling();

    // Clean up all peer connections and local tracks on unmount
    return () => {
      console.log('[WebRTC] Cleaning up useWebRTC hook...');
      socket.off('webrtcSignal');
      socket.off('forceMutedByHost');
      socket.off('playerLeft');

      Object.keys(peerConnections.current).forEach(id => {
        removePeer(id);
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [socket, roomId, role, initLocalStream, createPeerConnection, removePeer]);

  // ── 2. Handle outbound connections (triggered when players update) ──
  // Existing players send offers to new player connections
  const initiateConnections = useCallback((playersList) => {
    // Only players initiate outbound calls
    if (role === 'spectator') return;
    const stream = localStreamRef.current;

    playersList.forEach(p => {
      // Don't call yourself and don't double call
      if (p.socketId === socket.id || peerConnections.current[p.socketId]) return;

      const pc = createPeerConnection(p.socketId, stream);
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          console.log(`[WebRTC] Sending offer to peer: ${p.socketId}`);
          socket.emit('webrtcSignal', {
            targetSocketId: p.socketId,
            signal: { offer: pc.localDescription },
          });
        })
        .catch(err => console.error('[WebRTC] Offer creation failed:', err));
    });
  }, [socket, role, createPeerConnection]);

  // ── 3. Toggle Local Self-Mute ───────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (isForceMuted) {
      console.log('[WebRTC] Cannot unmute: Host has force-muted your mic.');
      return;
    }

    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuteState;
      });
    }

    // Sync state to other players so mic icon in the list updates
    socket.emit('toggleSelfMute', { roomId, mute: nextMuteState });
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
