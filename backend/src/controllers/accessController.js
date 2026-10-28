
import sql from "mssql";
import { getFabricPool } from "../database/fabric.js";

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

function parseIds(value) {
  if (!value) return [];

  return [
    ...new Set(
      String(value)
        .split(",")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
}

function placeholders(ids) {
  return ids.map((_, i) => `@id${i}`).join(", ");
}

function agregarIds(request, ids) {
  ids.forEach((id, i) => {
    request.input(`id${i}`, sql.Int, id);
  });
}

async function consultarAccesos(pool, usuarioId) {
  const zonasResult = await pool.request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT z.id, z.nombre
      FROM dbo.Usuario_Zona uz
      INNER JOIN dbo.Zonas z ON z.id = uz.zona_id
      WHERE uz.usuario_id = @usuarioId
        AND z.activa = 1
      ORDER BY z.nombre
    `);

  const haciendasResult = await pool.request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
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

  const suertesResult = await pool.request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT
        s.id,
        s.codigo_sia AS codigo,
        s.hacienda_id,
        h.codigo_hacienda AS hacienda_codigo,
        h.nombre AS hacienda,
        h.zona_id,
        z.nombre AS zona
      FROM dbo.Usuario_Suerte us
      INNER JOIN dbo.Suertes s ON s.id = us.suerte_id
      INNER JOIN dbo.Haciendas h ON h.id = s.hacienda_id
      LEFT JOIN dbo.Zonas z ON z.id = h.zona_id
      WHERE us.usuario_id = @usuarioId
        AND s.activa = 1
        AND h.activa = 1
      ORDER BY z.nombre, h.nombre, s.codigo_sia
    `);

  return {
    zonas: zonasResult.recordset,
    haciendas: haciendasResult.recordset,
    suertes: suertesResult.recordset,
  };
}

export async function getZonas(req, res) {
  try {
    const pool = await getFabricPool();
    const result = await pool.request().query(`
      SELECT id, nombre
      FROM dbo.Zonas
      WHERE activa = 1
      ORDER BY nombre
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo zonas:", error);
    res.status(500).json({ mensaje: "No fue posible obtener las zonas." });
  }
}

export async function getHaciendas(req, res) {
  try {
    const zonaIds = parseIds(req.query.zonaIds);
    const pool = await getFabricPool();

    let query = `
      SELECT
        h.id,
        h.codigo_hacienda AS codigo,
        h.nombre,
        h.zona_id,
        z.nombre AS zona
      FROM dbo.Haciendas h
      LEFT JOIN dbo.Zonas z ON z.id = h.zona_id
      WHERE h.activa = 1
    `;

    const request = pool.request();

    if (zonaIds.length) {
      query += ` AND h.zona_id IN (${placeholders(zonaIds)})`;
      agregarIds(request, zonaIds);
    }

    query += " ORDER BY z.nombre, h.nombre";

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo haciendas:", error);
    res.status(500).json({ mensaje: "No fue posible obtener las haciendas." });
  }
}

export async function getSuertes(req, res) {
  try {
    const haciendaIds = parseIds(req.query.haciendaIds);

    if (!haciendaIds.length) {
      return res.json([]);
    }

    const pool = await getFabricPool();
    const request = pool.request();

    agregarIds(request, haciendaIds);

    const result = await request.query(`
      SELECT
        s.id,
        s.codigo_sia AS codigo,
        s.hacienda_id,
        h.codigo_hacienda AS hacienda_codigo,
        h.nombre AS hacienda,
        h.zona_id,
        z.nombre AS zona
      FROM dbo.Suertes s
      INNER JOIN dbo.Haciendas h ON h.id = s.hacienda_id
      LEFT JOIN dbo.Zonas z ON z.id = h.zona_id
      WHERE s.activa = 1
        AND h.activa = 1
        AND s.hacienda_id IN (${placeholders(haciendaIds)})
      ORDER BY z.nombre, h.nombre, s.codigo_sia
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo suertes:", error);
    res.status(500).json({ mensaje: "No fue posible obtener las suertes." });
  }
}


export async function getMyAccess(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        mensaje: "No fue posible identificar al usuario autenticado.",
      });
    }

    // El administrador temporal no existe en Fabric.
    if (req.user.rol === "administrador" && req.user.id === "admin-env") {
      return res.json({
        usuarioId: null,
        rol: "administrador",
        zonas: [],
        haciendas: [],
        suertes: [],
      });
    }

    const pool = await getFabricPool();

    const usuarioResult = await pool.request()
      .input("usuarioId", sql.Int, Number(req.user.id))
      .query(`
        SELECT u.id, u.rol_id, r.nombre AS rol
        FROM dbo.Usuarios u
        INNER JOIN dbo.Roles r ON r.id = u.rol_id
        WHERE u.id = @usuarioId AND u.activo = 1
      `);

    const usuario = usuarioResult.recordset[0];

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado.",
      });
    }

    const accesos = await consultarAccesos(pool, usuario.id);

    return res.json({
      usuarioId: usuario.id,
      rol: String(usuario.rol).toLowerCase(),
      zonas: accesos.zonas,
      haciendas: accesos.haciendas,
      suertes: accesos.suertes,
    });
  } catch (error) {
    console.error("Error obteniendo accesos propios:", error);

    return res.status(500).json({
      mensaje: "No fue posible obtener los accesos del usuario.",
    });
  }
}


export async function getUserAccess(req, res) {
  try {
    const usuarioId = Number(req.params.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({ mensaje: "ID de usuario inválido." });
    }

    const pool = await getFabricPool();
    const usuarioResult = await pool.request()
      .input("usuarioId", sql.Int, usuarioId)
      .query(`
        SELECT id, rol_id
        FROM dbo.Usuarios
        WHERE id = @usuarioId
      `);

    if (!usuarioResult.recordset.length) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const accesos = await consultarAccesos(pool, usuarioId);

    res.json({
      usuarioId,
      zonas: accesos.zonas,
      haciendas: accesos.haciendas,
      suertes: accesos.suertes,
    });
  } catch (error) {
    console.error("Error obteniendo accesos:", error);
    res.status(500).json({ mensaje: "No fue posible obtener los accesos." });
  }
}

export async function updateUserAccess(req, res) {
  try {
    const usuarioId = Number(req.params.id);
    const zonas = normalizarIds(req.body.zonaIds);
    const haciendas = normalizarIds(req.body.haciendaIds);
    const suertes = normalizarIds(req.body.suerteIds);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({ mensaje: "ID de usuario inválido." });
    }

    const pool = await getFabricPool();
    const usuarioResult = await pool.request()
      .input("usuarioId", sql.Int, usuarioId)
      .query(`
        SELECT u.id, u.rol_id, LOWER(r.nombre) AS rol
        FROM dbo.Usuarios u
        INNER JOIN dbo.Roles r ON r.id = u.rol_id
        WHERE u.id = @usuarioId
      `);

    const usuario = usuarioResult.recordset[0];

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (["gerente", "administrador"].includes(usuario.rol)) {
      return res.status(400).json({
        mensaje: "Este rol no requiere asignaciones específicas.",
      });
    }

    if (!zonas.length) {
      return res.status(400).json({
        mensaje: "Debe seleccionar al menos una zona.",
      });
    }

    if (usuario.rol === "mayordomo" && (!haciendas.length || !suertes.length)) {
      return res.status(400).json({
        mensaje: "El mayordomo debe tener zonas, haciendas y suertes asignadas.",
      });
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const zonasResult = await new sql.Request(tx).query(`
        SELECT id
        FROM dbo.Zonas
        WHERE activa = 1
      `);
      const zonasValidas = new Set(zonasResult.recordset.map((z) => z.id));

      if (zonas.some((id) => !zonasValidas.has(id))) {
        throw new Error("Una o más zonas no son válidas.");
      }

      if (usuario.rol === "mayordomo") {
        const haciendasResult = await new sql.Request(tx).query(`
          SELECT id, zona_id
          FROM dbo.Haciendas
          WHERE activa = 1
        `);
        const haciendasValidas = new Map(
          haciendasResult.recordset.map((h) => [h.id, h.zona_id])
        );

        if (haciendas.some((id) => !haciendasValidas.has(id))) {
          throw new Error("Una o más haciendas no son válidas.");
        }

        if (haciendas.some((id) => !zonas.includes(haciendasValidas.get(id)))) {
          throw new Error("Una hacienda seleccionada no pertenece a las zonas seleccionadas.");
        }

        const suertesResult = await new sql.Request(tx).query(`
          SELECT id, hacienda_id
          FROM dbo.Suertes
          WHERE activa = 1
        `);
        const suertesValidas = new Map(
          suertesResult.recordset.map((s) => [s.id, s.hacienda_id])
        );

        if (suertes.some((id) => !suertesValidas.has(id))) {
          throw new Error("Una o más suertes no son válidas.");
        }

        if (suertes.some((id) => !haciendas.includes(suertesValidas.get(id)))) {
          throw new Error("Una suerte seleccionada no pertenece a las haciendas seleccionadas.");
        }
      }

      for (const tabla of ["Usuario_Zona", "Usuario_Hacienda", "Usuario_Suerte"]) {
        await new sql.Request(tx)
          .input("usuarioId", sql.Int, usuarioId)
          .query(`DELETE FROM dbo.${tabla} WHERE usuario_id = @usuarioId`);
      }

      for (const zonaId of zonas) {
        await new sql.Request(tx)
          .input("usuarioId", sql.Int, usuarioId)
          .input("zonaId", sql.Int, zonaId)
          .query(`
            INSERT INTO dbo.Usuario_Zona (usuario_id, zona_id)
            VALUES (@usuarioId, @zonaId)
          `);
      }

      if (usuario.rol === "mayordomo") {
        for (const haciendaId of haciendas) {
          await new sql.Request(tx)
            .input("usuarioId", sql.Int, usuarioId)
            .input("haciendaId", sql.Int, haciendaId)
            .query(`
              INSERT INTO dbo.Usuario_Hacienda (usuario_id, hacienda_id)
              VALUES (@usuarioId, @haciendaId)
            `);
        }

        for (const suerteId of suertes) {
          await new sql.Request(tx)
            .input("usuarioId", sql.Int, usuarioId)
            .input("suerteId", sql.Int, suerteId)
            .query(`
              INSERT INTO dbo.Usuario_Suerte (usuario_id, suerte_id)
              VALUES (@usuarioId, @suerteId)
            `);
        }
      }

      await tx.commit();

      return res.json({ mensaje: "Accesos actualizados correctamente." });
    } catch (error) {
      await tx.rollback();
      const status = error.message.includes("no son válidas") ||
        error.message.includes("no pertenece")
        ? 400
        : 500;

      return res.status(status).json({
        mensaje: error.message || "No fue posible actualizar los accesos.",
      });
    }
  } catch (error) {
    console.error("Error actualizando accesos:", error);
    return res.status(500).json({
      mensaje: "No fue posible actualizar los accesos.",
    });
  }
}
