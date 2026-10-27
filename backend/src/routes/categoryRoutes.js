const express = require("express");
const { getCategories } = require("../controllers/categoryController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getCategories);

module.exports = router;
