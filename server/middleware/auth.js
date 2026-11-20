import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing or malformed.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token not provided.",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("FATAL: JWT_SECRET environment variable is missing.");
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    // Attach verified user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid or corrupted authentication token.",
      code: "INVALID_TOKEN",
    });
  }
};

