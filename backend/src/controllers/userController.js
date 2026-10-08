import bcrypt from "bcryptjs";
import db from "../database/database.js";

/* =========================================================
   HELPERS
========================================================= */

const ROLES_VALIDOS = [
  "administrador",
  "gerente",
  "director",
  "supervisor",
  "mayordomo",
];

const ROL_ADMINISTRADOR = "administrador";

/*
 * El administrador es una cuenta predeterminada del sistema.
 *
 * Por seguridad:
 * - no puede editarse
 * - no puede cambiarse su contraseña desde Administración
 * - no puede desactivarse
 * - no puede eliminarse
 * - no se pueden crear nuevos usuarios con rol administrador
 *
 * La protección se hace por rol en backend para que no pueda
 * saltarse manipulando el frontend.
 */

function normalizarIds(values = []) {
  return [
    ...new Set(
      values
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    ),
  ];
}

/* =========================================================
   ADMINISTRADOR PROTEGIDO
========================================================= */

function obtenerUsuarioPorId(id) {
  return db
    .prepare(`
      SELECT
        id,
        usuario,
        nombre,
        cargo,
        rol,
        zona,
        activo,
        created_at
      FROM usuarios
      WHERE id = ?
    `)
    .get(id);
}

function esAdministradorProtegido(usuario) {
  return (
    usuario &&
    usuario.rol === ROL_ADMINISTRADOR
  );
}

/* =========================================================
   VALIDAR ZONAS
========================================================= */

function validarZonas(zonaIds, rol) {
  const ids = normalizarIds(zonaIds);

  if (!ids.length) {
    return [];
  }

  const placeholders =
    ids.map(() => "?").join(",");

  const rows = db
    .prepare(`
      SELECT
        id,
        nombre
      FROM zonas
      WHERE activo = 1
        AND id IN (${placeholders})
    `)
    .all(...ids);

  if (rows.length !== ids.length) {
    throw new Error(
      "Una o más zonas seleccionadas no existen."
    );
  }

  /*
   * Ingenio Completo representa el acceso global
   * al ingenio.
   *
   * Solamente el gerente puede tener este tipo
   * de acceso.
   *
   * Director, supervisor y mayordomo deben
   * trabajar únicamente con zonas reales.
   */
  if (rol !== "gerente") {
    const tieneIngenioCompleto =
      rows.some(
        (zona) =>
          zona.nombre ===
          "Ingenio Completo"
      );

    if (tieneIngenioCompleto) {
      throw new Error(
        "La zona Ingenio Completo solamente puede asignarse al gerente."
      );
    }
  }

  return rows.map(
    (row) => row.id
  );
}

/* =========================================================
   VALIDAR HACIENDAS
========================================================= */

function validarHaciendas(
  haciendaIds
) {
  const ids =
    normalizarIds(haciendaIds);

  if (!ids.length) {
    return [];
  }

  const placeholders =
    ids.map(() => "?").join(",");

  const rows = db
    .prepare(`
      SELECT
        id,
        zona_id
      FROM haciendas
      WHERE activo = 1
        AND id IN (${placeholders})
    `)
    .all(...ids);

  const validas =
    rows.map((row) => row.id);

  if (
    validas.length !==
    ids.length
  ) {
    throw new Error(
      "Una o más haciendas seleccionadas no existen."
    );
  }

  return rows;
}

/* =========================================================
   VALIDAR SUERTES
========================================================= */

function validarSuertes(
  suerteIds
) {
  const ids =
    normalizarIds(suerteIds);

  if (!ids.length) {
    return [];
  }

  const placeholders =
    ids.map(() => "?").join(",");

  const rows = db
    .prepare(`
      SELECT
        id,
        hacienda_id
      FROM suertes
      WHERE activo = 1
        AND id IN (${placeholders})
    `)
    .all(...ids);

  const validas =
    rows.map((row) => row.id);

  if (
    validas.length !==
    ids.length
  ) {
    throw new Error(
      "Una o más suertes seleccionadas no existen."
    );
  }

  return rows;
}

/* =========================================================
   VALIDAR HACIENDAS DENTRO DE ZONAS
========================================================= */

function validarHaciendasEnZonas(
  haciendas,
  zonaIds
) {
  const zonas = new Set(
    normalizarIds(zonaIds)
  );

  for (const hacienda of haciendas) {
    if (
      !zonas.has(
        hacienda.zona_id
      )
    ) {
      throw new Error(
        "Una de las haciendas seleccionadas no pertenece a las zonas seleccionadas."
      );
    }
  }
}

/* =========================================================
   VALIDAR SUERTES DENTRO DE HACIENDAS
========================================================= */

function validarSuertesEnHaciendas(
  suertes,
  haciendaIds
) {
  const haciendas = new Set(
    normalizarIds(haciendaIds)
  );

  for (const suerte of suertes) {
    if (
      !haciendas.has(
        suerte.hacienda_id
      )
    ) {
      throw new Error(
        "Una de las suertes seleccionadas no pertenece a las haciendas seleccionadas."
      );
    }
  }
}

/* =========================================================
   PREPARAR ACCESOS SEGÚN ROL
========================================================= */

function prepararAccesosPorRol({
  rol,
  zonaIds = [],
  haciendaIds = [],
  suerteIds = [],
}) {
  const zonas =
    normalizarIds(zonaIds);

  const haciendas =
    normalizarIds(haciendaIds);

  const suertes =
    normalizarIds(suerteIds);

  if (
    !ROLES_VALIDOS.includes(rol)
  ) {
    throw new Error(
      "Rol inválido."
    );
  }

  /* -------------------------------------------------------
     GERENTE / ADMINISTRADOR
  ------------------------------------------------------- */

  if (
    rol === "gerente" ||
    rol === "administrador"
  ) {
    return {
      zonaIds: [],
      haciendaIds: [],
      suerteIds: [],
    };
  }

  /* -------------------------------------------------------
     DIRECTOR / SUPERVISOR
  ------------------------------------------------------- */

  if (
    rol === "director" ||
    rol === "supervisor"
  ) {
    if (!zonas.length) {
      throw new Error(
        "Debe seleccionar al menos una zona."
      );
    }

    validarZonas(
      zonas,
      rol
    );

    return {
      zonaIds: zonas,
      haciendaIds: [],
      suerteIds: [],
    };
  }

  /* -------------------------------------------------------
     MAYORDOMO
  ------------------------------------------------------- */

  if (rol === "mayordomo") {
    if (!zonas.length) {
      throw new Error(
        "Debe seleccionar al menos una zona."
      );
    }

    if (!haciendas.length) {
      throw new Error(
        "Debe seleccionar al menos una hacienda."
      );
    }

    if (!suertes.length) {
      throw new Error(
        "Debe seleccionar al menos una suerte."
      );
    }

    validarZonas(
      zonas,
      rol
    );

    const haciendasValidas =
      validarHaciendas(
        haciendas
      );

    const suertesValidas =
      validarSuertes(
        suertes
      );

    validarHaciendasEnZonas(
      haciendasValidas,
      zonas
    );

    validarSuertesEnHaciendas(
      suertesValidas,
      haciendas
    );

    return {
      zonaIds: zonas,
      haciendaIds: haciendas,
      suerteIds: suertes,
    };
  }

  throw new Error(
    "No fue posible preparar los accesos."
  );
}

/* =========================================================
   OBTENER ACCESOS
========================================================= */

function obtenerAccesosUsuario(
  usuarioId
) {
  const zonas = db
    .prepare(`
      SELECT
        z.id,
        z.codigo,
        z.nombre
      FROM usuario_zonas uz
      INNER JOIN zonas z
        ON z.id = uz.zona_id
      WHERE uz.usuario_id = ?
        AND z.activo = 1
      ORDER BY
        CAST(z.codigo AS INTEGER),
        z.nombre
    `)
    .all(usuarioId);

  const haciendas = db
    .prepare(`
      SELECT
        h.id,
        h.codigo,
        h.nombre,
        h.zona_id,
        z.nombre AS zona
      FROM usuario_haciendas uh
      INNER JOIN haciendas h
        ON h.id = uh.hacienda_id
      LEFT JOIN zonas z
        ON z.id = h.zona_id
      WHERE uh.usuario_id = ?
        AND h.activo = 1
      ORDER BY
        z.nombre,
        h.nombre
    `)
    .all(usuarioId);

  const suertes = db
    .prepare(`
      SELECT
        s.id,
        s.codigo,
        s.hacienda_id,
        h.nombre AS hacienda,
        h.zona_id,
        z.nombre AS zona
      FROM usuario_suertes us
      INNER JOIN suertes s
        ON s.id = us.suerte_id
      INNER JOIN haciendas h
        ON h.id = s.hacienda_id
      LEFT JOIN zonas z
        ON z.id = h.zona_id
      WHERE us.usuario_id = ?
        AND s.activo = 1
      ORDER BY
        z.nombre,
        h.nombre,
        s.codigo
    `)
    .all(usuarioId);

  return {
    zonas,
    haciendas,
    suertes,
  };
}

/* =========================================================
   ASIGNAR ACCESOS
========================================================= */

function asignarAccesos(
  usuarioId,
  {
    zonaIds = [],
    haciendaIds = [],
    suerteIds = [],
  }
) {
  const insertarZona =
    db.prepare(`
      INSERT OR IGNORE INTO usuario_zonas
        (usuario_id, zona_id)
      VALUES (?, ?)
    `);

  const insertarHacienda =
    db.prepare(`
      INSERT OR IGNORE INTO usuario_haciendas
        (usuario_id, hacienda_id)
      VALUES (?, ?)
    `);

  const insertarSuerte =
    db.prepare(`
      INSERT OR IGNORE INTO usuario_suertes
        (usuario_id, suerte_id)
      VALUES (?, ?)
    `);

  for (const zonaId of zonaIds) {
    insertarZona.run(
      usuarioId,
      zonaId
    );
  }

  for (
    const haciendaId of haciendaIds
  ) {
    insertarHacienda.run(
      usuarioId,
      haciendaId
    );
  }

  for (const suerteId of suerteIds) {
    insertarSuerte.run(
      usuarioId,
      suerteId
    );
  }
}

/* =========================================================
   OBTENER USUARIOS
========================================================= */

export function getUsers(
  req,
  res
) {
  try {
    const users = db
      .prepare(`
        SELECT
          id,
          usuario,
          nombre,
          cargo,
          rol,
          zona,
          activo,
          created_at
        FROM usuarios
        ORDER BY nombre
      `)
      .all();

    const resultado =
      users.map((user) => ({
        ...user,
        ...obtenerAccesosUsuario(
          user.id
        ),
      }));

    res.json(resultado);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "Error obteniendo usuarios.",
    });
  }
}

/* =========================================================
   OBTENER USUARIO POR ID
========================================================= */

export function getUserById(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const user =
      obtenerUsuarioPorId(id);

    if (!user) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    res.json({
      ...user,
      ...obtenerAccesosUsuario(
        user.id
      ),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "Error obteniendo usuario.",
    });
  }
}

/* =========================================================
   CREAR USUARIO
========================================================= */

export function createUser(
  req,
  res
) {
  try {
    const {
      usuario,
      password,
      nombre,
      cargo,
      rol,
      zonaIds = [],
      haciendaIds = [],
      suerteIds = [],
    } = req.body;

    const usuarioNormalizado =
      typeof usuario === "string"
        ? usuario.trim()
        : "";

    const passwordNormalizada =
      typeof password === "string"
        ? password.trim()
        : "";

    const nombreNormalizado =
      typeof nombre === "string"
        ? nombre.trim()
        : "";

    const cargoNormalizado =
      typeof cargo === "string"
        ? cargo.trim()
        : "";

    if (!usuarioNormalizado) {
      return res.status(400).json({
        mensaje:
          "El usuario es obligatorio.",
      });
    }

    if (!passwordNormalizada) {
      return res.status(400).json({
        mensaje:
          "La contraseña es obligatoria.",
      });
    }

    if (!nombreNormalizado) {
      return res.status(400).json({
        mensaje:
          "El nombre es obligatorio.",
      });
    }

    if (!cargoNormalizado) {
      return res.status(400).json({
        mensaje:
          "El cargo es obligatorio.",
      });
    }

    if (!rol) {
      return res.status(400).json({
        mensaje:
          "El rol es obligatorio.",
      });
    }

    if (
      !ROLES_VALIDOS.includes(rol)
    ) {
      return res.status(400).json({
        mensaje:
          "Rol inválido.",
      });
    }

    if (
      rol === ROL_ADMINISTRADOR
    ) {
      return res.status(403).json({
        mensaje:
          "El administrador es una cuenta predeterminada y no puede crearse desde Administración.",
      });
    }

    const existe = db
      .prepare(`
        SELECT id
        FROM usuarios
        WHERE usuario = ?
      `)
      .get(
        usuarioNormalizado
      );

    if (existe) {
      return res.status(409).json({
        mensaje:
          "El usuario ya existe.",
      });
    }

    const accesos =
      prepararAccesosPorRol({
        rol,
        zonaIds,
        haciendaIds,
        suerteIds,
      });

    const passwordHash =
      bcrypt.hashSync(
        passwordNormalizada,
        10
      );

    const crear =
      db.transaction(() => {
        const result =
          db.prepare(`
            INSERT INTO usuarios (
              usuario,
              password_hash,
              nombre,
              cargo,
              rol
            )
            VALUES (?, ?, ?, ?, ?)
          `).run(
            usuarioNormalizado,
            passwordHash,
            nombreNormalizado,
            cargoNormalizado,
            rol
          );

        asignarAccesos(
          result.lastInsertRowid,
          accesos
        );

        return result.lastInsertRowid;
      });

    const usuarioId =
      crear();

    const nuevoUsuario =
      obtenerUsuarioPorId(
        usuarioId
      );

    res.status(201).json({
      ...nuevoUsuario,
      ...obtenerAccesosUsuario(
        usuarioId
      ),
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      mensaje:
        error.message ||
        "No fue posible crear el usuario.",
    });
  }
}

/* =========================================================
   ACTUALIZAR USUARIO
========================================================= */

export function updateUser(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const {
      usuario,
      nombre,
      cargo,
      rol,
      zonaIds = [],
      haciendaIds = [],
      suerteIds = [],
    } = req.body;

    const actual =
      obtenerUsuarioPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    if (
      esAdministradorProtegido(
        actual
      )
    ) {
      return res.status(403).json({
        mensaje:
          "La cuenta de administrador es una cuenta predeterminada y no puede editarse.",
      });
    }

    const usuarioNormalizado =
      typeof usuario === "string"
        ? usuario.trim()
        : "";

    const nombreNormalizado =
      typeof nombre === "string"
        ? nombre.trim()
        : "";

    const cargoNormalizado =
      typeof cargo === "string"
        ? cargo.trim()
        : "";

    if (!usuarioNormalizado) {
      return res.status(400).json({
        mensaje:
          "El usuario es obligatorio.",
      });
    }

    if (!nombreNormalizado) {
      return res.status(400).json({
        mensaje:
          "El nombre es obligatorio.",
      });
    }

    if (!cargoNormalizado) {
      return res.status(400).json({
        mensaje:
          "El cargo es obligatorio.",
      });
    }

    if (!rol) {
      return res.status(400).json({
        mensaje:
          "El rol es obligatorio.",
      });
    }

    if (
      rol === ROL_ADMINISTRADOR
    ) {
      return res.status(403).json({
        mensaje:
          "No se puede asignar el rol administrador desde Administración.",
      });
    }

    if (
      !ROLES_VALIDOS.includes(rol)
    ) {
      return res.status(400).json({
        mensaje:
          "Rol inválido.",
      });
    }

    const otroUsuario =
      db.prepare(`
        SELECT id
        FROM usuarios
        WHERE usuario = ?
          AND id != ?
      `).get(
        usuarioNormalizado,
        id
      );

    if (otroUsuario) {
      return res.status(409).json({
        mensaje:
          "El nombre de usuario ya está siendo utilizado.",
      });
    }

    const accesos =
      prepararAccesosPorRol({
        rol,
        zonaIds,
        haciendaIds,
        suerteIds,
      });

    const actualizar =
      db.transaction(() => {
        db.prepare(`
          UPDATE usuarios
          SET
            usuario = ?,
            nombre = ?,
            cargo = ?,
            rol = ?
          WHERE id = ?
        `).run(
          usuarioNormalizado,
          nombreNormalizado,
          cargoNormalizado,
          rol,
          id
        );

        db.prepare(`
          DELETE FROM usuario_zonas
          WHERE usuario_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM usuario_haciendas
          WHERE usuario_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM usuario_suertes
          WHERE usuario_id = ?
        `).run(id);

        asignarAccesos(
          id,
          accesos
        );
      });

    actualizar();

    const actualizado =
      obtenerUsuarioPorId(id);

    res.json({
      ...actualizado,
      ...obtenerAccesosUsuario(id),
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      mensaje:
        error.message ||
        "No fue posible actualizar el usuario.",
    });
  }
}

/* =========================================================
   CAMBIAR ESTADO
========================================================= */

export function updateUserStatus(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const { activo } =
      req.body;

    const usuario =
      obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    if (
      esAdministradorProtegido(
        usuario
      )
    ) {
      return res.status(403).json({
        mensaje:
          "La cuenta de administrador es una cuenta predeterminada y no puede desactivarse.",
      });
    }

    const result =
      db.prepare(`
        UPDATE usuarios
        SET activo = ?
        WHERE id = ?
      `).run(
        activo ? 1 : 0,
        id
      );

    if (!result.changes) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    res.json({
      mensaje:
        "Estado actualizado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "No fue posible actualizar el estado.",
    });
  }
}

/* =========================================================
   CAMBIAR CONTRASEÑA
========================================================= */

export function updateUserPassword(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const { password } =
      req.body;

    const usuario =
      obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    if (
      esAdministradorProtegido(
        usuario
      )
    ) {
      return res.status(403).json({
        mensaje:
          "La contraseña del administrador predeterminado no puede cambiarse desde Administración.",
      });
    }

    const passwordNormalizada =
      typeof password === "string"
        ? password.trim()
        : "";

    if (!passwordNormalizada) {
      return res.status(400).json({
        mensaje:
          "La contraseña es obligatoria.",
      });
    }

    if (passwordNormalizada.length < 6) {
      return res.status(400).json({
        mensaje:
          "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    const passwordHash =
      bcrypt.hashSync(
        passwordNormalizada,
        10
      );

    const result =
      db.prepare(`
        UPDATE usuarios
        SET password_hash = ?
        WHERE id = ?
      `).run(
        passwordHash,
        id
      );

    if (!result.changes) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    res.json({
      mensaje:
        "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "No fue posible actualizar la contraseña.",
    });
  }
}

/* =========================================================
   ELIMINAR USUARIO
========================================================= */

export function deleteUser(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    const usuario =
      db.prepare(`
        SELECT
          id,
          usuario,
          nombre,
          rol
        FROM usuarios
        WHERE id = ?
      `).get(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    if (
      esAdministradorProtegido(
        usuario
      )
    ) {
      return res.status(403).json({
        mensaje:
          "La cuenta de administrador es una cuenta predeterminada y no puede eliminarse.",
      });
    }

    const eliminar =
      db.transaction(() => {
        db.prepare(`
          DELETE FROM usuario_zonas
          WHERE usuario_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM usuario_haciendas
          WHERE usuario_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM usuario_suertes
          WHERE usuario_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM sesiones
          WHERE usuario_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM usuarios
          WHERE id = ?
        `).run(id);
      });

    eliminar();

    res.json({
      mensaje:
        "Usuario eliminado correctamente.",
      usuario: {
        id: usuario.id,
        usuario:
          usuario.usuario,
        nombre:
          usuario.nombre,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "No fue posible eliminar el usuario.",
    });
  }
}