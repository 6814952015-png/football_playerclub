const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    nationality: { type: String, required: true, trim: true },
    club: { type: String, required: true, trim: true },
    position: { type: String, required: true, enum: ["GK", "DEF", "MID", "FWD"] },
    shirtNumber: { type: Number, min: 1, max: 99 },
    overallRating: { type: Number, required: true, min: 1, max: 100 },
    stats: {
      pace: { type: Number, default: 50, min: 1, max: 100 },
      shooting: { type: Number, default: 50, min: 1, max: 100 },
      passing: { type: Number, default: 50, min: 1, max: 100 },
      dribbling: { type: Number, default: 50, min: 1, max: 100 },
      defending: { type: Number, default: 50, min: 1, max: 100 },
      physical: { type: Number, default: 50, min: 1, max: 100 },
      goalkeeping: { type: Number, default: 0, min: 0, max: 100 },
    },
    imageUrl: { type: String, required: true, trim: true },
    isTopPlayer2026: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

playerSchema.index({ isTopPlayer2026: 1, overallRating: -1 });

module.exports = mongoose.model("Player", playerSchema);
