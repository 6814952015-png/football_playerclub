const express = require("express");
const { register, login, getProfile, updateProfile } = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.patch("/me", protect, updateProfile);

module.exports = router;
