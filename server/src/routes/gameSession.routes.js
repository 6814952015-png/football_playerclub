const express = require("express");
const { createGame, updateLineup, startGame, finishGame } = require("../controllers/gameSession.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();
router.post("/", protect, createGame);
router.patch("/:id/lineup", protect, updateLineup);
router.post("/:id/start", protect, startGame);
router.post("/:id/finish", protect, finishGame);

module.exports = router;
