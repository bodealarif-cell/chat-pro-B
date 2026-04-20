const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ===== إعدادات =====
const ACCESS_CODE = "12345";
const ADMIN_CODE = "99999";

let users = {};
let rooms = {
  "عام": []
};

let privateMessages = {};
let friendships = {};

io.on("connection", (socket) => {

  socket.on("login", ({ username, code, avatar }) => {

    if (code !== ACCESS_CODE && code !== ADMIN_CODE) {
      return socket.emit("login error", "كود غير صحيح");
    }

    users[socket.id] = {
      id: socket.id,
      username,
      avatar: avatar || "https://i.pravatar.cc/40",
      role: code === ADMIN_CODE ? "admin" : "user",
      room: "عام"
    };

    friendships[socket.id] = [];

    socket.join("عام");

    socket.emit("login success", {
      user: users[socket.id],
      rooms: Object.keys(rooms)
    });

    updateOnline();
  });

  // ===== إنشاء روم =====
  socket.on("create room", (roomName) => {
    if (!roomName || rooms[roomName]) return;
    rooms[roomName] = [];
    io.emit("room list", Object.keys(rooms));
  });

  // ===== حذف روم (Admin فقط) =====
  socket.on("delete room", (roomName) => {
    const user = users[socket.id];
    if (!user || user.role !== "admin") return;
    if (roomName === "عام") return;

    delete rooms[roomName];
    io.emit("room list", Object.keys(rooms));
  });

  // ===== تغيير روم =====
  socket.on("change room", (room) => {
    const user = users[socket.id];
    if (!rooms[room]) return;

    socket.leave(user.room);
    user.room = room;
    socket.join(room);
  });

  // ===== رسالة عامة =====
  socket.on("chat message", (msg) => {
    const user = users[socket.id];
    if (!user) return;

    const data = {
      username: user.username,
      avatar: user.avatar,
      msg,
      time: new Date().toLocaleTimeString()
    };

    io.to(user.room).emit("chat message", data);
  });

  // ===== رسالة خاصة =====
  socket.on("private message", ({ to, msg }) => {

    if (!privateMessages[to]) privateMessages[to] = [];

    const data = {
      from: users[socket.id].username,
      msg,
      time: new Date().toLocaleTimeString()
    };

    privateMessages[to].push(data);
    io.to(to).emit("private message", data);
  });

  // ===== إضافة صديق =====
  socket.on("add friend", (friendId) => {
    if (!friendships[socket.id].includes(friendId)) {
      friendships[socket.id].push(friendId);
    }
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    delete friendships[socket.id];
    updateOnline();
  });

  function updateOnline() {
    io.emit("online users", Object.values(users));
  }

});

server.listen(PORT);
