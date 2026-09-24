const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res, next) => {
  try {
    const { displayName, username, email, password } = req.body;
    const exists = await User.exists({ $or: [{ email: email?.toLowerCase() }, { username: username?.toLowerCase() }] });
    if (exists) return res.status(409).json({ message: "Email or username is already in use" });
    // Role never comes from the public request body. Set ADMIN_EMAIL in the server environment
    // once to bootstrap the first administrator safely.
    const isBootstrapAdmin = process.env.ADMIN_EMAIL?.toLowerCase() === email?.toLowerCase();
    const user = await User.create({ displayName, username, email, password, role: isBootstrapAdmin ? "admin" : "player" });
    res.status(201).json({ token: createToken(user._id), user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password || ""))) {
      return res.status(401).json({ message: "Email or password is incorrect" });
    }
    if (user.isBanned) return res.status(403).json({ message: "This account has been banned" });
    res.json({ token: createToken(user._id), user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

const getProfile = (req, res) => res.json(req.user);

const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatarUrl, favoritePlayers } = req.body;
    if (displayName !== undefined) req.user.displayName = displayName;
    if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
    if (favoritePlayers !== undefined) req.user.favoritePlayers = favoritePlayers;
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile };
