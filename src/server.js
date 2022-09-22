import express from "express";
import http from "http";
import {instrument} from "@socket.io/admin-ui";
import {Server} from "socket.io";
import { isSymbolObject } from "util/types";

// variable
const app = express();
const PORT = 4000;

// middleware
app.set("view engine", "pug"); // 템플릿 설정 및 경로지정
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

// routing
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("home"));

// server 구동
const server = http.createServer(app);

const wsServer = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true, //실제 비밀번호 쓸 수 있도록 변경 가능
  }
});

instrument(wsServer, {
  auth: false,
});

// 유저 정보
const sockets = [];

function publicRooms() {
  //wsServer에서 sids와 rooms 가져오기
  const {
    sockets: {
      adapter: {sids, rooms},
    },
  } = wsServer;

  //public room list 생성
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if(sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

//방의 크기 계산 -> welcome, bye event를 보낼 때 함께 보낼 값
function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


// socketIO 연결
wsServer.on("connection", (socket) => {
  // init
  socket["nickname"] = "Anon";

  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  })
  // 채팅방 접속
  socket.on("enter_room", (room, done) => {
    socket.join(room);
    done();
    socket.to(room).emit("welcome", socket.nickname, countRoom(room)); //하나의 socket에만 전송
    wsServer.sockets.emit("room_change",publicRooms()); //모든 socket에 전송
  });
  // 채팅방 퇴장
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  // 채팅
  socket.on("message", (msg, room, done) => {
    socket.to(room).emit("message", `${socket.nickname}: ${msg}`);
    done();
  });
  // 닉네임
  socket.on("nickname", (nickname, done) => {
    socket["nickname"] = nickname;
    done();
  });
});

server.listen(PORT, () => console.log(`✅ Listening on http://localhost:4000`));