const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/products", protect, productRoutes);

// 🔌 MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Bağlandı"))
  .catch(err => console.error("❌ MongoDB Hatası:", err));

// ⚡ Socket.io Setup
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

app.set("io", io); // io nesnesi artık app içinde kullanılabilir

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Sunucu açık: http://localhost:${PORT}`));


