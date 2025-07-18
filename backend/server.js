const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // ✅ sadece bir tane tanımlı

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Route'lar
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/products", protect, productRoutes);

// ✅ FRONTEND SERVİSİ (sadece 1 kez)
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// 🔌 MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Bağlandı"))
  .catch(err => console.error("❌ MongoDB Hatası:", err));

// ⚡ Socket.io kurulumu
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", socket => {
  console.log("📡 Yeni kullanıcı bağlandı:", socket.id);
});

app.set("io", io);

// 🔊 Port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Sunucu açık: http://localhost:${PORT}`)
);






