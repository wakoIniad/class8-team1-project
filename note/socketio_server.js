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
    console.log('OOON')
    const origin = socket.request.headers.origin;
    const url = new URL(origin);
    const roomName = url.pathname;
});

httpServer.listen(3000);