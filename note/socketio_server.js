const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:8000", // Djangoサーバーからのアクセスを許可する！
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
        socket.on('update', (target_id, update_keys, update_values)=> {
            console.log(CLIENT_ROOM_ID, target_id, update_keys, update_values);
            socket.to(CLIENT_ROOM_ID).emit('update', target_id, update_keys, update_values);
        });
    }
});

httpServer.listen(3000);