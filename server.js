const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

console.log("Signaling server running on port 3000");

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("offer", data => {
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", data => {
    socket.broadcast.emit("answer", data);
  });

  socket.on("ice-candidate", data => {
    socket.broadcast.emit("ice-candidate", data);
  });

  socket.on("end-call", () => {
    console.log("User ended call:", socket.id);
    socket.broadcast.emit("end-call");
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("end-call");
  });
});