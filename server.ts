import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Set COOP/COEP headers for SharedArrayBuffer support (critical for FFmpeg.wasm)
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

  // Socket.io logic
  const users = new Map();

  io.on("connection", (socket) => {
    console.log("👤 User connected:", socket.id);

    socket.on("join-project", (projectId, userData) => {
      socket.join(projectId);
      users.set(socket.id, { ...userData, id: socket.id, projectId });
      
      // Broadcast presence to others in the same project
      const projectUsers = Array.from(users.values()).filter(u => u.projectId === projectId);
      io.to(projectId).emit("presence-update", projectUsers);
      
      console.log(`📂 User ${socket.id} joined project ${projectId}`);
    });

    socket.on("timeline-update", (projectId, update) => {
      // Broadcast timeline changes to others in the same project
      socket.to(projectId).emit("timeline-sync", update);
    });

    socket.on("playhead-move", (projectId, time) => {
      // Broadcast playhead movement
      socket.to(projectId).emit("playhead-sync", { userId: socket.id, time });
    });

    socket.on("disconnect", () => {
      const user = users.get(socket.id);
      if (user) {
        const projectId = user.projectId;
        users.delete(socket.id);
        const projectUsers = Array.from(users.values()).filter(u => u.projectId === projectId);
        io.to(projectId).emit("presence-update", projectUsers);
      }
      console.log("👤 User disconnected:", socket.id);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false, // Explicitly disable HMR in middleware mode
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 NextGen Server running on http://localhost:${PORT}`);
    console.log(`🛡️  COOP/COEP Headers Enabled`);
    console.log(`⚡ Socket.io Real-time Engine Ready`);
  });
}

startServer();
