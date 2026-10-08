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

/*
  ACCESOS DEL USUARIO AUTENTICADO

  Esta ruta permite que cualquier usuario
  autenticado consulte únicamente sus propios
  accesos: zonas, haciendas y suertes.
*/
router.get(
  "/me",
  authMiddleware,
  getMyAccess
);

/*
  RUTAS DE ADMINISTRACIÓN

  Estas continúan siendo exclusivas
  del administrador.
*/
router.use(
  authMiddleware,
  requireRole("administrador")
);

router.get(
  "/zonas",
  getZonas
);

router.get(
  "/haciendas",
  getHaciendas
);

router.get(
  "/suertes",
  getSuertes
);

router.get(
  "/usuarios/:id",
  getUserAccess
);

router.put(
  "/usuarios/:id",
  updateUserAccess
);

export default router;