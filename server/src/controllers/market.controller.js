const mongoose = require("mongoose");
const Player = require("../models/player.model");
const User = require("../models/user.model");
const ensurePlayerCatalog = require("../utils/playerCatalog");

const priceForPlayer = (player) => player.overallRating * 5;
const playerFields = "name shortName nationality club position overallRating imageUrl stats";

const listMarketPlayers = async (_req, res, next) => {
  try {
    await ensurePlayerCatalog();
    const players = await Player.find({ isTopPlayer2026: true, isActive: true })
      .sort({ overallRating: -1, name: 1 })
      .lean();
    res.json(players.map((player) => ({ ...player, price: priceForPlayer(player) })));
  } catch (error) {
    next(error);
  }
};

const listMyPlayers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("ownedPlayers walletBalance walletUnlimited")
      .populate("ownedPlayers.player", playerFields);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ownedPlayers: user.ownedPlayers, walletBalance: user.walletBalance, walletUnlimited: user.walletUnlimited });
  } catch (error) {
    next(error);
  }
};

const checkout = async (req, res, next) => {
  try {
    const { playerIds } = req.body || {};
    if (!Array.isArray(playerIds) || playerIds.length < 1 || playerIds.length > 20) {
      return res.status(400).json({ message: "Choose between 1 and 20 player cards" });
    }
    if (playerIds.some((id) => typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "One or more player IDs are invalid" });
    }
    if (new Set(playerIds).size !== playerIds.length) {
      return res.status(400).json({ message: "A player card can only be added once" });
    }

    const players = await Player.find({
      _id: { $in: playerIds },
      isTopPlayer2026: true,
      isActive: true,
    }).lean();
    if (players.length !== playerIds.length) {
      return res.status(404).json({ message: "One or more player cards are no longer available" });
    }

    const ownedIds = new Set((req.user.ownedPlayers || []).map((item) => String(item.player)));
    if (playerIds.some((id) => ownedIds.has(id))) {
      return res.status(409).json({ message: "You already own one or more selected player cards" });
    }

    const total = players.reduce((sum, player) => sum + priceForPlayer(player), 0);
    const filter = {
      _id: req.user._id,
      walletUnlimited: req.user.walletUnlimited,
      "ownedPlayers.player": { $nin: playerIds },
    };
    const update = {
      $push: {
        ownedPlayers: {
          $each: players.map((player) => ({ player: player._id, pricePaid: priceForPlayer(player) })),
        },
      },
    };

    if (!req.user.walletUnlimited) {
      filter.walletBalance = { $gte: total };
      update.$inc = { walletBalance: -total };
    }

    const updatedUser = await User.findOneAndUpdate(filter, update, { new: true, runValidators: true })
      .select("displayName username email role walletBalance walletUnlimited ownedPlayers")
      .populate("ownedPlayers.player", playerFields);

    if (!updatedUser) {
      const latestUser = await User.findById(req.user._id).select("walletBalance walletUnlimited ownedPlayers");
      if (!latestUser) return res.status(404).json({ message: "User not found" });
      const latestOwned = new Set(latestUser.ownedPlayers.map((item) => String(item.player)));
      if (playerIds.some((id) => latestOwned.has(id))) {
        return res.status(409).json({ message: "You already own one or more selected player cards" });
      }
      return res.status(400).json({
        message: `Not enough wallet balance. You need $${total.toLocaleString()} and have $${latestUser.walletBalance.toLocaleString()}`,
      });
    }

    const selected = new Set(playerIds);
    const purchased = updatedUser.ownedPlayers.filter((item) => selected.has(String(item.player?._id || item.player)));
    res.status(201).json({
      message: "Player cards purchased successfully",
      purchased,
      user: updatedUser,
      total,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMarketPlayers, listMyPlayers, checkout, priceForPlayer };
