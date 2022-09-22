const socket = io();

const nickname = document.getElementById("nickname");
const form = nickname.querySelector("form");
const welcome = document.getElementById("welcome");
const room = document.getElementById("room");

let roomName = "";
welcome.hidden = true;
room.hidden = true;

function addMessage(message){
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.append(li);
};

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("input");
  const value = input.value;
  socket.emit("message", input.value, roomName, () =>
    addMessage(`You: ${value}`)
  );
  input.value = "";
};

function showRoom() {
  const h3 = room.querySelector("h3");
  const form = room.querySelector("form");
  welcome.hidden = true;
  room.hidden = false;
  h3.innerText = `Room ${roomName}`;
  form.addEventListener("submit", handleMessageSubmit);
};

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = welcome.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
};

function setRoom() {
  const form = welcome.querySelector("form");
  nickname.hidden = true;
  welcome.hidden = false;
  form.addEventListener("submit", handleRoomSubmit);
};

function handleNickSubmit(event) {
  event.preventDefault();
  const input = nickname.querySelector("input");
  socket.emit("nickname", input.value, setRoom);
};

form.addEventListener("submit", handleNickSubmit);

socket.on("welcome", (nickname, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${nickname} Joined!`)
}); 

socket.on("bye", (nickname, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${nickname} Left!`)}
);

socket.on("message", addMessage);

//room_change event가 발생했을 때, rooms 배열 반환하도록
socket.on("room_change",(rooms) => {
  //room이 하나도 없을 때 비워주는 역할
  if(rooms.length === 0) {
    roomList.innerHTML = "";
    return;
  }
  const roomList = welcome.querySelector("ul");
  rooms.forEach(room => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
//socket.on("room_change", (msg) => console.log(msg));와 같음