const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "tag",
    },
    color: {
      type: String,
      default: "#10B981",
    },
    isDefault: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

categorySchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);
