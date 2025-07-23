const express = require("express");
const { register, login } = require("../controllers/authController");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/login", login);
router.post("/register", protect, isAdmin, register);

module.exports = router;
