import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(
  __dirname,
  "../../data/agroxpert.db"
);

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/* USUARIOS */

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL,
    rol TEXT NOT NULL,
    zona TEXT,
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/* SESIONES */

db.exec(`
  CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE CASCADE
  )
`);

/* ZONAS */

db.exec(`
  CREATE TABLE IF NOT EXISTS zonas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/* UTILIDAD: AGREGAR COLUMNA SI NO EXISTE */

function addColumnIfMissing(
  table,
  column,
  definition
) {
  const columns = db
    .prepare(
      `PRAGMA table_info(${table})`
    )
    .all();

  const exists = columns.some(
    (item) => item.name === column
  );

  if (!exists) {
    db.exec(`
      ALTER TABLE ${table}
      ADD COLUMN ${column} ${definition}
    `);
  }
}

/* CÓDIGO DE ZONAS */

addColumnIfMissing(
  "zonas",
  "codigo",
  "TEXT"
);

/* HACIENDAS */

/*
 * "nombre" NO puede ser UNIQUE porque una misma
 * hacienda puede aparecer en diferentes zonas.
 *
 * La identidad real de una hacienda es:
 *
 *     ZONA + CODIGO DE HACIENDA
 *
 * Ejemplo:
 *
 * Zona 1 + 010005 + LA AVELINA
 * Zona 2 + 020014 + LA AVELINA
 *
 * Son haciendas diferentes.
 */

db.exec(`
  CREATE TABLE IF NOT EXISTS haciendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    zona_id INTEGER,
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (zona_id)
      REFERENCES zonas(id)
      ON DELETE SET NULL
  )
`);

/* CÓDIGO DE HACIENDAS */

addColumnIfMissing(
  "haciendas",
  "codigo",
  "TEXT"
);

/* MIGRACIÓN DE HACIENDAS */

function migrateHaciendasUniqueConstraint() {
  const tableSql = db
    .prepare(
      `
      SELECT sql
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'haciendas'
      `
    )
    .get();

  if (!tableSql?.sql) {
    return;
  }

  const sql = tableSql.sql
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const hasOldUniqueConstraint =
    sql.includes(
      "NOMBRE TEXT NOT NULL UNIQUE"
    );

  if (!hasOldUniqueConstraint) {
    return;
  }

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "MIGRACIÓN DE TABLA HACIENDAS"
  );
  console.log(
    "======================================"
  );

  /*
   * Desactivamos temporalmente las foreign keys
   * porque otras tablas pueden depender de haciendas.
   */

  db.pragma("foreign_keys = OFF");

  try {
    const migrate = db.transaction(() => {
      /*
       * Crear tabla nueva sin UNIQUE en nombre.
       */

      db.exec(`
        CREATE TABLE haciendas_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          zona_id INTEGER,
          activo INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          codigo TEXT,

          FOREIGN KEY (zona_id)
            REFERENCES zonas(id)
            ON DELETE SET NULL
        )
      `);

      /*
       * Copiar todos los datos existentes.
       */

      db.exec(`
        INSERT INTO haciendas_new (
          id,
          nombre,
          zona_id,
          activo,
          created_at,
          codigo
        )
        SELECT
          id,
          nombre,
          zona_id,
          activo,
          created_at,
          codigo
        FROM haciendas
      `);

      /*
       * Eliminar tabla antigua.
       */

      db.exec(`
        DROP TABLE haciendas
      `);

      /*
       * Renombrar tabla nueva.
       */

      db.exec(`
        ALTER TABLE haciendas_new
        RENAME TO haciendas
      `);
    });

    migrate();

    console.log(
      "Tabla haciendas migrada correctamente."
    );
  } finally {
    db.pragma("foreign_keys = ON");
  }

  console.log(
    "======================================"
  );
  console.log("");
}

migrateHaciendasUniqueConstraint();

/* SUERTES */

db.exec(`
  CREATE TABLE IF NOT EXISTS suertes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL,
    hacienda_id INTEGER NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
      codigo,
      hacienda_id
    ),

    FOREIGN KEY (hacienda_id)
      REFERENCES haciendas(id)
      ON DELETE CASCADE
  )
`);

/* USUARIO → ZONAS */

db.exec(`
  CREATE TABLE IF NOT EXISTS usuario_zonas (
    usuario_id INTEGER NOT NULL,
    zona_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
      usuario_id,
      zona_id
    ),

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE CASCADE,

    FOREIGN KEY (zona_id)
      REFERENCES zonas(id)
      ON DELETE CASCADE
  )
`);

/* USUARIO → HACIENDAS */

db.exec(`
  CREATE TABLE IF NOT EXISTS usuario_haciendas (
    usuario_id INTEGER NOT NULL,
    hacienda_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
      usuario_id,
      hacienda_id
    ),

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE CASCADE,

    FOREIGN KEY (hacienda_id)
      REFERENCES haciendas(id)
      ON DELETE CASCADE
  )
`);

/* USUARIO → SUERTES */

db.exec(`
  CREATE TABLE IF NOT EXISTS usuario_suertes (
    usuario_id INTEGER NOT NULL,
    suerte_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
      usuario_id,
      suerte_id
    ),

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE CASCADE,

    FOREIGN KEY (suerte_id)
      REFERENCES suertes(id)
      ON DELETE CASCADE
  )
`);

/* ÍNDICES */

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_zonas_codigo
  ON zonas(codigo)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_haciendas_zona
  ON haciendas(zona_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_haciendas_codigo
  ON haciendas(codigo)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_suertes_hacienda
  ON suertes(hacienda_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usuario_zonas_usuario
  ON usuario_zonas(usuario_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usuario_zonas_zona
  ON usuario_zonas(zona_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usuario_haciendas_usuario
  ON usuario_haciendas(usuario_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usuario_haciendas_hacienda
  ON usuario_haciendas(hacienda_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usuario_suertes_usuario
  ON usuario_suertes(usuario_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usuario_suertes_suerte
  ON usuario_suertes(suerte_id)
`);

/* EXPORTAR DB */

export default db;
