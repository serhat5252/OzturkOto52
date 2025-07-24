const express = require("express");
const { register, login } = require("../controllers/authController");
const router = express.Router();

router.post("/login", login);
router.post("/register", register);  // 👈 Admin kontrolü kaldırıldı

module.exports = router;
