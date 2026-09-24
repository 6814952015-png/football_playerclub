const express = require("express");
const { getTopPlayers, getAllPlayers, createPlayer, updatePlayer } = require("../controllers/player.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();
router.get("/top-2026", getTopPlayers);
router.get("/", protect, authorize("admin"), getAllPlayers);
router.post("/", protect, authorize("admin"), createPlayer);
router.patch("/:id", protect, authorize("admin"), updatePlayer);

module.exports = router;
