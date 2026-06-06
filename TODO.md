# Squiggle TODO

## Chat history + notifications (server/socket/gameEvents.js)
- [x] Update joinRoom system message persistence to include id/username/text/type and emit roomStateUpdate + chatMessage
- [x] Add/replace sendMessage handler to append user messages into room.chatHistory and broadcast chatMessage with id/username/text/type

- [ ] Verify roomStateUpdate emission format and client compatibility
- [ ] Quick runtime check (start server + send/receive chat)

