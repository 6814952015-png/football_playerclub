const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { createRoom, createAiRoom, getRoom, joinRoom, myRooms, leaveRoom, removeGuest } = require("../controllers/room.controller");

const router = express.Router();
router.use(protect);
router.get("/mine", myRooms);
router.post("/", createRoom);
router.post("/ai", createAiRoom);
router.get("/:code", getRoom);
router.post("/:code/join", joinRoom);
router.delete("/:code/guest", removeGuest);
router.delete("/:code/leave", leaveRoom);

module.exports = router;
