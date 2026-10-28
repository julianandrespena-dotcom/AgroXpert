import express from "express";

import {
  getZonas,
  getHaciendas,
  getSuertes,
  getMyAccess,
  getUserAccess,
  updateUserAccess,
} from "../controllers/accessController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Cada usuario consulta sus propias asignaciones.
router.get("/me", authMiddleware, getMyAccess);

// Las siguientes rutas son exclusivas del administrador.
router.use(authMiddleware, requireRole("administrador"));

router.get("/zonas", getZonas);
router.get("/haciendas", getHaciendas);
router.get("/suertes", getSuertes);

router.get("/usuarios/:id", getUserAccess);
router.put("/usuarios/:id", updateUserAccess);

export default router;