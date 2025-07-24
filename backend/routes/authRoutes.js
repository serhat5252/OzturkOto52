const express = require("express");
const { login, register } = require("../controllers/authController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);                // Giriş herkese açık
router.post("/register", protect, isAdmin, register);  // Sadece admin kullanıcı kayıt yapabilir

module.exports = router;
