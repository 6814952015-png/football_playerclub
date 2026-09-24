const mongoose = require("mongoose");

const createRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      default: createRoomCode,
      match: /^[A-Z0-9]{6}$/,
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    maxPlayers: { type: Number, default: 2, immutable: true, min: 1, max: 2 },
    // A room always starts with, and is capped at, a $1,000 budget.
    budgetLimit: { type: Number, default: 1000, immutable: true, min: 1000, max: 1000 },
    status: { type: String, enum: ["waiting", "ready", "playing", "finished"], default: "waiting", index: true },
    opponentType: { type: String, enum: ["human", "ai"], default: "human", immutable: true },
    aiDifficulty: { type: String, enum: ["easy", "normal", "hard"], default: "normal" },
  },
  { timestamps: true }
);

roomSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Room", roomSchema);
