const mongoose = require("mongoose");

const lineupPlayerSchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    fieldPosition: {
      type: String,
      required: true,
      enum: ["GK", "LB", "CB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"],
    },
    // Percentage coordinates preserve a dragged player layout on any display size.
    uiPosition: {
      x: { type: Number, required: true, min: 0, max: 100 },
      y: { type: Number, required: true, min: 0, max: 100 },
    },
    isCaptain: { type: Boolean, default: false },
  },
  { _id: false }
);

const gameSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    playerName: { type: String, trim: true, maxlength: 50 },
    mode: { type: String, required: true, enum: ["penalty-shootout", "skill-challenge", "quick-match"] },
    formation: { type: String, default: "4-3-3", trim: true },
    lineup: {
      type: [lineupPlayerSchema],
      validate: {
        validator: (lineup) => lineup.length >= 1 && lineup.length <= 11,
        message: "A lineup must contain between 1 and 11 players.",
      },
    },
    opponent: {
      name: { type: String, required: true, trim: true },
      overallRating: { type: Number, required: true, min: 1, max: 100 },
      badgeUrl: { type: String, trim: true },
    },
    status: { type: String, enum: ["setup", "playing", "finished", "abandoned"], default: "setup", index: true },
    score: {
      home: { type: Number, default: 0, min: 0 },
      away: { type: Number, default: 0, min: 0 },
    },
    result: { type: String, enum: ["winner", "lose", "draw", null], default: null },
    reward: {
      coins: { type: Number, default: 0, min: 0 },
      experience: { type: Number, default: 0, min: 0 },
    },
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true }
);

gameSessionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("GameSession", gameSessionSchema);
