const User = require("../models/user.model");

const listUsers = async (_req, res, next) => {
  try {
    const users = await User.find().select("displayName username email avatarUrl role walletBalance walletUnlimited isBanned stats createdAt").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const allowed = ["displayName", "avatarUrl", "role", "isBanned", "walletUnlimited", "walletBalance"];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .select("displayName username email avatarUrl role walletBalance walletUnlimited isBanned stats createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) { next(error); }
};

module.exports = { listUsers, updateUser };
