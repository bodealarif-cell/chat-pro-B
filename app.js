const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

const messages = [];

io.on("connection", (socket) => {

  // إرسال الرسائل القديمة
  socket.emit("load messages", messages);

  socket.on("chat message", (data) => {

    if (!data.msg || data.msg.trim() === "" || data.msg.length > 300) return;

    const messageData = {
      name: data.name || "مجهول",
      msg: data.msg.trim(),
      time: new Date().toLocaleTimeString()
    };

    messages.push(messageData);

    io.emit("chat message", messageData);
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
