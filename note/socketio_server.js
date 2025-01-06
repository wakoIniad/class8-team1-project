

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// "/socket" に限定して Socket.IO を動かす設定
const io = new Server(server, {
  //path: '/socket', // "/socket" のパスを指定
  cors: {
    origin: [
        'http://localhost', 
        'http://127.0.0.1',
    ],
      //"http://localhost:8000", // Djangoサーバーからのアクセスを許可する！
      //"'https://earwig-ruling-forcibly.ngrok-free.app'", //#本番環境では削除
    //],
    methods: ["GET", "POST"],
    allowedHeaders: ["self-proclaimed-referer"],  // クライアントから送るカスタムヘッダーを指定
    credentials: true,
  }
}); 

io.on("connection", (socket) => {
    const request = socket.handshake;
    const referer = request.headers.referer || socket.handshake.headers['self-proclaimed-referer'];
    console.log(referer)
    if(referer) {
        const url = new URL(referer);
        const CLIENT_ROOM_ID = url.pathname;
        socket.join(CLIENT_ROOM_ID);
        socket.on('update', (target_id, update_keys, update_values) => {
            console.log(CLIENT_ROOM_ID, target_id, update_keys, update_values);
            socket.to(CLIENT_ROOM_ID).emit('update', target_id, update_keys, update_values);
        });
        socket.on('create', (range, type, id) => {
            console.log(CLIENT_ROOM_ID, range, type, id);
            socket.to(CLIENT_ROOM_ID).emit('create', range, type, id);
        });
        socket.on('delete', (id) => {
            console.log(CLIENT_ROOM_ID, id);
            socket.to(CLIENT_ROOM_ID).emit('delete', id);
        });
    }
});
// ポート 8000 でサーバーを起動
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/');
});