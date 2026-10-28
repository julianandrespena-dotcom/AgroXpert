
import express from "express";
import bcrypt from "bcryptjs";
import sql from "mssql";

import { getFabricPool } from "../database/fabric.js";
import {
  createSession,
  deleteSession,
} from "../services/sessionService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Cuentas temporales para probar los dashboards sin modificar Fabric.
const usuariosPrueba = {
  test_supervisor_1: {
    password: "TestSup2026!",
    id: 900001,
    nombre: "Supervisor de prueba 1",
    cargo: "Supervisor",
    rol: "supervisor",
    zonasPermitidas: [1, 2],
    acceso_global: false,
  },
  test_supervisor_2: {
    password: "TestSup2026!",
    id: 900002,
    nombre: "Supervisor de prueba 2",
    cargo: "Supervisor",
    rol: "supervisor",
    zonasPermitidas: [3, 4],
    acceso_global: false,
  },
  test_director_1: {
    password: "TestDir2026!",
    id: 900003,
    nombre: "Director de prueba",
    cargo: "Director",
    rol: "director",
    zonasPermitidas: [5, 6, 7],
    acceso_global: false,
  },
  test_gerente: {
    password: "TestGer2026!",
    id: 900004,
    nombre: "Gerente de prueba",
    cargo: "Gerente",
    rol: "gerente",
    zonasPermitidas: [],
    acceso_global: true,
  },
};

router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body ?? {};

    if (
      typeof usuario !== "string" ||
      typeof password !== "string" ||
      !usuario.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son obligatorios.",
      });
    }

    const usuarioNormalizado = usuario.trim().toLowerCase();

    // Cuentas temporales: no se guardan en Fabric.
    if (
      process.env.ENABLE_TEST_USERS === "true" &&
      Object.hasOwn(usuariosPrueba, usuarioNormalizado)
    ) {
      const cuenta = usuariosPrueba[usuarioNormalizado];

      if (password !== cuenta.password) {
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos.",
        });
      }

      const user = {
        id: cuenta.id,
        usuario: usuarioNormalizado,
        nombre: cuenta.nombre,
        cargo: cuenta.cargo,
        rol: cuenta.rol,
        zona: null,
        activo: true,
        acceso_global: cuenta.acceso_global,
        tipo_autenticacion: "TEST",
        esUsuarioPrueba: true,
        zonasPermitidas: cuenta.zonasPermitidas,
      };

      const session = createSession(user);

      res.cookie("agroxpert_session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user,
      });
    }

    // Administrador temporal definido en .env.
    const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (adminUsername && usuarioNormalizado === adminUsername) {
      if (!adminPasswordHash) {
        console.error("Falta configurar ADMIN_PASSWORD_HASH en .env.");

        return res.status(500).json({
          success: false,
          message: "La autenticación del administrador no está configurada.",
        });
      }

      const passwordCorrecta = await bcrypt.compare(
        password,
        adminPasswordHash
      );

      if (!passwordCorrecta) {
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos.",
        });
      }

      const admin = {
        id: "admin-env",
        usuario: adminUsername,
        nombre: "Administrador",
        cargo: "Administrador",
        rol: "administrador",
        zona: null,
        activo: true,
      };

      const session = createSession(admin);

      res.cookie("agroxpert_session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: admin,
      });
    }

    // Usuarios locales registrados en Microsoft Fabric.
    const pool = await getFabricPool();

    const result = await pool
      .request()
      .input("usuario", sql.NVarChar(256), usuarioNormalizado)
      .query(`
        SELECT
          u.id,
          u.username AS usuario,
          u.password_hash,
          u.nombre,
          u.cargo,
          u.activo,
          u.tipo_autenticacion,
          u.acceso_global,
          LOWER(r.nombre) AS rol
        FROM dbo.Usuarios AS u
        INNER JOIN dbo.Roles AS r
          ON r.id = u.rol_id
        WHERE LOWER(LTRIM(RTRIM(u.username))) = @usuario
          AND u.tipo_autenticacion = 'LOCAL'
      `);

    const encontrado = result.recordset[0];

    if (!encontrado) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos.",
      });
    }

    if (!encontrado.activo) {
      return res.status(403).json({
        success: false,
        message: "Este usuario se encuentra desactivado.",
      });
    }

    if (!encontrado.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const passwordCorrecta = await bcrypt.compare(
      password,
      encontrado.password_hash
    );

    if (!passwordCorrecta) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const user = {
      id: encontrado.id,
      usuario: encontrado.usuario,
      nombre: encontrado.nombre,
      cargo: encontrado.cargo,
      rol: encontrado.rol,
      zona: null,
      activo: Boolean(encontrado.activo),
      acceso_global: Boolean(encontrado.acceso_global),
      tipo_autenticacion: encontrado.tipo_autenticacion,
    };

    const session = createSession(user);

    res.cookie("agroxpert_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    success: true,
    authenticated: true,
    user: req.user,
  });
});

router.post("/logout", (req, res) => {
  try {
    const token = req.cookies?.agroxpert_session;

    deleteSession(token);

    res.clearCookie("agroxpert_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({
      success: true,
      message: "Sesión cerrada correctamente.",
    });
  } catch (error) {
    console.error("Error cerrando la sesión:", error);

    return res.status(500).json({
      success: false,
      message: "Error cerrando la sesión.",
    });
  }
});

export default router;
