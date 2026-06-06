# TODO
- [x] Add a single helper `buildRoomState(room, currentUserId, socketId)` on the server.
- [x] Replace duplicated roomState payload creation with the helper (joinRoom emit + roundManager emit).
- [x] Ensure `isHost` logic matches existing behavior (hostUserId vs hostId fallback).
- [ ] Run quick sanity check by starting server (if available) and verifying `roomState` payload shape for players and spectators.




