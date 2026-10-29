import bcrypt from "bcryptjs";
import sql from "mssql";
import { getFabricPool } from "../database/fabric.js";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const ROLES_VALIDOS = [
  "gerente",
  "director",
  "supervisor",
  "mayordomo",
];

const ROL_ADMINISTRADOR = "administrador";

function normalizarIds(values = []) {
  if (!Array.isArray(values)) return [];

  return [
    ...new Set(
      values
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
}

function normalizarTexto(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizarRol(value) {
  return normalizarTexto(value).toLowerCase();
}

function esAdministradorProtegido(usuario) {
  return (
    usuario &&
    (
      normalizarRol(usuario.rol) === ROL_ADMINISTRADOR ||
      normalizarTexto(usuario.username).toLowerCase() === ROL_ADMINISTRADOR
    )
  );
}

function validarId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function responderError(res, error, mensaje) {
  console.error(mensaje, error);

  return res.status(500).json({
    mensaje,
  });
}

async function obtenerPool() {
  return getFabricPool();
}

/* =========================================================
   USUARIO Y ROL
========================================================= */

async function obtenerUsuarioPorId(id, transaction = null) {
  const pool = transaction || await obtenerPool();
  const request = pool.request();

  request.input("id", sql.Int, Number(id));

  const result = await request.query(`
    SELECT
      u.id,
      u.username AS usuario,
      u.username,
      u.nombre,
      u.cargo,
      u.correo,
      u.celular,
      LOWER(r.nombre) AS rol,
      u.rol_id,
      u.tipo_autenticacion,
      u.activo,
      u.acceso_global,
      u.debe_cambiar_password,
      u.fecha_creacion AS created_at
    FROM dbo.Usuarios u
    INNER JOIN dbo.Roles r
      ON r.id = u.rol_id
    WHERE u.id = @id
  `);

  return result.recordset[0] || null;
}

async function obtenerRolId(rol, transaction = null) {
  const pool = transaction || await obtenerPool();
  const request = pool.request();

  request.input("nombre", sql.NVarChar, normalizarRol(rol));

  const result = await request.query(`
    SELECT TOP 1 id, nombre
    FROM dbo.Roles
    WHERE LOWER(nombre) = @nombre
  `);

  return result.recordset[0] || null;
}

/* =========================================================
   CONSULTAS CON LISTAS DE IDS
========================================================= */

function agregarIds(request, prefijo, ids) {
  return ids.map((id, index) => {
    const nombre = `${prefijo}${index}`;
    request.input(nombre, sql.Int, id);
    return `@${nombre}`;
  });
}

/* =========================================================
   VALIDAR ZONAS
========================================================= */

async function validarZonas(zonaIds, rol, transaction = null) {
  const ids = normalizarIds(zonaIds);

  if (!ids.length) return [];

  const pool = transaction || await obtenerPool();
  const request = pool.request();
  const params = agregarIds(request, "zona", ids);

  const result = await request.query(`
    SELECT id, nombre
    FROM dbo.Zonas
    WHERE activa = 1
      AND id IN (${params.join(",")})
  `);

  if (result.recordset.length !== ids.length) {
    throw new Error(
      "Una o más zonas seleccionadas no existen o están inactivas."
    );
  }

  if (
    normalizarRol(rol) !== "gerente" &&
    result.recordset.some(
      (zona) => zona.nombre.trim().toLowerCase() === "ingenio completo"
    )
  ) {
    throw new Error(
      "La zona Ingenio Completo solamente puede asignarse al gerente."
    );
  }

  return result.recordset.map((row) => row.id);
}

/* =========================================================
   VALIDAR HACIENDAS
========================================================= */

async function validarHaciendas(haciendaIds, transaction = null) {
  const ids = normalizarIds(haciendaIds);

  if (!ids.length) return [];

  const pool = transaction || await obtenerPool();
  const request = pool.request();
  const params = agregarIds(request, "hacienda", ids);

  const result = await request.query(`
    SELECT id, zona_id
    FROM dbo.Haciendas
    WHERE activa = 1
      AND id IN (${params.join(",")})
  `);

  if (result.recordset.length !== ids.length) {
    throw new Error(
      "Una o más haciendas seleccionadas no existen o están inactivas."
    );
  }

  return result.recordset;
}

/* =========================================================
   VALIDAR SUERTES
========================================================= */

async function validarSuertes(suerteIds, transaction = null) {
  const ids = normalizarIds(suerteIds);

  if (!ids.length) return [];

  const pool = transaction || await obtenerPool();
  const request = pool.request();
  const params = agregarIds(request, "suerte", ids);

  const result = await request.query(`
    SELECT id, hacienda_id
    FROM dbo.Suertes
    WHERE activa = 1
      AND id IN (${params.join(",")})
  `);

  if (result.recordset.length !== ids.length) {
    throw new Error(
      "Una o más suertes seleccionadas no existen o están inactivas."
    );
  }

  return result.recordset;
}

/* =========================================================
   VALIDAR RELACIONES DE ACCESO
========================================================= */

function validarHaciendasEnZonas(haciendas, zonaIds) {
  const zonas = new Set(normalizarIds(zonaIds));

  for (const hacienda of haciendas) {
    if (!zonas.has(hacienda.zona_id)) {
      throw new Error(
        "Una de las haciendas seleccionadas no pertenece a las zonas seleccionadas."
      );
    }
  }
}

function validarSuertesEnHaciendas(suertes, haciendaIds) {
  const haciendas = new Set(normalizarIds(haciendaIds));

  for (const suerte of suertes) {
    if (!haciendas.has(suerte.hacienda_id)) {
      throw new Error(
        "Una de las suertes seleccionadas no pertenece a las haciendas seleccionadas."
      );
    }
  }
}

async function prepararAccesosPorRol({
  rol,
  zonaIds = [],
  haciendaIds = [],
  suerteIds = [],
}, transaction = null) {
  const zonas = normalizarIds(zonaIds);
  const haciendas = normalizarIds(haciendaIds);
  const suertes = normalizarIds(suerteIds);
  const rolNormalizado = normalizarRol(rol);

  if (!ROLES_VALIDOS.includes(rolNormalizado)) {
    throw new Error("Rol inválido.");
  }

  if (rolNormalizado === "gerente") {
    return {
      zonaIds: [],
      haciendaIds: [],
      suerteIds: [],
      accesoGlobal: true,
    };
  }

  if (
    rolNormalizado === "director" ||
    rolNormalizado === "supervisor"
  ) {
    if (!zonas.length) {
      throw new Error("Debe seleccionar al menos una zona.");
    }

    await validarZonas(zonas, rolNormalizado, transaction);

    return {
      zonaIds: zonas,
      haciendaIds: [],
      suerteIds: [],
      accesoGlobal: false,
    };
  }

  if (rolNormalizado === "mayordomo") {
    if (!zonas.length || !haciendas.length || !suertes.length) {
      throw new Error(
        "El mayordomo debe tener al menos una zona, una hacienda y una suerte."
      );
    }

    await validarZonas(zonas, rolNormalizado, transaction);

    const haciendasValidas = await validarHaciendas(
      haciendas,
      transaction
    );

    const suertesValidas = await validarSuertes(
      suertes,
      transaction
    );

    validarHaciendasEnZonas(haciendasValidas, zonas);
    validarSuertesEnHaciendas(suertesValidas, haciendas);

    return {
      zonaIds: zonas,
      haciendaIds: haciendas,
      suerteIds: suertes,
      accesoGlobal: false,
    };
  }

  throw new Error("No fue posible preparar los accesos.");
}

/* =========================================================
   OBTENER ACCESOS DE UN USUARIO
========================================================= */

async function obtenerAccesosUsuario(usuarioId, transaction = null) {
  const pool = transaction || await obtenerPool();

  const zonasRequest = pool.request();
  zonasRequest.input("usuarioId", sql.Int, Number(usuarioId));

  const zonasResult = await zonasRequest.query(`
    SELECT z.id, z.nombre
    FROM dbo.Usuario_Zona uz
    INNER JOIN dbo.Zonas z ON z.id = uz.zona_id
    WHERE uz.usuario_id = @usuarioId
      AND z.activa = 1
    ORDER BY z.nombre
  `);

  const haciendasRequest = pool.request();
  haciendasRequest.input("usuarioId", sql.Int, Number(usuarioId));

  const haciendasResult = await haciendasRequest.query(`
    SELECT
      h.id,
      h.codigo_hacienda AS codigo,
      h.nombre,
      h.zona_id,
      z.nombre AS zona
    FROM dbo.Usuario_Hacienda uh
    INNER JOIN dbo.Haciendas h ON h.id = uh.hacienda_id
    LEFT JOIN dbo.Zonas z ON z.id = h.zona_id
    WHERE uh.usuario_id = @usuarioId
      AND h.activa = 1
    ORDER BY z.nombre, h.nombre
  `);

  const suertesRequest = pool.request();
  suertesRequest.input("usuarioId", sql.Int, Number(usuarioId));

  const suertesResult = await suertesRequest.query(`
    SELECT
      s.id,
      s.codigo_sia AS codigo,
      s.nombre,
      s.hacienda_id,
      h.nombre AS hacienda,
      h.zona_id,
      z.nombre AS zona,
      s.tenencia
    FROM dbo.Usuario_Suerte us
    INNER JOIN dbo.Suertes s ON s.id = us.suerte_id
    INNER JOIN dbo.Haciendas h ON h.id = s.hacienda_id
    LEFT JOIN dbo.Zonas z ON z.id = h.zona_id
    WHERE us.usuario_id = @usuarioId
      AND s.activa = 1
    ORDER BY z.nombre, h.nombre, s.codigo_sia
  `);

  return {
    zonas: zonasResult.recordset,
    haciendas: haciendasResult.recordset,
    suertes: suertesResult.recordset,
  };
}

/* =========================================================
   ASIGNAR ACCESOS
========================================================= */

async function asignarAccesos(usuarioId, accesos, transaction) {
  for (const zonaId of accesos.zonaIds) {
    const request = new sql.Request(transaction);
    request.input("usuarioId", sql.Int, Number(usuarioId));
    request.input("zonaId", sql.Int, zonaId);

    await request.query(`
      IF NOT EXISTS (
        SELECT 1
        FROM dbo.Usuario_Zona
        WHERE usuario_id = @usuarioId
          AND zona_id = @zonaId
      )
      INSERT INTO dbo.Usuario_Zona (usuario_id, zona_id)
      VALUES (@usuarioId, @zonaId)
    `);
  }

  for (const haciendaId of accesos.haciendaIds) {
    const request = new sql.Request(transaction);
    request.input("usuarioId", sql.Int, Number(usuarioId));
    request.input("haciendaId", sql.Int, haciendaId);

    await request.query(`
      IF NOT EXISTS (
        SELECT 1
        FROM dbo.Usuario_Hacienda
        WHERE usuario_id = @usuarioId
          AND hacienda_id = @haciendaId
      )
      INSERT INTO dbo.Usuario_Hacienda (usuario_id, hacienda_id)
      VALUES (@usuarioId, @haciendaId)
    `);
  }

  for (const suerteId of accesos.suerteIds) {
    const request = new sql.Request(transaction);
    request.input("usuarioId", sql.Int, Number(usuarioId));
    request.input("suerteId", sql.Int, suerteId);

    await request.query(`
      IF NOT EXISTS (
        SELECT 1
        FROM dbo.Usuario_Suerte
        WHERE usuario_id = @usuarioId
          AND suerte_id = @suerteId
      )
      INSERT INTO dbo.Usuario_Suerte (usuario_id, suerte_id)
      VALUES (@usuarioId, @suerteId)
    `);
  }
}

async function reemplazarAccesos(usuarioId, accesos, transaction) {
  for (const tabla of [
    "Usuario_Zona",
    "Usuario_Hacienda",
    "Usuario_Suerte",
  ]) {
    const request = new sql.Request(transaction);
    request.input("usuarioId", sql.Int, Number(usuarioId));

    await request.query(`
      DELETE FROM dbo.${tabla}
      WHERE usuario_id = @usuarioId
    `);
  }

  await asignarAccesos(usuarioId, accesos, transaction);
}

/* =========================================================
   OBTENER USUARIOS
========================================================= */

export async function getUsers(req, res) {
  try {
    const pool = await obtenerPool();

    const result = await pool.request().query(`
      SELECT
        u.id,
        u.username AS usuario,
        u.username,
        u.nombre,
        u.cargo,
        u.correo,
        u.celular,
        LOWER(r.nombre) AS rol,
        u.rol_id,
        u.tipo_autenticacion,
        u.activo,
        u.acceso_global,
        u.debe_cambiar_password,
        u.fecha_creacion AS created_at
      FROM dbo.Usuarios u
      INNER JOIN dbo.Roles r ON r.id = u.rol_id
      ORDER BY u.nombre
    `);

    const users = await Promise.all(
      result.recordset.map(async (user) => ({
        ...user,
        ...(await obtenerAccesosUsuario(user.id)),
      }))
    );

    return res.json(users);
  } catch (error) {
    return responderError(res, error, "Error obteniendo usuarios.");
  }
}

/* =========================================================
   OBTENER USUARIO POR ID
========================================================= */

export async function getUserById(req, res) {
  try {
    const id = validarId(req.params.id);

    if (!id) {
      return res.status(400).json({ mensaje: "ID inválido." });
    }

    const user = await obtenerUsuarioPorId(id);

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    return res.json({
      ...user,
      ...(await obtenerAccesosUsuario(user.id)),
    });
  } catch (error) {
    return responderError(res, error, "Error obteniendo usuario.");
  }
}

/* =========================================================
   CREAR USUARIO
========================================================= */

export async function createUser(req, res) {
  let transaction;

  try {
    const pool = await obtenerPool();
    transaction = new sql.Transaction(pool);

    const {
      usuario,
      password,
      nombre,
      cargo,
      rol,
      correo,
      celular,
      zonaIds = [],
      haciendaIds = [],
      suerteIds = [],
    } = req.body;

    const usuarioNormalizado = normalizarTexto(usuario);
    const passwordNormalizada = normalizarTexto(password);
    const nombreNormalizado = normalizarTexto(nombre);
    const cargoNormalizado = normalizarTexto(cargo);
    const correoNormalizado = normalizarTexto(correo);
    const celularNormalizado = normalizarTexto(celular);
    const rolNormalizado = normalizarRol(rol);

    if (!nombreNormalizado || !cargoNormalizado || !rolNormalizado) {
      return res.status(400).json({
        mensaje: "Nombre, cargo y rol son obligatorios.",
      });
    }

    if (!ROLES_VALIDOS.includes(rolNormalizado)) {
      return res.status(400).json({ mensaje: "Rol inválido." });
    }

    if (rolNormalizado === ROL_ADMINISTRADOR) {
      return res.status(403).json({
        mensaje: "No se puede crear otra cuenta de administrador.",
      });
    }

    const esLocal = rolNormalizado === "mayordomo";

    if (esLocal && (!usuarioNormalizado || !passwordNormalizada)) {
      return res.status(400).json({
        mensaje: "El mayordomo requiere usuario y contraseña.",
      });
    }

    if (!esLocal && !correoNormalizado) {
      return res.status(400).json({
        mensaje: "Los usuarios con autenticación Microsoft requieren correo.",
      });
    }

    const rolFabric = await obtenerRolId(rolNormalizado);

    if (!rolFabric) {
      return res.status(400).json({
        mensaje: `El rol ${rolNormalizado} no existe en Fabric.`,
      });
    }

    const accesos = await prepararAccesosPorRol({
      rol: rolNormalizado,
      zonaIds,
      haciendaIds,
      suerteIds,
    });

    await transaction.begin();

    const duplicadoRequest = new sql.Request(transaction);
    duplicadoRequest.input(
      "username",
      sql.NVarChar,
      usuarioNormalizado || null
    );
    duplicadoRequest.input(
      "correo",
      sql.NVarChar,
      correoNormalizado || null
    );

    const duplicado = await duplicadoRequest.query(`
      SELECT TOP 1 id
      FROM dbo.Usuarios
      WHERE
        (@username IS NOT NULL AND username = @username)
        OR (@correo IS NOT NULL AND correo = @correo)
    `);

    if (duplicado.recordset.length) {
      await transaction.rollback();

      return res.status(409).json({
        mensaje: "El usuario o correo ya existe.",
      });
    }

    const passwordHash = esLocal
      ? await bcrypt.hash(passwordNormalizada, 10)
      : null;

    const insertarRequest = new sql.Request(transaction);
    insertarRequest.input("nombre", sql.NVarChar, nombreNormalizado);
    insertarRequest.input("cargo", sql.NVarChar, cargoNormalizado);
    insertarRequest.input(
      "correo",
      sql.NVarChar,
      correoNormalizado || null
    );
    insertarRequest.input(
      "celular",
      sql.NVarChar,
      celularNormalizado || null
    );
    insertarRequest.input("rolId", sql.Int, rolFabric.id);
    insertarRequest.input(
      "tipo",
      sql.NVarChar,
      esLocal ? "LOCAL" : "ENTRA"
    );
    insertarRequest.input(
      "username",
      sql.NVarChar,
      usuarioNormalizado || null
    );
    insertarRequest.input("passwordHash", sql.NVarChar, passwordHash);
    insertarRequest.input(
      "accesoGlobal",
      sql.Bit,
      accesos.accesoGlobal
    );

    // Fabric no admite OUTPUT INSERTED.id en esta operación.
    await insertarRequest.query(`
      INSERT INTO dbo.Usuarios (
        nombre,
        cargo,
        correo,
        celular,
        rol_id,
        tipo_autenticacion,
        username,
        password_hash,
        activo,
        acceso_global,
        debe_cambiar_password,
        fecha_creacion,
        fecha_actualizacion
      )
      VALUES (
        @nombre,
        @cargo,
        @correo,
        @celular,
        @rolId,
        @tipo,
        @username,
        @passwordHash,
        1,
        @accesoGlobal,
        0,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
      )
    `);

    // Recuperar el ID con la clave de usuario o correo,
    // dentro de la misma transacción.
    const buscarUsuarioRequest = new sql.Request(transaction);
    buscarUsuarioRequest.input(
      "username",
      sql.NVarChar,
      usuarioNormalizado || null
    );
    buscarUsuarioRequest.input(
      "correo",
      sql.NVarChar,
      correoNormalizado || null
    );
    buscarUsuarioRequest.input("rolId", sql.Int, rolFabric.id);

    const usuarioInsertado = await buscarUsuarioRequest.query(`
      SELECT TOP 1 id
      FROM dbo.Usuarios
      WHERE rol_id = @rolId
        AND (
          (@username IS NOT NULL AND username = @username)
          OR (@correo IS NOT NULL AND correo = @correo)
        )
      ORDER BY id DESC
    `);

    if (!usuarioInsertado.recordset.length) {
      throw new Error(
        "El usuario se insertó, pero no fue posible recuperar su ID."
      );
    }

    const usuarioId = usuarioInsertado.recordset[0].id;

    await asignarAccesos(usuarioId, accesos, transaction);
    await transaction.commit();

    const nuevoUsuario = await obtenerUsuarioPorId(usuarioId);

    return res.status(201).json({
      ...nuevoUsuario,
      ...(await obtenerAccesosUsuario(usuarioId)),
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch {}
    }

    console.error("Error creando usuario:", error);

    return res.status(400).json({
      mensaje: error.message || "No fue posible crear el usuario.",
    });
  }
}

/* =========================================================
   ACTUALIZAR USUARIO
========================================================= */

export async function updateUser(req, res) {
  let transaction;

  try {
    const pool = await obtenerPool();
    transaction = new sql.Transaction(pool);

    const id = validarId(req.params.id);

    if (!id) {
      return res.status(400).json({ mensaje: "ID inválido." });
    }

    const actual = await obtenerUsuarioPorId(id);

    if (!actual) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (esAdministradorProtegido(actual)) {
      return res.status(403).json({
        mensaje: "La cuenta de administrador no puede editarse.",
      });
    }

    const {
      usuario,
      nombre,
      cargo,
      rol,
      correo,
      celular,
      zonaIds = [],
      haciendaIds = [],
      suerteIds = [],
    } = req.body;

    const rolNormalizado = normalizarRol(rol);
    const usuarioNormalizado = normalizarTexto(usuario);
    const nombreNormalizado = normalizarTexto(nombre);
    const cargoNormalizado = normalizarTexto(cargo);
    const correoNormalizado = normalizarTexto(correo);
    const celularNormalizado = normalizarTexto(celular);

    if (!nombreNormalizado || !cargoNormalizado || !rolNormalizado) {
      return res.status(400).json({
        mensaje: "Nombre, cargo y rol son obligatorios.",
      });
    }

    if (
      !ROLES_VALIDOS.includes(rolNormalizado) ||
      rolNormalizado === ROL_ADMINISTRADOR
    ) {
      return res.status(400).json({ mensaje: "Rol inválido." });
    }

    const esLocal = rolNormalizado === "mayordomo";

    if (esLocal && !usuarioNormalizado) {
      return res.status(400).json({
        mensaje: "El mayordomo requiere nombre de usuario.",
      });
    }

    if (!esLocal && !correoNormalizado) {
      return res.status(400).json({
        mensaje: "Los usuarios con autenticación Microsoft requieren correo.",
      });
    }

    const rolFabric = await obtenerRolId(rolNormalizado);

    if (!rolFabric) {
      return res.status(400).json({
        mensaje: `El rol ${rolNormalizado} no existe en Fabric.`,
      });
    }

    const accesos = await prepararAccesosPorRol({
      rol: rolNormalizado,
      zonaIds,
      haciendaIds,
      suerteIds,
    });

    await transaction.begin();

    const duplicadoRequest = new sql.Request(transaction);
    duplicadoRequest.input(
      "username",
      sql.NVarChar,
      usuarioNormalizado || null
    );
    duplicadoRequest.input(
      "correo",
      sql.NVarChar,
      correoNormalizado || null
    );
    duplicadoRequest.input("id", sql.Int, id);

    const duplicado = await duplicadoRequest.query(`
      SELECT TOP 1 id
      FROM dbo.Usuarios
      WHERE id <> @id
        AND (
          (@username IS NOT NULL AND username = @username)
          OR (@correo IS NOT NULL AND correo = @correo)
        )
    `);

    if (duplicado.recordset.length) {
      await transaction.rollback();

      return res.status(409).json({
        mensaje: "El usuario o correo ya está siendo utilizado.",
      });
    }

    const request = new sql.Request(transaction);
    request.input("id", sql.Int, id);
    request.input("username", sql.NVarChar, usuarioNormalizado || null);
    request.input("nombre", sql.NVarChar, nombreNormalizado);
    request.input("cargo", sql.NVarChar, cargoNormalizado);
    request.input("correo", sql.NVarChar, correoNormalizado || null);
    request.input("celular", sql.NVarChar, celularNormalizado || null);
    request.input("rolId", sql.Int, rolFabric.id);
    request.input("tipo", sql.NVarChar, esLocal ? "LOCAL" : "ENTRA");
    request.input("accesoGlobal", sql.Bit, accesos.accesoGlobal);

    await request.query(`
      UPDATE dbo.Usuarios
      SET
        username = @username,
        nombre = @nombre,
        cargo = @cargo,
        correo = @correo,
        celular = @celular,
        rol_id = @rolId,
        tipo_autenticacion = @tipo,
        password_hash = CASE
          WHEN @tipo = 'ENTRA' THEN NULL
          ELSE password_hash
        END,
        acceso_global = @accesoGlobal,
        fecha_actualizacion = SYSUTCDATETIME()
      WHERE id = @id
    `);

    await reemplazarAccesos(id, accesos, transaction);
    await transaction.commit();

    const actualizado = await obtenerUsuarioPorId(id);

    return res.json({
      ...actualizado,
      ...(await obtenerAccesosUsuario(id)),
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch {}
    }

    console.error("Error actualizando usuario:", error);

    return res.status(400).json({
      mensaje: error.message || "No fue posible actualizar el usuario.",
    });
  }
}

/* =========================================================
   CAMBIAR ESTADO
========================================================= */

export async function updateUserStatus(req, res) {
  try {
    const id = validarId(req.params.id);

    if (!id) {
      return res.status(400).json({ mensaje: "ID inválido." });
    }

    const usuario = await obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (esAdministradorProtegido(usuario)) {
      return res.status(403).json({
        mensaje: "La cuenta de administrador no puede desactivarse.",
      });
    }

    const activo = req.body.activo;

    if (typeof activo !== "boolean" && activo !== 0 && activo !== 1) {
      return res.status(400).json({
        mensaje: "El estado debe ser activo o inactivo.",
      });
    }

    const pool = await obtenerPool();
    const request = pool.request();

    request.input("id", sql.Int, id);
    request.input("activo", sql.Bit, Boolean(Number(activo)));

    await request.query(`
      UPDATE dbo.Usuarios
      SET
        activo = @activo,
        fecha_actualizacion = SYSUTCDATETIME()
      WHERE id = @id
    `);

    return res.json({
      mensaje: "Estado actualizado correctamente.",
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "No fue posible actualizar el estado."
    );
  }
}

/* =========================================================
   CAMBIAR CONTRASEÑA
========================================================= */

export async function updateUserPassword(req, res) {
  try {
    const id = validarId(req.params.id);

    if (!id) {
      return res.status(400).json({ mensaje: "ID inválido." });
    }

    const usuario = await obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (esAdministradorProtegido(usuario)) {
      return res.status(403).json({
        mensaje:
          "La contraseña del administrador no puede cambiarse desde Administración.",
      });
    }

    if (usuario.tipo_autenticacion !== "LOCAL") {
      return res.status(400).json({
        mensaje: "La contraseña solo se puede cambiar para usuarios locales.",
      });
    }

    const password = normalizarTexto(req.body.password);

    if (password.length < 6) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const pool = await obtenerPool();
    const request = pool.request();

    request.input("id", sql.Int, id);
    request.input("passwordHash", sql.NVarChar, passwordHash);

    await request.query(`
      UPDATE dbo.Usuarios
      SET
        password_hash = @passwordHash,
        debe_cambiar_password = 1,
        fecha_actualizacion = SYSUTCDATETIME()
      WHERE id = @id
    `);

    return res.json({
      mensaje: "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    return responderError(
      res,
      error,
      "No fue posible actualizar la contraseña."
    );
  }
}

/* =========================================================
   ELIMINAR USUARIO
========================================================= */

export async function deleteUser(req, res) {
  let transaction;

  try {
    const pool = await obtenerPool();
    transaction = new sql.Transaction(pool);

    const id = validarId(req.params.id);

    if (!id) {
      return res.status(400).json({ mensaje: "ID inválido." });
    }

    const usuario = await obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (esAdministradorProtegido(usuario)) {
      return res.status(403).json({
        mensaje: "La cuenta de administrador no puede eliminarse.",
      });
    }

    await transaction.begin();

    for (const tabla of [
      "Usuario_Zona",
      "Usuario_Hacienda",
      "Usuario_Suerte",
    ]) {
      const request = new sql.Request(transaction);
      request.input("usuarioId", sql.Int, id);

      await request.query(`
        DELETE FROM dbo.${tabla}
        WHERE usuario_id = @usuarioId
      `);
    }

    const eliminarRequest = new sql.Request(transaction);
    eliminarRequest.input("id", sql.Int, id);

    await eliminarRequest.query(`
      DELETE FROM dbo.Usuarios
      WHERE id = @id
    `);

    await transaction.commit();

    return res.json({
      mensaje: "Usuario eliminado correctamente.",
      usuario: {
        id: usuario.id,
        usuario: usuario.usuario,
        nombre: usuario.nombre,
      },
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch {}
    }

    console.error("Error eliminando usuario:", error);

    return res.status(500).json({
      mensaje: error.message || "No fue posible eliminar el usuario.",
    });
  }
}