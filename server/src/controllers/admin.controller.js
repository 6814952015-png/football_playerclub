const User = require("../models/user.model");
const Player = require("../models/player.model");

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

const createMarketPlayer = async (req, res, next) => {
  try {
    const { name, shortName, nationality, club, position, shirtNumber, overallRating, imageUrl, stats } = req.body || {};
    const player = await Player.create({
      name, shortName, nationality, club, position, shirtNumber, overallRating, imageUrl, stats,
      isTopPlayer2026: true,
      isActive: true,
    });
    res.status(201).json({ ...player.toJSON(), price: player.overallRating * 5 });
  } catch (error) { next(error); }
};

const listPurchaseHistory = async (_req, res, next) => {
  try {
    const users = await User.find()
      .select("displayName username email ownedPlayers")
      .populate("ownedPlayers.player", "name shortName club position overallRating imageUrl")
      .lean();
    const purchases = users.flatMap((user) => (user.ownedPlayers || []).map((purchase) => ({
      _id: purchase._id,
      user: { _id: user._id, displayName: user.displayName, username: user.username, email: user.email },
      player: purchase.player || null,
      pricePaid: purchase.pricePaid,
      purchasedAt: purchase.purchasedAt,
    }))).sort((a, b) => new Date(b.purchasedAt || 0) - new Date(a.purchasedAt || 0));
    res.json({ purchases, total: purchases.length });
  } catch (error) { next(error); }
};

module.exports = { listUsers, updateUser, createMarketPlayer, listPurchaseHistory };
