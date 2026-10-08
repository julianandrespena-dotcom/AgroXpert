import db from "../database/database.js";

/* HELPERS */

function parseIds(value) {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      String(value)
        .split(",")
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    ),
  ];
}

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

/* ZONAS */

export function getZonas(req, res) {
  try {
    const zonas = db
      .prepare(`
        SELECT
          id,
          codigo,
          nombre,
          activo,
          created_at
        FROM zonas
        WHERE activo = 1
        ORDER BY
          CAST(codigo AS INTEGER),
          nombre
      `)
      .all();

    res.json(zonas);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "No fue posible obtener las zonas.",
    });
  }
}

/* HACIENDAS
   /api/access/haciendas
   /api/access/haciendas?zonaIds=1,2 */

export function getHaciendas(req, res) {
  try {
    const zonaIds = parseIds(
      req.query.zonaIds
    );

    let sql = `
      SELECT
        h.id,
        h.codigo,
        h.nombre,
        h.zona_id,
        z.codigo AS zona_codigo,
        z.nombre AS zona,
        h.activo,
        h.created_at
      FROM haciendas h
      LEFT JOIN zonas z
        ON z.id = h.zona_id
      WHERE h.activo = 1
    `;

    const params = [];

    if (zonaIds.length) {
      const placeholders =
        zonaIds.map(() => "?").join(",");

      sql += `
        AND h.zona_id IN (${placeholders})
      `;

      params.push(...zonaIds);
    }

    sql += `
      ORDER BY
        CAST(z.codigo AS INTEGER),
        z.nombre,
        h.nombre
    `;

    const haciendas = db
      .prepare(sql)
      .all(...params);

    res.json(haciendas);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "No fue posible obtener las haciendas.",
    });
  }
}

/* SUERTES
   /api/access/suertes?haciendaIds=1,2 */

export function getSuertes(req, res) {
  try {
    const haciendaIds = parseIds(
      req.query.haciendaIds
    );

    let sql = `
      SELECT
        s.id,
        s.codigo,
        s.hacienda_id,
        h.codigo AS hacienda_codigo,
        h.nombre AS hacienda,
        h.zona_id,
        z.codigo AS zona_codigo,
        z.nombre AS zona,
        s.activo,
        s.created_at
      FROM suertes s
      INNER JOIN haciendas h
        ON h.id = s.hacienda_id
      LEFT JOIN zonas z
        ON z.id = h.zona_id
      WHERE s.activo = 1
    `;

    const params = [];

    if (haciendaIds.length) {
      const placeholders =
        haciendaIds.map(() => "?").join(",");

      sql += `
        AND s.hacienda_id IN (${placeholders})
      `;

      params.push(...haciendaIds);
    } else {
      return res.json([]);
    }

    sql += `
      ORDER BY
        CAST(z.codigo AS INTEGER),
        h.nombre,
        s.codigo
    `;

    const suertes = db
      .prepare(sql)
      .all(...params);

    res.json(suertes);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "No fue posible obtener las suertes.",
    });
  }
}

/* ACCESOS DEL USUARIO AUTENTICADO
   /api/access/me

   Esta ruta NO recibe un usuarioId.
   El usuario se obtiene directamente
   de la sesión autenticada.
*/

export function getMyAccess(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        mensaje:
          "No fue posible identificar al usuario autenticado.",
      });
    }

    const usuarioId = req.user.id;

    const usuario = db
      .prepare(`
        SELECT
          id,
          rol,
          zona
        FROM usuarios
        WHERE id = ?
          AND activo = 1
      `)
      .get(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

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
          z.codigo AS zona_codigo,
          z.nombre AS zona
        FROM usuario_haciendas uh
        INNER JOIN haciendas h
          ON h.id = uh.hacienda_id
        LEFT JOIN zonas z
          ON z.id = h.zona_id
        WHERE uh.usuario_id = ?
          AND h.activo = 1
        ORDER BY
          CAST(z.codigo AS INTEGER),
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
          h.codigo AS hacienda_codigo,
          h.nombre AS hacienda,
          h.zona_id,
          z.codigo AS zona_codigo,
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
          AND h.activo = 1
        ORDER BY
          CAST(z.codigo AS INTEGER),
          z.nombre,
          h.nombre,
          s.codigo
      `)
      .all(usuarioId);

    return res.json({
      usuarioId: usuario.id,
      rol: usuario.rol,
      zona: usuario.zona,
      zonas,
      haciendas,
      suertes,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje:
        "No fue posible obtener los accesos del usuario.",
    });
  }
}

/* ACCESO DE UN USUARIO
   Esta ruta continúa siendo exclusiva
   del administrador.
*/

export function getUserAccess(req, res) {
  try {
    const { id } = req.params;

    const usuario = db
      .prepare(`
        SELECT
          id,
          rol
        FROM usuarios
        WHERE id = ?
      `)
      .get(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

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
        ORDER BY
          CAST(z.codigo AS INTEGER),
          z.nombre
      `)
      .all(id);

    const haciendas = db
      .prepare(`
        SELECT
          h.id,
          h.codigo,
          h.nombre,
          h.zona_id,
          z.codigo AS zona_codigo,
          z.nombre AS zona
        FROM usuario_haciendas uh
        INNER JOIN haciendas h
          ON h.id = uh.hacienda_id
        LEFT JOIN zonas z
          ON z.id = h.zona_id
        WHERE uh.usuario_id = ?
        ORDER BY
          z.nombre,
          h.nombre
      `)
      .all(id);

    const suertes = db
      .prepare(`
        SELECT
          s.id,
          s.codigo,
          s.hacienda_id,
          h.codigo AS hacienda_codigo,
          h.nombre AS hacienda,
          h.zona_id,
          z.codigo AS zona_codigo,
          z.nombre AS zona
        FROM usuario_suertes us
        INNER JOIN suertes s
          ON s.id = us.suerte_id
        INNER JOIN haciendas h
          ON h.id = s.hacienda_id
        LEFT JOIN zonas z
          ON z.id = h.zona_id
        WHERE us.usuario_id = ?
        ORDER BY
          z.nombre,
          h.nombre,
          s.codigo
      `)
      .all(id);

    res.json({
      usuarioId: usuario.id,
      rol: usuario.rol,
      zonas,
      haciendas,
      suertes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        "No fue posible obtener los accesos.",
    });
  }
}

/* ACTUALIZAR ACCESO */

export function updateUserAccess(req, res) {
  try {
    const { id } = req.params;

    const {
      zonaIds = [],
      haciendaIds = [],
      suerteIds = [],
    } = req.body;

    const usuario = db
      .prepare(`
        SELECT
          id,
          rol
        FROM usuarios
        WHERE id = ?
      `)
      .get(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    const zonas = normalizarIds(
      zonaIds
    );

    const haciendas =
      normalizarIds(haciendaIds);

    const suertes =
      normalizarIds(suerteIds);

    /* GERENTE / ADMINISTRADOR */

    if (
      usuario.rol === "gerente" ||
      usuario.rol === "administrador"
    ) {
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
      })();

      return res.json({
        mensaje:
          "Accesos actualizados correctamente.",
      });
    }

    /* DIRECTOR / SUPERVISOR */

    if (
      usuario.rol === "director" ||
      usuario.rol === "supervisor"
    ) {
      if (!zonas.length) {
        return res.status(400).json({
          mensaje:
            "Debe seleccionar al menos una zona.",
        });
      }

      const zonasValidas =
        db.prepare(`
          SELECT id
          FROM zonas
          WHERE activo = 1
            AND id IN (
              ${zonas.map(() => "?").join(",")}
            )
        `).all(...zonas);

      if (
        zonasValidas.length !==
        zonas.length
      ) {
        return res.status(400).json({
          mensaje:
            "Una o más zonas no son válidas.",
        });
      }

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

        const insert = db.prepare(`
          INSERT OR IGNORE INTO usuario_zonas
            (usuario_id, zona_id)
          VALUES (?, ?)
        `);

        for (const zonaId of zonas) {
          insert.run(id, zonaId);
        }
      })();

      return res.json({
        mensaje:
          "Accesos actualizados correctamente.",
      });
    }

    /* MAYORDOMO */

    if (usuario.rol === "mayordomo") {
      if (!zonas.length) {
        return res.status(400).json({
          mensaje:
            "Debe seleccionar al menos una zona.",
        });
      }

      if (!haciendas.length) {
        return res.status(400).json({
          mensaje:
            "Debe seleccionar al menos una hacienda.",
        });
      }

      if (!suertes.length) {
        return res.status(400).json({
          mensaje:
            "Debe seleccionar al menos una suerte.",
        });
      }

      const zonasValidas =
        db.prepare(`
          SELECT id
          FROM zonas
          WHERE activo = 1
            AND id IN (
              ${zonas.map(() => "?").join(",")}
            )
        `).all(...zonas);

      if (
        zonasValidas.length !==
        zonas.length
      ) {
        return res.status(400).json({
          mensaje:
            "Una o más zonas no son válidas.",
        });
      }

      const haciendasValidas =
        db.prepare(`
          SELECT
            id,
            zona_id
          FROM haciendas
          WHERE activo = 1
            AND id IN (
              ${haciendas
                .map(() => "?")
                .join(",")}
            )
        `).all(...haciendas);

      if (
        haciendasValidas.length !==
        haciendas.length
      ) {
        return res.status(400).json({
          mensaje:
            "Una o más haciendas no son válidas.",
        });
      }

      const zonasSet = new Set(zonas);

      const haciendaFueraDeZona =
        haciendasValidas.some(
          (hacienda) =>
            !zonasSet.has(
              hacienda.zona_id
            )
        );

      if (haciendaFueraDeZona) {
        return res.status(400).json({
          mensaje:
            "Una hacienda seleccionada no pertenece a las zonas seleccionadas.",
        });
      }

      const suertesValidas =
        db.prepare(`
          SELECT
            id,
            hacienda_id
          FROM suertes
          WHERE activo = 1
            AND id IN (
              ${suertes
                .map(() => "?")
                .join(",")}
            )
        `).all(...suertes);

      if (
        suertesValidas.length !==
        suertes.length
      ) {
        return res.status(400).json({
          mensaje:
            "Una o más suertes no son válidas.",
        });
      }

      const haciendasSet =
        new Set(haciendas);

      const suerteFueraDeHacienda =
        suertesValidas.some(
          (suerte) =>
            !haciendasSet.has(
              suerte.hacienda_id
            )
        );

      if (suerteFueraDeHacienda) {
        return res.status(400).json({
          mensaje:
            "Una suerte seleccionada no pertenece a las haciendas seleccionadas.",
        });
      }

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

        const insertZona =
          db.prepare(`
            INSERT INTO usuario_zonas
              (usuario_id, zona_id)
            VALUES (?, ?)
          `);

        const insertHacienda =
          db.prepare(`
            INSERT INTO usuario_haciendas
              (usuario_id, hacienda_id)
            VALUES (?, ?)
          `);

        const insertSuerte =
          db.prepare(`
            INSERT INTO usuario_suertes
              (usuario_id, suerte_id)
            VALUES (?, ?)
          `);

        for (const zonaId of zonas) {
          insertZona.run(
            id,
            zonaId
          );
        }

        for (
          const haciendaId of haciendas
        ) {
          insertHacienda.run(
            id,
            haciendaId
          );
        }

        for (const suerteId of suertes) {
          insertSuerte.run(
            id,
            suerteId
          );
        }
      })();

      return res.json({
        mensaje:
          "Accesos actualizados correctamente.",
      });
    }

    return res.status(400).json({
      mensaje:
        "Rol no soportado.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje:
        error.message ||
        "No fue posible actualizar los accesos.",
    });
  }
}