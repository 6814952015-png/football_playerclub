const Player = require("../models/player.model");

const getTopPlayers = async (req, res, next) => {
  try {
    const players = await Player.find({ isTopPlayer2026: true, isActive: true })
      .sort({ overallRating: -1, name: 1 });
    res.json(players);
  } catch (error) {
    next(error);
  }
};

const createPlayer = async (req, res, next) => {
  try {
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
};

const getAllPlayers = async (_req, res, next) => {
  try { res.json(await Player.find().sort({ name: 1 })); } catch (error) { next(error); }
};

const updatePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  } catch (error) { next(error); }
};

module.exports = { getTopPlayers, getAllPlayers, createPlayer, updatePlayer };
