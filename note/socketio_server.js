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
    const CLIENT_NAME_SPACE = url.pathname; 

    //ルームではなく、名前空間を使用
    const clientSocket = io.of(CLIENT_NAME_SPACE);

    clientSocket.use((socket, next) => {
        //ここで認証ができる
        next();//nextで接続を許可
    });

    // 名前空間内で接続のイベントを処理
    clientSocket.on('connection', (clientSocket) => {
        console.log(`${CLIENT_NAME_SPACE} に接続しました`);

        clientSocket.on('message', (data) => {
            console.log(`メッセージ: ${data}`);
    });
});

httpServer.listen(3000);