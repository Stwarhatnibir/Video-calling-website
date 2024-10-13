import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app = express();
const server = createServer(app);
const io = new Server(server);
const rooms = {};

// Fix for __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from public directory
app.use(express.static(join(__dirname, "public")));

// Route to create a room
app.get("/create-room", (req, res) => {
  const roomId = uuidV4();
  console.log("Creating room with ID:", roomId);
  res.redirect(`/${roomId}`);
});

// Serve the main page (room join)
app.get("/:room", (req, res) => {
  const room = req.params.room;
  if (!rooms[room]) {
    rooms[room] = {};
  }
  console.log(`User joining room: ${room}`);
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log("New socket connection established:", socket.id);

  socket.on("join-user", ({ username, room }) => {
    console.log(`User ${username} attempting to join room ${room}`);
    if (rooms[room]) {
      rooms[room][username] = { id: socket.id };
      socket.join(room);
      io.in(room).emit("joined", rooms[room]);
    }
  });

  socket.on("offer", ({ from, to, offer }) => {
    console.log("Offer sent from", from, "to", to);
    const room = Object.keys(rooms).find((r) => rooms[r][to]);
    io.to(rooms[room][to].id).emit("offer", { from, to, offer });
  });

  socket.on("answer", ({ from, to, answer }) => {
    console.log("Answer sent from", from, "to", to);
    const room = Object.keys(rooms).find((r) => rooms[r][from]);
    io.to(rooms[room][from].id).emit("answer", { from, to, answer });
  });

  socket.on("icecandidate", ({ to, candidate }) => {
    console.log("ICE Candidate received for", to);
    const room = Object.keys(rooms).find((r) => rooms[r][to]);
    io.to(rooms[room][to].id).emit("icecandidate", { candidate });
  });
});

server.listen(9000, () => {
  console.log("Server is running on port 9000");
});
