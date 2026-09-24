const Room = require("../models/room.model");

const roomView = (room) => room.populate([
  { path: "host", select: "displayName username avatarUrl" },
  { path: "guest", select: "displayName username avatarUrl" },
]);

const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create({ name: req.body.name, host: req.user._id });
    res.status(201).json(await roomView(room));
  } catch (error) { next(error); }
};

const createAiRoom = async (req, res, next) => {
  try {
    const difficulty = ["easy", "normal", "hard"].includes(req.body.difficulty) ? req.body.difficulty : "normal";
    const room = await Room.create({
      name: `AI Arena (${difficulty.toUpperCase()})`, host: req.user._id, maxPlayers: 1,
      opponentType: "ai", aiDifficulty: difficulty, status: "ready",
    });
    res.status(201).json(await roomView(room));
  } catch (error) { next(error); }
};

const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(await roomView(room));
  } catch (error) { next(error); }
};

const joinRoom = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const existing = await Room.findOne({ code });
    if (!existing) return res.status(404).json({ message: "Room not found" });
    // A host who enters their own code should be returned to the room, not treated as an error.
    if (existing.host.equals(req.user._id)) return res.json(await roomView(existing));
    if (existing.guest?.equals(req.user._id)) return res.json(await roomView(existing));

    // The guest:null condition makes joining atomic: only one player can take the second seat.
    const room = await Room.findOneAndUpdate(
      { _id: existing._id, status: "waiting", guest: null },
      { $set: { guest: req.user._id, status: "ready" } },
      { new: true, runValidators: true }
    );
    if (!room) return res.status(409).json({ message: "Room is already full" });
    res.json(await roomView(room));
  } catch (error) { next(error); }
};

const myRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ $or: [{ host: req.user._id }, { guest: req.user._id }] })
      .sort({ updatedAt: -1 })
      .populate("host guest", "displayName username avatarUrl");
    res.json(rooms);
  } catch (error) { next(error); }
};

const leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.host.equals(req.user._id)) {
      await room.deleteOne();
      return res.status(204).end();
    }
    if (!room.guest?.equals(req.user._id)) return res.status(403).json({ message: "You are not in this room" });
    room.guest = null;
    room.status = "waiting";
    await room.save();
    res.json(await roomView(room));
  } catch (error) { next(error); }
};

const removeGuest = async (req, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.host.equals(req.user._id)) return res.status(403).json({ message: "Only the room host can remove a player" });
    if (!room.guest) return res.status(400).json({ message: "There is no guest to remove" });
    room.guest = null;
    room.status = "waiting";
    await room.save();
    res.json(await roomView(room));
  } catch (error) { next(error); }
};

module.exports = { createRoom, createAiRoom, getRoom, joinRoom, myRooms, leaveRoom, removeGuest };
