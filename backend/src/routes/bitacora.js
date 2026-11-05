import express from "express";

import { getBitacora } from "../controllers/bitacoraController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(
  authMiddleware,
  requireRole("administrador")
);

router.get("/", getBitacora);

export default router;
