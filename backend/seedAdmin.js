const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User"); // doğru yolu kontrol et

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB bağlantısı başarılı");

    const existing = await User.findOne({ username: "admin" });
    if (existing) {
      console.log("⚠️ Admin zaten var.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new User({
      username: "admin",
      password: hashedPassword,
    });

    await admin.save();
    console.log("✅ Admin kullanıcı başarıyla oluşturuldu: admin / admin123");
    process.exit();
  } catch (err) {
    console.error("❌ Hata:", err.message);
    process.exit(1);
  }
}

createAdmin();
