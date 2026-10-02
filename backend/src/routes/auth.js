import express from "express";
import bcrypt from "bcrypt";

import db from "../database/database.js";
import {
  createSession,
  deleteSession,
} from "../services/sessionService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Usuario y contraseña son obligatorios.",
      });
    }

    const usuarioNormalizado = usuario
      .trim()
      .toLowerCase();

    const usuarioEncontrado = db
      .prepare(`
        SELECT
          id,
          usuario,
          password_hash,
          nombre,
          cargo,
          rol,
          zona,
          activo
        FROM usuarios
        WHERE usuario = ?
      `)
      .get(usuarioNormalizado);

    if (!usuarioEncontrado) {
      return res.status(401).json({
        success: false,
        message:
          "Usuario o contraseña incorrectos.",
      });
    }

    if (!usuarioEncontrado.activo) {
      return res.status(403).json({
        success: false,
        message:
          "Este usuario se encuentra desactivado.",
      });
    }

    const passwordCorrecta =
      await bcrypt.compare(
        password,
        usuarioEncontrado.password_hash
      );

    if (!passwordCorrecta) {
      return res.status(401).json({
        success: false,
        message:
          "Usuario o contraseña incorrectos.",
      });
    }

    const session = createSession(
      usuarioEncontrado.id
    );

    res.cookie(
      "agroxpert_session",
      session.token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge:
          8 * 60 * 60 * 1000,
      }
    );

    return res.json({
      success: true,
      user: {
        id: usuarioEncontrado.id,
        usuario: usuarioEncontrado.usuario,
        nombre: usuarioEncontrado.nombre,
        cargo: usuarioEncontrado.cargo,
        rol: usuarioEncontrado.rol,
        zona: usuarioEncontrado.zona,
      },
    });

  } catch (error) {
    console.error(
      "Error en login:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error interno del servidor.",
    });
  }
});

router.get(
  "/me",
  authMiddleware,
  (req, res) => {
    return res.json({
      success: true,
      authenticated: true,
      user: req.user,
    });
  }
);

router.post(
  "/logout",
  (req, res) => {
    try {
      const token =
        req.cookies?.agroxpert_session;

      deleteSession(token);

      res.clearCookie(
        "agroxpert_session",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
        }
      );

      return res.json({
        success: true,
        message: "Sesión cerrada correctamente.",
      });

    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error cerrando la sesión.",
      });
    }
  }
);

export default router;