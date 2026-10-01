const app = require("../server/src/app");
const connectDB = require("../server/src/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();

    const route = req.query?.path;
    if (route) {
      const routePath = Array.isArray(route) ? route.join("/") : route;
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key === "path" || value === undefined) continue;
        for (const item of Array.isArray(value) ? value : [value]) query.append(key, String(item));
      }
      req.url = `/api/${routePath}${query.size ? `?${query.toString()}` : ""}`;
    }

    return app(req, res);
  } catch (error) {
    console.error("API initialization failed:", error.message);
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }
};
