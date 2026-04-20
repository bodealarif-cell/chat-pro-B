const socket = io();

const nameInput = document.getElementById("name");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const messages = document.getElementById("messages");

let username = "";

sendBtn.onclick = sendMessage;

msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {

  if (!username) {
    username = nameInput.value.trim();
    if (!username) return alert("اكتب اسمك الأول");
    nameInput.disabled = true;
  }

  const msg = msgInput.value.trim();
  if (!msg) return;

  socket.emit("chat message", { name: username, msg });
  msgInput.value = "";
}

socket.on("chat message", (data) => {
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${data.name}</strong>: ${data.msg}
    <div class="time">${data.time}</div>
  `;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("load messages", (oldMessages) => {
  oldMessages.forEach(data => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${data.name}</strong>: ${data.msg}
      <div class="time">${data.time}</div>
    `;
    messages.appendChild(li);
  });
});
