const socket = io();

let currentUser = null;

document.getElementById("loginBtn").onclick = () => {
  const username = document.getElementById("username").value.trim();
  const code = document.getElementById("code").value.trim();

  socket.emit("login", { username, code });
};

socket.on("login error", (msg) => {
  document.getElementById("error").textContent = msg;
});

socket.on("login success", (data) => {
  currentUser = data.user;

  document.getElementById("login-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "flex";

  loadRooms(data.rooms);
});

function loadRooms(rooms) {
  const list = document.getElementById("roomList");
  list.innerHTML = "";

  rooms.forEach(room => {
    const li = document.createElement("li");
    li.textContent = room;
    li.style.cursor = "pointer";

    li.onclick = () => {
      document.getElementById("messages").innerHTML = "";
      document.getElementById("roomTitle").textContent = room;
      socket.emit("change room", room);
    };

    if (currentUser.role === "admin" && room !== "عام") {
      const del = document.createElement("button");
      del.textContent = "🗑";
      del.onclick = () => socket.emit("delete room", room);
      li.appendChild(del);
    }

    list.appendChild(li);
  });
}

document.getElementById("createRoomBtn").onclick = () => {
  const room = document.getElementById("newRoom").value.trim();
  if (!room) return;
  socket.emit("create room", room);
};

socket.on("room list", loadRooms);

socket.on("online users", (users) => {
  const list = document.getElementById("onlineUsers");
  list.innerHTML = "";

  users.forEach(u => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="online-dot">●</span>${u.username}`;
    list.appendChild(li);
  });
});

document.getElementById("send").onclick = sendMessage;

document.getElementById("msg").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const input = document.getElementById("msg");
  const msg = input.value.trim();
  if (!msg) return;

  socket.emit("chat message", msg);
  input.value = "";
}

socket.on("chat message", (data) => {
  const li = document.createElement("li");
  li.classList.add("message");

  li.innerHTML = `
    <strong>${data.username}</strong><br>
    ${data.msg}<br>
    <small>${data.time}</small>
  `;

  document.getElementById("messages").appendChild(li);
});
