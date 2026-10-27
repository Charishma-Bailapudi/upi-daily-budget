const Category = require("../models/Category");

async function getCategories(req, res) {
  const categories = await Category.find({
    $or: [{ userId: null }, { userId: req.user._id }],
  }).sort({ name: 1 });

  return res.status(200).json({ success: true, categories });
}

module.exports = { getCategories };
