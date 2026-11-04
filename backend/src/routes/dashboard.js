
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { getDashboardData } from "../controllers/dashboardController.js";
import { getDashboard1Data } from "../controllers/dashboard1Controller.js";

const router = express.Router();

// Centro de análisis (existente).
router.get("/", authMiddleware, getDashboardData);

// Dashboard 1 · Consolidado. Mismos roles que la navegación de Dashboards.
router.get(
  "/d1",
  authMiddleware,
  requireRole("gerente", "director", "supervisor"),
  getDashboard1Data,
);

export default router;
