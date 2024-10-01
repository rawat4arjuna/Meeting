import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.get("/create-meeting", (req, res) => {
  const meetingId = uuidv4();
  res.send({ meetingId });
});

io.on("connection", (socket) => {
  socket.on("join", ({ meetingId, userId }) => {
    socket.join(meetingId);
    console.log("User joined:", meetingId, userId, socket.id);
    socket.to(meetingId).emit("new-user", userId);

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
      socket.to(meetingId).emit("user-disconnected", userId);
    });

    socket.on("offer", (data) => {
      console.log("Offer from:", data.sender, "to:", data.target);
      socket.to(data.target).emit("offer", {
        sdp: data.sdp,
        sender: userId,
      });
    });

    socket.on("answer", (data) => {
      console.log("Answer from:", data.sender, "to:", data.target);
      socket.to(data.target).emit("answer", {
        sdp: data.sdp,
        sender: userId,
      });
    });

    socket.on("candidate", (data) => {
      console.log("Candidate from:", data.sender, "to:", data.target);
      socket.to(data.target).emit("candidate", {
        candidate: data.candidate,
        sender: userId,
      });
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
