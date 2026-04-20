const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const ACCESS_CODE = "12345";
const ADMIN_CODE = "99999";

let users = {};
let rooms = {
  "عام": []
};

io.on("connection", (socket) => {

  socket.on("login", ({ username, code }) => {

    if (code !== ACCESS_CODE && code !== ADMIN_CODE) {
      return socket.emit("login error", "كود غير صحيح");
    }

    if (!username || username.trim() === "") {
      return socket.emit("login error", "اكتب اسم صحيح");
    }

    users[socket.id] = {
      id: socket.id,
      username,
      role: code === ADMIN_CODE ? "admin" : "user",
      room: "عام"
    };

    socket.join("عام");

    socket.emit("login success", {
      user: users[socket.id],
      rooms: Object.keys(rooms)
    });

    updateOnline();
  });

  socket.on("create room", (roomName) => {
    if (!roomName || rooms[roomName]) return;
    rooms[roomName] = [];
    io.emit("room list", Object.keys(rooms));
  });

  socket.on("delete room", (roomName) => {
    const user = users[socket.id];
    if (!user || user.role !== "admin") return;
    if (roomName === "عام") return;

    delete rooms[roomName];
    io.emit("room list", Object.keys(rooms));
  });

  socket.on("change room", (room) => {
    const user = users[socket.id];
    if (!user || !rooms[room]) return;

    socket.leave(user.room);
    user.room = room;
    socket.join(room);
  });

  socket.on("chat message", (msg) => {
    const user = users[socket.id];
    if (!user) return;

    io.to(user.room).emit("chat message", {
      username: user.username,
      msg,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    updateOnline();
  });

  function updateOnline() {
    io.emit("online users", Object.values(users));
  }

});

server.listen(PORT, () => {
  console.log("Server running");
});
