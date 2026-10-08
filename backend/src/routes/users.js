import express from "express";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserPassword,
  deleteUser,
} from "../controllers/userController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(
  authMiddleware,
  requireRole("administrador")
);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.patch("/:id/password", updateUserPassword);
router.delete("/:id", deleteUser);

export default router;