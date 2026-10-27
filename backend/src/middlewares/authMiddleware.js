const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  const authorization = req.get("authorization");
  const parts = authorization ? authorization.trim().split(/\s+/) : [];
  const [scheme, token] = parts;

  if (parts.length !== 2 || scheme.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is not set"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload || typeof payload === "string" || typeof payload.userId !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    return next(error);
  }
}

module.exports = { protect };
