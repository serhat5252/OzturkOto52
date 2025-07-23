const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Eksik bilgi" });

  if (await User.findOne({ username }))
    return res.status(400).json({ message: "Kullanıcı zaten var" });

  const user = await User.create({ username, password });
  res.status(201).json({
    _id: user._id,
    username: user.username,
    token: generateToken(user._id)
  });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: "Hatalı giriş" });

  res.json({
    _id: user._id,
    username: user.username,
    token: generateToken(user._id)
  });
};
