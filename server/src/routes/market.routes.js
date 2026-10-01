const express = require("express");
const { listMarketPlayers, listMyPlayers, checkout } = require("../controllers/market.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();
router.get("/players", listMarketPlayers);
router.get("/mine", protect, listMyPlayers);
router.post("/checkout", protect, checkout);

module.exports = router;
