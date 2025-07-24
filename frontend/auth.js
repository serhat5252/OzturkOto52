const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Token üretme
const generateToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Admin tarafından kullanıcı kaydı
exports.register = async (req, res) => {
  const { username, password } = req.body;

  if (!req.user || req.user.username !== "admin") {
    return res.status(403).json({ message: "Sadece admin kayıt yapabilir" });
  }

  if (!username || !password)
    return res.status(400).json({ message: "Kullanıcı adı ve şifre zorunludur" });

  const existing = await User.findOne({ username: { $regex: `^${username}$`, $options: "i" } });
  if (existing)
    return res.status(400).json({ message: "Bu kullanıcı adı zaten kayıtlı" });

  const user = await User.create({ username, password });
  res.status(201).json({
    _id: user._id,
    username: user.username
  });
};

// Giriş işlemi
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Hatalı kullanıcı adı veya şifre" });
  }

  const token = generateToken(user._id);

  res.json({
    _id: user._id,
    username: user.username,
    token
  });
};
