const express = require("express");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { listUsers, updateUser, createMarketPlayer, listPurchaseHistory } = require("../controllers/admin.controller");
const { getAllPlayers, updatePlayer } = require("../controllers/player.controller");

const router = express.Router();
router.use(protect, authorize("admin"));
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.get("/players", getAllPlayers);
router.post("/players", createMarketPlayer);
router.patch("/players/:id", updatePlayer);
router.get("/purchases", listPurchaseHistory);

module.exports = router;
