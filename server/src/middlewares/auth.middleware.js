const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Authentication token is required" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: "JWT_SECRET is not configured" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.userId);
    if (!req.user) return res.status(401).json({ message: "User no longer exists" });
    if (req.user.isBanned) return res.status(403).json({ message: "This account has been banned" });
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Administrator permission is required" });
  }
  next();
};

module.exports = { protect, authorize };
