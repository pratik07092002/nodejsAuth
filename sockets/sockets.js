module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket New Client Connected ${socket.id}`);

    socket.on('message', (data) => {
      console.log(`📨 [SOCKET] Received message: ${data}`);
      socket.broadcast.emit('message', data);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket client disconnected`);
    });
  });
};
