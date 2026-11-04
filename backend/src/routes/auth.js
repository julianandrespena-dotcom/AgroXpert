
import express from "express";
import bcrypt from "bcryptjs";
import sql from "mssql";

import { getFabricPool } from "../database/fabric.js";
import { createSession, deleteSession, getSessionUser} from "../services/sessionService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

import { registrarEvento } from "../services/bitacoraService.js";
import { createRemoteJWKSet, jwtVerify} from "jose";

const router = express.Router();

const MAX_INTENTOS = 3;
const DURACION_BLOQUEO_MINUTOS = 5;

async function registrarAuditoria(req, datos) {
  try {
    await registrarEvento({
      ...datos,
      ip: req.ip,
      metodo: req.method,
      ruta: req.originalUrl,
      modulo: "AUTENTICACION",
    });
  } catch (error) {
    console.error("Error registrando evento en bitácora:", error);
  }
}

// =========================================================
// VALIDACIÓN DEL TOKEN DE MICROSOFT ENTRA ID
// =========================================================

async function validarTokenMicrosoft(idToken) {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;

  if (!tenantId || !clientId) {
    throw new Error(
      "Falta configurar ENTRA_TENANT_ID o ENTRA_CLIENT_ID."
    );
  }

  if (typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("TOKEN_INVALIDO");
  }

  const jwks = createRemoteJWKSet(
    new URL(
      `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
    )
  );

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    audience: clientId,
    algorithms: ["RS256"],
  });

  if (
    typeof payload.tid !== "string" ||
    payload.tid.toLowerCase() !== tenantId.toLowerCase()
  ) {
    throw new Error("TENANT_INVALIDO");
  }

  const correoMicrosoft =
    payload.email ||
    payload.preferred_username ||
    payload.upn;

  if (
    typeof correoMicrosoft !== "string" ||
    !correoMicrosoft.trim()
  ) {
    throw new Error("CORREO_NO_DISPONIBLE");
  }

  const correo = correoMicrosoft.trim().toLowerCase();

  return correo;
}

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

    // Validar los campos obligatorios.
    if (
      typeof usuario !== "string" ||
      typeof password !== "string" ||
      !usuario.trim() ||
      !password
    ) {
      await registrarAuditoria(req, {
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        actorUsuario:
          typeof usuario === "string"
            ? usuario.trim().slice(0, 256)
            : null,
        resultado: "FALLIDO",
        motivo: "CAMPOS_OBLIGATORIOS",
      });

      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son obligatorios.",
      });
    }

    const usuarioNormalizado = usuario.trim().toLowerCase();

    // =========================================================
    // CUENTAS TEMPORALES DE PRUEBA
    // =========================================================

    if (
      process.env.ENABLE_TEST_USERS === "true" &&
      Object.hasOwn(usuariosPrueba, usuarioNormalizado)
    ) {
      const cuenta = usuariosPrueba[usuarioNormalizado];

      if (password !== cuenta.password) {
        await registrarAuditoria(req, {
          categoria: "AUTENTICACION",
          evento: "LOGIN_FAILED",
          actorUsuario: usuarioNormalizado,
          resultado: "FALLIDO",
          motivo: "CREDENCIALES_INCORRECTAS",
        });

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

      await registrarAuditoria(req, {
        actorUsuarioId: String(user.id),
        actorUsuario: user.usuario,
        categoria: "AUTENTICACION",
        evento: "LOGIN_SUCCESS",
        resultado: "EXITOSO",
        descripcion: "Inicio de sesión exitoso.",
      });

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

    // =========================================================
    // ADMINISTRADOR TEMPORAL DEFINIDO EN .ENV
    // =========================================================

    const adminUsername = process.env.ADMIN_USERNAME
      ?.trim()
      .toLowerCase();

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (adminUsername && usuarioNormalizado === adminUsername) {
      if (!adminPasswordHash) {
        console.error(
          "Falta configurar ADMIN_PASSWORD_HASH en .env."
        );

        await registrarAuditoria(req, {
          categoria: "AUTENTICACION",
          evento: "LOGIN_FAILED",
          actorUsuario: usuarioNormalizado,
          resultado: "FALLIDO",
          motivo: "ADMIN_PASSWORD_NO_CONFIGURADO",
        });

        return res.status(500).json({
          success: false,
          message:
            "La autenticación del administrador no está configurada.",
        });
      }

      const passwordCorrecta = await bcrypt.compare(
        password,
        adminPasswordHash
      );

      if (!passwordCorrecta) {
        await registrarAuditoria(req, {
          categoria: "AUTENTICACION",
          evento: "LOGIN_FAILED",
          actorUsuario: usuarioNormalizado,
          resultado: "FALLIDO",
          motivo: "CREDENCIALES_INCORRECTAS",
        });

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

      await registrarAuditoria(req, {
        actorUsuarioId: String(admin.id),
        actorUsuario: admin.usuario,
        categoria: "AUTENTICACION",
        evento: "LOGIN_SUCCESS",
        resultado: "EXITOSO",
        descripcion: "Inicio de sesión exitoso.",
      });

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

    // =========================================================
    // USUARIOS LOCALES REGISTRADOS EN MICROSOFT FABRIC
    // =========================================================

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
          u.intentos_fallidos,
          u.bloqueado_hasta_utc,
          u.tipo_autenticacion,
          u.acceso_global,
          LOWER(r.nombre) AS rol,
          CASE
            WHEN u.bloqueado_hasta_utc > SYSUTCDATETIME()
            THEN DATEDIFF(
              SECOND,
              SYSUTCDATETIME(),
              u.bloqueado_hasta_utc
            )
            ELSE 0
          END AS segundos_bloqueo
        FROM dbo.Usuarios AS u
        INNER JOIN dbo.Roles AS r
          ON r.id = u.rol_id
        WHERE LOWER(LTRIM(RTRIM(u.username))) = @usuario
          AND u.tipo_autenticacion = 'LOCAL'
      `);

    const encontrado = result.recordset[0];

    // Usuario no encontrado.
    if (!encontrado) {
      await registrarAuditoria(req, {
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        actorUsuario: usuarioNormalizado,
        resultado: "FALLIDO",
        motivo: "CREDENCIALES_INCORRECTAS",
      });

      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos.",
      });
    }

    // Verificar si el usuario está desactivado administrativamente.
    if (!encontrado.activo) {
      await registrarAuditoria(req, {
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        actorUsuarioId: String(encontrado.id),
        actorUsuario: encontrado.usuario,
        resultado: "FALLIDO",
        motivo: "USUARIO_INACTIVO",
      });

      return res.status(403).json({
        success: false,
        message: "Este usuario se encuentra desactivado.",
      });
    }

    // Verificar si la cuenta tiene un bloqueo temporal vigente.
    if (Number(encontrado.segundos_bloqueo) > 0) {
      const segundosRestantes = Number(
        encontrado.segundos_bloqueo
      );

      await registrarAuditoria(req, {
        actorUsuarioId: String(encontrado.id),
        actorUsuario: encontrado.usuario,
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        resultado: "FALLIDO",
        motivo: "BLOQUEO_TEMPORAL",
      });

      return res.status(423).json({
        success: false,
        message: `Tu cuenta está bloqueada temporalmente. Intenta nuevamente en ${Math.ceil(
          segundosRestantes / 60
        )} minuto(s).`,
        segundosRestantes,
      });
    }

    // Verificar que el usuario tenga una contraseña configurada.
    if (!encontrado.password_hash) {
      await registrarAuditoria(req, {
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        actorUsuarioId: String(encontrado.id),
        actorUsuario: encontrado.usuario,
        resultado: "FALLIDO",
        motivo: "SIN_PASSWORD_CONFIGURADO",
      });

      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos.",
      });
    }

    // Validar la contraseña.
    const passwordCorrecta = await bcrypt.compare(
      password,
      encontrado.password_hash
    );

    // =========================================================
    // CONTRASEÑA INCORRECTA: INCREMENTAR INTENTOS
    // =========================================================

    if (!passwordCorrecta) {
      const intentoResult = await pool
        .request()
        .input("id", sql.Int, encontrado.id)
        .query(`
          UPDATE dbo.Usuarios
          SET
            intentos_fallidos = CASE
              WHEN bloqueado_hasta_utc IS NOT NULL
                AND bloqueado_hasta_utc <= SYSUTCDATETIME()
              THEN 1
              ELSE ISNULL(intentos_fallidos, 0) + 1
            END,

            bloqueado_hasta_utc = CASE
              WHEN (
                CASE
                  WHEN bloqueado_hasta_utc IS NOT NULL
                    AND bloqueado_hasta_utc <= SYSUTCDATETIME()
                  THEN 1
                  ELSE ISNULL(intentos_fallidos, 0) + 1
                END
              ) >= ${MAX_INTENTOS}
              THEN DATEADD(
                MINUTE,
                ${DURACION_BLOQUEO_MINUTOS},
                SYSUTCDATETIME()
              )
              ELSE NULL
            END

          WHERE id = @id
            AND activo = 1
            AND (
              bloqueado_hasta_utc IS NULL
              OR bloqueado_hasta_utc <= SYSUTCDATETIME()
            );

          SELECT
            intentos_fallidos,
            bloqueado_hasta_utc,
            CASE
              WHEN bloqueado_hasta_utc > SYSUTCDATETIME()
              THEN DATEDIFF(
                SECOND,
                SYSUTCDATETIME(),
                bloqueado_hasta_utc
              )
              ELSE 0
            END AS segundos_bloqueo
          FROM dbo.Usuarios
          WHERE id = @id;
        `);

      const intento = intentoResult.recordset[0];

      // Comprobar si otra solicitud bloqueó o desactivó la cuenta.
      if (
        !intento ||
        Number(intento.segundos_bloqueo) > 0
      ) {
        const segundosRestantes = intento
          ? Math.max(1, Number(intento.segundos_bloqueo))
          : 0;

        await registrarAuditoria(req, {
          actorUsuarioId: String(encontrado.id),
          actorUsuario: encontrado.usuario,
          categoria: "AUTENTICACION",
          evento: "LOGIN_FAILED",
          resultado: "FALLIDO",
          motivo: "BLOQUEO_TEMPORAL",
        });

        return res.status(423).json({
          success: false,
          message:
            "Tu cuenta está bloqueada temporalmente. Intenta nuevamente en 5 minutos.",
          segundosRestantes: segundosRestantes || 300,
        });
      }

      const intentosFallidos = Number(
        intento.intentos_fallidos
      );

      const cuentaBloqueada =
        intentosFallidos >= MAX_INTENTOS;

      // Registrar el intento fallido.
      await registrarAuditoria(req, {
        actorUsuarioId: String(encontrado.id),
        actorUsuario: encontrado.usuario,
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        resultado: "FALLIDO",
        motivo: "CREDENCIALES_INCORRECTAS",
        descripcion: `Intento fallido ${intentosFallidos} de ${MAX_INTENTOS}.`,
        datosNuevos: {
          intentosFallidos,
          cuentaBloqueada,
        },
      });

      // Registrar el bloqueo temporal al alcanzar el límite.
      if (cuentaBloqueada) {
        await registrarAuditoria(req, {
          actorUsuarioId: String(encontrado.id),
          actorUsuario: encontrado.usuario,
          categoria: "AUTENTICACION",
          evento: "ACCOUNT_TEMPORARILY_LOCKED",
          resultado: "EXITOSO",
          motivo: "TRES_INTENTOS_FALLIDOS",
          descripcion:
            "Cuenta bloqueada temporalmente durante 5 minutos.",
          datosNuevos: {
            intentosFallidos,
            duracionMinutos: DURACION_BLOQUEO_MINUTOS,
            bloqueadoHastaUtc: intento.bloqueado_hasta_utc,
          },
        });

        return res.status(423).json({
          success: false,
          message:
            "Has superado los 3 intentos permitidos. Tu cuenta estará bloqueada durante 5 minutos.",
          intentosRestantes: 0,
          segundosRestantes: Number(
            intento.segundos_bloqueo
          ) || DURACION_BLOQUEO_MINUTOS * 60,
        });
      }

      const intentosRestantes =
        MAX_INTENTOS - intentosFallidos;

      return res.status(401).json({
        success: false,
        message: `Usuario o contraseña incorrectos. Te quedan ${intentosRestantes} intento(s).`,
        intentosRestantes,
      });
    }

    // =========================================================
    // CONTRASEÑA CORRECTA: REINICIAR CONTADOR
    // =========================================================

    const reinicioResult = await pool
      .request()
      .input("id", sql.Int, encontrado.id)
      .query(`
        UPDATE dbo.Usuarios
        SET
          intentos_fallidos = 0,
          bloqueado_hasta_utc = NULL
        WHERE id = @id
          AND activo = 1
          AND (
            bloqueado_hasta_utc IS NULL
            OR bloqueado_hasta_utc <= SYSUTCDATETIME()
          );
      `);

    // Evitar crear una sesión si otra solicitud bloqueó la cuenta
    // mientras se estaba validando la contraseña.
    if (reinicioResult.rowsAffected[0] === 0) {
      const estadoResult = await pool
        .request()
        .input("id", sql.Int, encontrado.id)
        .query(`
          SELECT
            activo,
            CASE
              WHEN bloqueado_hasta_utc > SYSUTCDATETIME()
              THEN DATEDIFF(
                SECOND,
                SYSUTCDATETIME(),
                bloqueado_hasta_utc
              )
              ELSE 0
            END AS segundos_bloqueo
          FROM dbo.Usuarios
          WHERE id = @id;
        `);

      const estado = estadoResult.recordset[0];

      if (!estado || !estado.activo) {
        return res.status(403).json({
          success: false,
          message: "Este usuario se encuentra desactivado.",
        });
      }

      const segundosRestantes = Number(
        estado.segundos_bloqueo
      ) || 300;

      return res.status(423).json({
        success: false,
        message:
          "Tu cuenta está bloqueada temporalmente. Intenta nuevamente cuando finalice el bloqueo.",
        segundosRestantes,
      });
    }

    // =========================================================
    // CREAR SESIÓN
    // =========================================================

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

    await registrarAuditoria(req, {
      actorUsuarioId: String(user.id),
      actorUsuario: user.usuario,
      categoria: "AUTENTICACION",
      evento: "LOGIN_SUCCESS",
      resultado: "EXITOSO",
      descripcion: "Inicio de sesión exitoso.",
    });

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

// =========================================================
// INICIO DE SESIÓN CON MICROSOFT ENTRA ID
// =========================================================

router.post("/entra", async (req, res) => {
  try {
    const { idToken } = req.body ?? {};

    let correo;

    // Validar el token recibido desde Microsoft.
    try {
      correo = await validarTokenMicrosoft(idToken);
    } catch (error) {
      console.error(
        "Error validando token de Microsoft:",
        error.message
      );

      await registrarAuditoria(req, {
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        resultado: "FALLIDO",
        motivo: "TOKEN_MICROSOFT_INVALIDO",
      });

      return res.status(401).json({
        success: false,
        message:
          "No fue posible validar tu identidad con Microsoft.",
      });
    }

    // Buscar el correo en Fabric.
    const pool = await getFabricPool();

    const result = await pool
      .request()
      .input("correo", sql.NVarChar(256), correo)
      .query(`
        SELECT
          u.id,
          u.nombre,
          u.cargo,
          u.correo,
          u.activo,
          u.acceso_global,
          u.tipo_autenticacion,
          u.rol_id,
          LOWER(r.nombre) AS rol
        FROM dbo.Usuarios AS u
        INNER JOIN dbo.Roles AS r
          ON r.id = u.rol_id
        WHERE LOWER(LTRIM(RTRIM(u.correo))) = @correo
          AND u.tipo_autenticacion = 'ENTRA'
          AND u.rol_id IN (1, 2, 3);
      `);

    const encontrado = result.recordset[0];

    // El correo no está registrado como usuario corporativo.
    if (!encontrado) {
      await registrarAuditoria(req, {
        actorUsuario: correo,
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        resultado: "FALLIDO",
        motivo: "USUARIO_ENTRA_NO_REGISTRADO",
      });

      return res.status(403).json({
        success: false,
        message:
          "Tu cuenta corporativa no está registrada o no tiene autorización para ingresar a AgroXpert.",
      });
    }

    // Comprobar que el usuario esté activo.
    if (!encontrado.activo) {
      await registrarAuditoria(req, {
        actorUsuarioId: String(encontrado.id),
        actorUsuario: correo,
        categoria: "AUTENTICACION",
        evento: "LOGIN_FAILED",
        resultado: "FALLIDO",
        motivo: "USUARIO_INACTIVO",
      });

      return res.status(403).json({
        success: false,
        message:
          "Tu cuenta de AgroXpert se encuentra desactivada.",
      });
    }

    // Construir el usuario de AgroXpert.
    const user = {
      id: encontrado.id,
      usuario: correo,
      correo: encontrado.correo,
      nombre: encontrado.nombre,
      cargo: encontrado.cargo,
      rol: encontrado.rol,
      zona: null,
      activo: Boolean(encontrado.activo),
      acceso_global: Boolean(encontrado.acceso_global),
      tipo_autenticacion: "ENTRA",
    };

    // Crear la sesión interna de AgroXpert.
    const session = createSession(user);

    await registrarAuditoria(req, {
      actorUsuarioId: String(user.id),
      actorUsuario: correo,
      categoria: "AUTENTICACION",
      evento: "LOGIN_SUCCESS",
      resultado: "EXITOSO",
      descripcion:
        "Inicio de sesión corporativo mediante Microsoft Entra ID.",
    });

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
    console.error(
      "Error en autenticación corporativa:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error interno al procesar el inicio de sesión corporativo.",
    });
  }
});

// =========================================================
// CONSULTAR SESIÓN ACTUAL
// =========================================================

router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    success: true,
    authenticated: true,
    user: req.user,
  });
});

// =========================================================
// CERRAR SESIÓN
// =========================================================

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.agroxpert_session;
    const usuarioSesion = token
      ? getSessionUser(token)
      : null;

    if (usuarioSesion) {
      await registrarAuditoria(req, {
        actorUsuarioId: String(usuarioSesion.id),
        actorUsuario: usuarioSesion.usuario,
        categoria: "AUTENTICACION",
        evento: "LOGOUT",
        resultado: "EXITOSO",
        descripcion: "Cierre de sesión.",
      });
    }

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
