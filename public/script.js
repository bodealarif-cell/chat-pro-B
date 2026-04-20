const socket = io();

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const errorText = document.getElementById("error");

document.getElementById("loginBtn").onclick = () => {
  const username = document.getElementById("username").value;
  const code = document.getElementById("code").value;

  socket.emit("login", { username, code });
};

socket.on("login error", (msg) => {
  errorText.textContent = msg;
});

socket.on("login success", (data) => {
  loginScreen.style.display = "none";
  chatScreen.style.display = "flex";

  document.getElementById("roomTitle").textContent = data.room;

  const roomList = document.getElementById("roomList");
  data.rooms.forEach(room => {
    const li = document.createElement("li");
    li.textContent = room;
    li.onclick = () => socket.emit("change room", room);
    roomList.appendChild(li);
  });
});

socket.on("room changed", (room) => {
  document.getElementById("roomTitle").textContent = room;
  document.getElementById("messages").innerHTML = "";
});

socket.on("online users", (users) => {
  const list = document.getElementById("onlineUsers");
  list.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.username;
    list.appendChild(li);
  });
});

document.getElementById("send").onclick = sendMessage;
document.getElementById("msg").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msgInput = document.getElementById("msg");
  const msg = msgInput.value.trim();
  if (!msg) return;

  socket.emit("chat message", msg);
  msgInput.value = "";
}

socket.on("chat message", (data) => {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${data.username}</strong>: ${data.msg} <small>${data.time}</small>`;
  document.getElementById("messages").appendChild(li);
});
