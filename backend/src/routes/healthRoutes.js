const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/health", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    return res.status(200).json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: "unhealthy",
    database: "disconnected",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
