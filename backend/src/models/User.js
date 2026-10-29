const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    upiId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    defaultDailyCap: {
      type: Number,
      required: true,
      default: 3300,
      min: 100,
    },
    savingsPotBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    telegramChatId: {
      type: Number,
      default: null,
    },
    telegramLinkCode: {
      type: String,
      default: null,
    },
    telegramLinkExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index(
  { telegramChatId: 1 },
  { unique: true, partialFilterExpression: { telegramChatId: { $type: "number" } } },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);