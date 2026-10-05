import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/test",
  authMiddleware,
  requireRole("administrador"),
  (req, res) => {
    return res.json({
      success: true,
      message:
        "Acceso de administrador confirmado.",
      user: req.user,
    });
  }
);

export default router;