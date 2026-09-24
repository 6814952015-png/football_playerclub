const GameSession = require("../models/gameSession.model");

const createGame = async (req, res, next) => {
  try {
    const game = await GameSession.create({ ...req.body, user: req.user._id, playerName: req.user.displayName });
    res.status(201).json(game);
  } catch (error) {
    next(error);
  }
};

const updateLineup = async (req, res, next) => {
  try {
    const game = await GameSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!game) return res.status(404).json({ message: "Game not found" });
    if (game.status !== "setup") return res.status(400).json({ message: "Lineup can only be changed before the game starts" });

    game.lineup = req.body.lineup;
    game.formation = req.body.formation || game.formation;
    await game.save();
    res.json(game);
  } catch (error) {
    next(error);
  }
};

const startGame = async (req, res, next) => {
  try {
    const game = await GameSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: "playing", startedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  } catch (error) {
    next(error);
  }
};

const finishGame = async (req, res, next) => {
  try {
    const { home, away } = req.body.score || {};
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
      return res.status(400).json({ message: "score.home and score.away must be non-negative integers" });
    }

    const result = home > away ? "winner" : home < away ? "lose" : "draw";
    const game = await GameSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { score: { home, away }, result, status: "finished", finishedAt: new Date(), reward: req.body.reward || {} },
      { new: true, runValidators: true }
    ).populate("lineup.player", "name shortName position overallRating imageUrl");
    if (!game) return res.status(404).json({ message: "Game not found" });

    const statsUpdate = result === "winner" ? { $inc: { "stats.gamesPlayed": 1, "stats.wins": 1, "stats.coins": game.reward.coins } } : { $inc: { "stats.gamesPlayed": 1, "stats.losses": result === "lose" ? 1 : 0, "stats.coins": game.reward.coins } };
    await req.user.updateOne(statsUpdate);

    // UI uses this payload to render the Winner / Lose result screen.
    res.json({ result: game.result, score: game.score, reward: game.reward, game });
  } catch (error) {
    next(error);
  }
};

module.exports = { createGame, updateLineup, startGame, finishGame };
