const app = require("../server/src/app");
const connectDB = require("../server/src/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("API initialization failed:", error.message);
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }
};
