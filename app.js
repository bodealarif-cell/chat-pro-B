const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ===== بيانات في الذاكرة =====
const ACCESS_CODE = "12345"; // غيره براحتك

let users = {}; 
let rooms = {
  "عام": [],
  "برمجة": [],
  "ألعاب": []
};

// ===== الاتصال =====
io.on("connection", (socket) => {

  // تسجيل الدخول
  socket.on("login", ({ username, code }) => {

    if (code !== ACCESS_CODE) {
      return socket.emit("login error", "كود الدخول غير صحيح");
    }

    if (!username || username.trim() === "") {
      return socket.emit("login error", "اكتب اسم صحيح");
    }

    users[socket.id] = {
      username,
      room: "عام"
    };

    socket.join("عام");

    socket.emit("login success", {
      username,
      room: "عام",
      rooms: Object.keys(rooms)
    });

    io.emit("online users", Object.values(users));
  });

  // تغيير روم
  socket.on("change room", (room) => {

    if (!rooms[room]) return;

    const oldRoom = users[socket.id].room;
    socket.leave(oldRoom);

    users[socket.id].room = room;
    socket.join(room);

    socket.emit("room changed", room);
  });

  // إرسال رسالة
  socket.on("chat message", (msg) => {

    const user = users[socket.id];
    if (!user) return;

    const messageData = {
      username: user.username,
      msg: msg.trim(),
      time: new Date().toLocaleTimeString()
    };

    rooms[user.room].push(messageData);

    io.to(user.room).emit("chat message", messageData);
  });

  // عند الخروج
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("online users", Object.values(users));
  });

});

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
