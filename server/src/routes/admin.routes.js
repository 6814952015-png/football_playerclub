const express = require("express");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { listUsers, updateUser } = require("../controllers/admin.controller");

const router = express.Router();
router.use(protect, authorize("admin"));
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);

module.exports = router;
