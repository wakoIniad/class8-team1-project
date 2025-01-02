const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:8000", // Djangoサーバーからのアクセスを許可する！
      methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    const origin = socket.request.headers.origin;
    const url = new URL(origin);
    const CLIENT_ROOM_ID = url.pathname; 
    console.log(origin);
    socket.join(CLIENT_ROOM_ID);
    socket.on('update', (update_keys, update_values)=> {
        console.log(CLIENT_ROOM_ID, update_keys, update_values);
        socket.to(CLIENT_ROOM_ID).emit('update', update_keys, update_values);
    });
});

httpServer.listen(3000);