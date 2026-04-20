const socket = io();

let currentUser = null;
let currentRoom = "عام";

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const errorText = document.getElementById("error");

document.getElementById("loginBtn").onclick = () => {
  const username = document.getElementById("username").value.trim();
  const code = document.getElementById("code").value.trim();
  const avatar = document.getElementById("avatar").value.trim();

  socket.emit("login", { username, code, avatar });
};

socket.on("login error", (msg) => {
  errorText.textContent = msg;
});

socket.on("login success", (data) => {
  currentUser = data.user;

  loginScreen.style.display = "none";
  chatScreen.style.display = "flex";

  loadRooms(data.rooms);
  document.getElementById("roomTitle").textContent = "عام";
});

function loadRooms(rooms) {
  const list = document.getElementById("roomList");
  list.innerHTML = "";

  rooms.forEach(room => {
    const li = document.createElement("li");
    li.textContent = room;
    li.style.cursor = "pointer";

    li.onclick = () => {
      currentRoom = room;
      document.getElementById("messages").innerHTML = "";
      document.getElementById("roomTitle").textContent = room;
      socket.emit("change room", room);
    };

    // زر حذف للأدمن فقط
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

socket.on("room list", (rooms) => {
  loadRooms(rooms);
});

socket.on("online users", (users) => {
  const list = document.getElementById("onlineUsers");
  list.innerHTML = "";

  users.forEach(u => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="online-dot">●</span>
      <img src="${u.avatar}" width="25" style="border-radius:50%">
      ${u.username}
    `;

    li.style.cursor = "pointer";

    // رسالة خاصة
    li.onclick = () => {
      const msg = prompt("رسالة خاصة:");
      if (!msg) return;
      socket.emit("private message", { to: u.id, msg });
    };

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
    <img src="${data.avatar}">
    <div>
      <strong>${data.username}</strong>
      <div>${data.msg}</div>
      <small>${data.time}</small>
    </div>
  `;

  document.getElementById("messages").appendChild(li);
});

socket.on("private message", (data) => {
  alert("📩 رسالة خاصة من " + data.from + ":\n" + data.msg);
});
