const express = require("express");
const cors = require("cors");
const playerRoutes = require("./routes/player.routes");
const gameSessionRoutes = require("./routes/gameSession.routes");
const userRoutes = require("./routes/user.routes");
const roomRoutes = require("./routes/room.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const app = express();

// 1. Global middleware
app.use(cors());
app.use(express.json());

// 2. Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/players", playerRoutes);
app.use("/api/games", gameSessionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/admin", adminRoutes);

// 3. Error handling — must be LAST
app.use(notFound);
app.use(errorHandler);

module.exports = app;
