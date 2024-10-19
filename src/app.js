let express = require("express");
let fs = require("fs");
let https = require("https");
let socketIO = require("socket.io");
let stream = require("./ws/stream");
let path = require("path");
let favicon = require("serve-favicon");

let app = express();

// SSL certificate options
let sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/server.mgplugins.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/server.mgplugins.com/fullchain.pem')
};

// Setup middlewares
app.use(favicon(path.join(__dirname, "favicon.ico")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Route for serving the index.html
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/index.html");
});

// Create HTTPS server
let httpsServer = https.createServer(sslOptions, app);

// Setup socket.io for WebSocket connections
let io = socketIO(httpsServer);
io.of("/stream").on("connection", stream);

// Listen on port 3000
httpsServer.listen(3000, () => {
  console.log("HTTPS server running on port 3000");
});