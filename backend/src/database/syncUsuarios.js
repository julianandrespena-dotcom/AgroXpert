import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import bcrypt from "bcryptjs";
import db from "./database.js";

const PROJECT_ROOT = path.resolve(
  process.cwd(),
  ".."
);

const EXCEL_PATH = path.join(
  PROJECT_ROOT,
  "data",
  "usuarios_mayordomos.xlsx"
);

if (!fs.existsSync(EXCEL_PATH)) {
  throw new Error(
    `No se encontró el Excel maestro:\n${EXCEL_PATH}`
  );
}

console.log("======================================");
console.log("SINCRONIZACIÓN DE USUARIOS");
console.log("======================================");
console.log(`Excel: ${EXCEL_PATH}`);
console.log("");

/* UTILIDADES */

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(value) {
  const text = clean(value);

  if (!text) {
    return "";
  }

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1).toLowerCase()
  );
}

function createUsername(nombre, usedUsernames) {
  const parts = normalizeText(nombre)
    .split(" ")
    .filter(Boolean);

  let base = parts.join(".");

  if (!base) {
    base = "mayordomo";
  }

  let username = base;
  let counter = 2;

  while (usedUsernames.has(username)) {
    username = `${base}${counter}`;
    counter++;
  }

  usedUsernames.add(username);

  return username;
}

function createPassword(nombre) {
  const parts = normalizeText(nombre)
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) {
    return "AgroXpert123*";
  }

  const firstName = capitalize(parts[0]);

  const firstSurname =
    parts.length >= 2
      ? capitalize(parts[1])
      : "";

  return `${firstName}${firstSurname}123*`;
}

/* LEER EXCEL */

const workbook = xlsx.readFile(EXCEL_PATH);

const sheetName = workbook.SheetNames[0];

const sheet = workbook.Sheets[sheetName];

const rows = xlsx.utils.sheet_to_json(sheet, {
  defval: "",
  raw: false,
  blankrows: false,
});

const normalizedRows = rows.map((row) => {
  const normalized = {};

  for (const [key, value] of Object.entries(row)) {
    normalized[
      String(key)
        .replace(/^\uFEFF/, "")
        .trim()
    ] = value;
  }

  return normalized;
});

console.log(
  `Filas encontradas: ${normalizedRows.length}`
);

if (normalizedRows.length === 0) {
  throw new Error("El Excel está vacío.");
}

/* VALIDAR COLUMNAS */

const requiredColumns = [
  "ZONA",
  "MAYORDOMO",
  "COD. HAC",
  "SUERTES",
  "HACIENDA",
];

for (const column of requiredColumns) {
  if (
    !Object.prototype.hasOwnProperty.call(
      normalizedRows[0],
      column
    )
  ) {
    throw new Error(
      `Falta la columna "${column}" en el Excel.`
    );
  }
}

/* AGRUPAR MAYORDOMOS */

const mayordomos = new Map();

let rowsIgnored = 0;

for (const row of normalizedRows) {
  const zona = clean(row["ZONA"]);
  const nombre = clean(row["MAYORDOMO"]);
  const codigoHacienda = clean(row["COD. HAC"]);
  const hacienda = clean(row["HACIENDA"]);
  const suerte = clean(row["SUERTES"]);

  if (
    !zona ||
    !nombre ||
    !codigoHacienda ||
    !hacienda ||
    !suerte
  ) {
    rowsIgnored++;
    continue;
  }

  const key = normalizeText(nombre);

  if (!mayordomos.has(key)) {
    mayordomos.set(key, {
      nombre,
      relaciones: new Map(),
    });
  }

  const mayordomo = mayordomos.get(key);

  /*
   * Una relación queda identificada por:
   *
   * ZONA + COD. HAC + SUERTE
   */

  const relationKey = [
    zona,
    codigoHacienda,
    suerte,
  ].join("|");

  if (!mayordomo.relaciones.has(relationKey)) {
    mayordomo.relaciones.set(
      relationKey,
      {
        zona,
        codigoHacienda,
        hacienda,
        suerte,
      }
    );
  }
}

console.log(
  `Mayordomos únicos: ${mayordomos.size}`
);

if (rowsIgnored > 0) {
  console.log(
    `Filas ignoradas por datos incompletos: ${rowsIgnored}`
  );
}

/* USUARIOS EXISTENTES */

const existingUsers = db
  .prepare(
    `
    SELECT id, usuario, nombre
    FROM usuarios
    `
  )
  .all();

const usedUsernames = new Set(
  existingUsers.map(
    (user) => user.usuario
  )
);

/* CONTADORES */

let usersCreated = 0;
let usersExisting = 0;

let zonesCreated = 0;
let haciendasCreated = 0;
let suertesCreated = 0;

let zoneAssignments = 0;
let haciendaAssignments = 0;
let suerteAssignments = 0;

/* ZONA */

function getOrCreateZona(codigo) {
  let zona = db
    .prepare(
      `
      SELECT *
      FROM zonas
      WHERE codigo = ?
      LIMIT 1
      `
    )
    .get(codigo);

  if (zona) {
    return zona;
  }

  const nombre = `Zona ${codigo}`;

  zona = db
    .prepare(
      `
      SELECT *
      FROM zonas
      WHERE nombre = ?
      LIMIT 1
      `
    )
    .get(nombre);

  if (zona) {
    if (!zona.codigo) {
      db.prepare(
        `
        UPDATE zonas
        SET codigo = ?
        WHERE id = ?
        `
      ).run(
        codigo,
        zona.id
      );
    }

    return db
      .prepare(
        `
        SELECT *
        FROM zonas
        WHERE id = ?
        `
      )
      .get(zona.id);
  }

  const result = db
    .prepare(
      `
      INSERT INTO zonas (
        nombre,
        codigo,
        activo
      )
      VALUES (?, ?, 1)
      `
    )
    .run(
      nombre,
      codigo
    );

  zonesCreated++;

  return db
    .prepare(
      `
      SELECT *
      FROM zonas
      WHERE id = ?
      `
    )
    .get(result.lastInsertRowid);
}

/* HACIENDA */

/*
 * La identidad de una hacienda se determina por:
 *
 *     ZONA + COD. HAC
 *
 * El nombre NO se utiliza como identificador único.
 *
 * Esto permite casos como:
 *
 * Zona 1 + 010005 + LA AVELINA
 * Zona 2 + 020015 + LA AVELINA
 *
 * que representan haciendas diferentes.
 */

function getOrCreateHacienda({
  zonaId,
  codigo,
  nombre,
}) {
  /*
   * 1. Buscar por código + zona
   */

  let hacienda = db
    .prepare(
      `
      SELECT *
      FROM haciendas
      WHERE codigo = ?
        AND zona_id = ?
      LIMIT 1
      `
    )
    .get(
      codigo,
      zonaId
    );

  if (hacienda) {
    /*
     * Si cambió el nombre en el Excel,
     * actualizamos el registro.
     */

    if (hacienda.nombre !== nombre) {
      db.prepare(
        `
        UPDATE haciendas
        SET nombre = ?
        WHERE id = ?
        `
      ).run(
        nombre,
        hacienda.id
      );

      hacienda.nombre = nombre;
    }

    return hacienda;
  }

  /*
   * 2. Buscar mismo nombre dentro
   *    de la misma zona.
   *
   * Puede ser una hacienda existente
   * que todavía no tenía código.
   */

  hacienda = db
    .prepare(
      `
      SELECT *
      FROM haciendas
      WHERE nombre = ?
        AND zona_id = ?
      LIMIT 1
      `
    )
    .get(
      nombre,
      zonaId
    );

  if (hacienda) {
    /*
     * Si no tenía código, se lo asignamos.
     */

    if (!hacienda.codigo) {
      db.prepare(
        `
        UPDATE haciendas
        SET codigo = ?
        WHERE id = ?
        `
      ).run(
        codigo,
        hacienda.id
      );

      hacienda.codigo = codigo;

      return hacienda;
    }

    /*
     * Si ya tiene otro código, NO
     * reutilizamos la hacienda.
     *
     * Puede tratarse de dos haciendas
     * diferentes con el mismo nombre.
     *
     * En ese caso se crea una nueva.
     */
  }

  /*
   * 3. Crear la hacienda.
   */

  const result = db
    .prepare(
      `
      INSERT INTO haciendas (
        nombre,
        codigo,
        zona_id,
        activo
      )
      VALUES (?, ?, ?, 1)
      `
    )
    .run(
      nombre,
      codigo,
      zonaId
    );

  haciendasCreated++;

  return db
    .prepare(
      `
      SELECT *
      FROM haciendas
      WHERE id = ?
      `
    )
    .get(result.lastInsertRowid);
}

/* SUERTE */

function getOrCreateSuerte({
  codigo,
  haciendaId,
}) {
  let suerte = db
    .prepare(
      `
      SELECT *
      FROM suertes
      WHERE codigo = ?
        AND hacienda_id = ?
      LIMIT 1
      `
    )
    .get(
      codigo,
      haciendaId
    );

  if (suerte) {
    return suerte;
  }

  const result = db
    .prepare(
      `
      INSERT INTO suertes (
        codigo,
        hacienda_id,
        activo
      )
      VALUES (?, ?, 1)
      `
    )
    .run(
      codigo,
      haciendaId
    );

  suertesCreated++;

  return db
    .prepare(
      `
      SELECT *
      FROM suertes
      WHERE id = ?
      `
    )
    .get(
      result.lastInsertRowid
    );
}

/* OBTENER USUARIO */

function getExistingMayordomo(nombre) {
  const normalizedName =
    normalizeText(nombre);

  const users = db
    .prepare(
      `
      SELECT *
      FROM usuarios
      WHERE rol = 'mayordomo'
      `
    )
    .all();

  return (
    users.find(
      (user) =>
        normalizeText(user.nombre) ===
        normalizedName
    ) || null
  );
}

/* TRANSACCIÓN */

const sync = db.transaction(() => {
  for (const mayordomo of mayordomos.values()) {
    let usuario =
      getExistingMayordomo(
        mayordomo.nombre
      );

    if (usuario) {
      usersExisting++;
    } else {
      /*
       * Usuario nuevo
       */

      const username =
        createUsername(
          mayordomo.nombre,
          usedUsernames
        );

      const password =
        createPassword(
          mayordomo.nombre
        );

      const passwordHash =
        bcrypt.hashSync(
          password,
          10
        );

      const result = db
        .prepare(
          `
          INSERT INTO usuarios (
            usuario,
            password_hash,
            nombre,
            cargo,
            rol,
            activo
          )
          VALUES (
            ?,
            ?,
            ?,
            'Mayordomo',
            'mayordomo',
            1
          )
          `
        )
        .run(
          username,
          passwordHash,
          mayordomo.nombre
        );

      usuario = db
        .prepare(
          `
          SELECT *
          FROM usuarios
          WHERE id = ?
          `
        )
        .get(
          result.lastInsertRowid
        );

      usersCreated++;
    }

    /*
     * =====================================================
     * RELACIONES DEL EXCEL
     * =====================================================
     */

    const desiredZones = new Set();
    const desiredHaciendas =
      new Set();
    const desiredSuertes =
      new Set();

    for (
      const relation of
        mayordomo.relaciones.values()
    ) {
      /*
       * Zona
       */

      const zona =
        getOrCreateZona(
          relation.zona
        );

      /*
       * Hacienda
       */

      const hacienda =
        getOrCreateHacienda({
          zonaId: zona.id,
          codigo:
            relation.codigoHacienda,
          nombre:
            relation.hacienda,
        });

      /*
       * Suerte
       */

      const suerte =
        getOrCreateSuerte({
          codigo:
            relation.suerte,
          haciendaId:
            hacienda.id,
        });

      desiredZones.add(
        zona.id
      );

      desiredHaciendas.add(
        hacienda.id
      );

      desiredSuertes.add(
        suerte.id
      );
    }

    /*
     * =====================================================
     * ASIGNAR ZONAS
     * =====================================================
     */

    for (
      const zonaId of desiredZones
    ) {
      const result = db
        .prepare(
          `
          INSERT OR IGNORE INTO usuario_zonas (
            usuario_id,
            zona_id
          )
          VALUES (?, ?)
          `
        )
        .run(
          usuario.id,
          zonaId
        );

      if (result.changes > 0) {
        zoneAssignments++;
      }
    }

    /*
     * =====================================================
     * ASIGNAR HACIENDAS
     * =====================================================
     */

    for (
      const haciendaId of
        desiredHaciendas
    ) {
      const result = db
        .prepare(
          `
          INSERT OR IGNORE INTO usuario_haciendas (
            usuario_id,
            hacienda_id
          )
          VALUES (?, ?)
          `
        )
        .run(
          usuario.id,
          haciendaId
        );

      if (result.changes > 0) {
        haciendaAssignments++;
      }
    }

    /*
     * =====================================================
     * ASIGNAR SUERTES
     * =====================================================
     */

    for (
      const suerteId of
        desiredSuertes
    ) {
      const result = db
        .prepare(
          `
          INSERT OR IGNORE INTO usuario_suertes (
            usuario_id,
            suerte_id
          )
          VALUES (?, ?)
          `
        )
        .run(
          usuario.id,
          suerteId
        );

      if (result.changes > 0) {
        suerteAssignments++;
      }
    }

    /*
     * =====================================================
     * ELIMINAR RELACIONES QUE YA NO ESTÁN EN EL EXCEL
     * =====================================================
     */

    const zoneIds = [
      ...desiredZones,
    ];

    const haciendaIds = [
      ...desiredHaciendas,
    ];

    const suerteIds = [
      ...desiredSuertes,
    ];

    /*
     * ZONAS
     */

    if (zoneIds.length > 0) {
      const placeholders =
        zoneIds
          .map(() => "?")
          .join(",");

      db.prepare(
        `
        DELETE FROM usuario_zonas
        WHERE usuario_id = ?
          AND zona_id NOT IN (
            ${placeholders}
          )
        `
      ).run(
        usuario.id,
        ...zoneIds
      );
    } else {
      db.prepare(
        `
        DELETE FROM usuario_zonas
        WHERE usuario_id = ?
        `
      ).run(
        usuario.id
      );
    }

    /*
     * HACIENDAS
     */

    if (haciendaIds.length > 0) {
      const placeholders =
        haciendaIds
          .map(() => "?")
          .join(",");

      db.prepare(
        `
        DELETE FROM usuario_haciendas
        WHERE usuario_id = ?
          AND hacienda_id NOT IN (
            ${placeholders}
          )
        `
      ).run(
        usuario.id,
        ...haciendaIds
      );
    } else {
      db.prepare(
        `
        DELETE FROM usuario_haciendas
        WHERE usuario_id = ?
        `
      ).run(
        usuario.id
      );
    }

    /*
     * SUERTES
     */

    if (suerteIds.length > 0) {
      const placeholders =
        suerteIds
          .map(() => "?")
          .join(",");

      db.prepare(
        `
        DELETE FROM usuario_suertes
        WHERE usuario_id = ?
          AND suerte_id NOT IN (
            ${placeholders}
          )
        `
      ).run(
        usuario.id,
        ...suerteIds
      );
    } else {
      db.prepare(
        `
        DELETE FROM usuario_suertes
        WHERE usuario_id = ?
        `
      ).run(
        usuario.id
      );
    }
  }
});

/*
 * Ejecutar transacción
 */

sync();

/* RESULTADO */

console.log("");
console.log("======================================");
console.log("SINCRONIZACIÓN COMPLETADA");
console.log("======================================");

console.log(
  `Filas procesadas: ${normalizedRows.length}`
);

console.log(
  `Filas ignoradas: ${rowsIgnored}`
);

console.log(
  `Mayordomos únicos: ${mayordomos.size}`
);

console.log(
  `Usuarios nuevos: ${usersCreated}`
);

console.log(
  `Usuarios existentes: ${usersExisting}`
);

console.log(
  `Zonas nuevas: ${zonesCreated}`
);

console.log(
  `Haciendas nuevas: ${haciendasCreated}`
);

console.log(
  `Suertes nuevas: ${suertesCreated}`
);

console.log(
  `Nuevas asignaciones de zonas: ${zoneAssignments}`
);

console.log(
  `Nuevas asignaciones de haciendas: ${haciendaAssignments}`
);

console.log(
  `Nuevas asignaciones de suertes: ${suerteAssignments}`
);

console.log("");
console.log(
  "Base de datos sincronizada correctamente."
);

console.log("======================================");