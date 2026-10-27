require("dotenv").config();

const connectDB = require("../config/db");
const Category = require("../models/Category");
const mongoose = require("mongoose");

const categories = [
  { name: "FOOD", icon: "utensils", color: "#10B981" },
  { name: "TRAVEL", icon: "car", color: "#3B82F6" },
  { name: "BILLS", icon: "zap", color: "#F59E0B" },
  { name: "GROCERIES", icon: "shopping-cart", color: "#8B5CF6" },
  { name: "SHOPPING", icon: "shopping-bag", color: "#EC4899" },
  { name: "ENTERTAINMENT", icon: "film", color: "#06B6D4" },
  { name: "OTHER", icon: "tag", color: "#6B7280" },
];

async function seedCategories() {
  await connectDB();

  try {
    await Promise.all(
      categories.map(({ name, icon, color }) =>
        Category.findOneAndUpdate(
          { name, userId: null },
          {
            $set: { icon, color, isDefault: true },
            $setOnInsert: { name, userId: null },
          },
          {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true,
          },
        ),
      ),
    );

    console.log("Default categories seeded successfully");
  } finally {
    await mongoose.disconnect();
  }
}

seedCategories().catch((error) => {
  console.error("Failed to seed default categories:", error);
  process.exitCode = 1;
});
