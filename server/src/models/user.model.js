const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    username: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 20, unique: true, match: /^[a-z0-9_]+$/ },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^\S+@\S+\.\S+$/ },
    password: { type: String, required: true, minlength: 8, select: false },
    avatarUrl: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["player", "admin"], default: "player", index: true },
    isBanned: { type: Boolean, default: false, index: true },
    walletUnlimited: { type: Boolean, default: false },
    // Each newly registered account receives this starting wallet automatically.
    walletBalance: { type: Number, default: 1000, min: 0 },
    favoritePlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    stats: {
      gamesPlayed: { type: Number, default: 0, min: 0 },
      wins: { type: Number, default: 0, min: 0 },
      losses: { type: Number, default: 0, min: 0 },
      coins: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true, toJSON: { transform: (_doc, returned) => { delete returned.password; delete returned.__v; return returned; } } }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
