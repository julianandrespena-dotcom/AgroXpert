import bcrypt from "bcrypt";
import dotenv from "dotenv";
import db from "./database.js";

dotenv.config();

const usuarios = [
  {
    usuario: "admin",
    password: process.env.ADMIN_PASSWORD,
    nombre: "Administrador AgroXpert",
    cargo: "Administrador",
    rol: "administrador",
    zonas: [],
    haciendas: [],
  },

  {
    usuario: "gerente",
    password: "1234",
    nombre: "Carlos Córdoba",
    cargo: "Gerente",
    rol: "gerente",
    zonas: ["Ingenio completo"],
    haciendas: [],
  },

  {
    usuario: "director",
    password: "1234",
    nombre: "Jaime Marín",
    cargo: "Director",
    rol: "director",
    zonas: ["Zona Central Incauca"],
    haciendas: [],
  },

  {
    usuario: "supervisor",
    password: "1234",
    nombre: "Héctor Zambrano",
    cargo: "Supervisor",
    rol: "supervisor",
    zonas: ["Zona Central Incauca"],
    haciendas: [],
  },

  {
    usuario: "carlos",
    password: "Carlos123*",
    nombre: "Carlos Maya",
    cargo: "Mayordomo",
    rol: "mayordomo",
    zonas: [],
    haciendas: ["Hda. San Fernando Norte"],
  },

  {
    usuario: "pedro",
    password: "Pedro123*",
    nombre: "Pedro López",
    cargo: "Mayordomo",
    rol: "mayordomo",
    zonas: [],
    haciendas: ["Hda. El Bolo"],
  },

  {
    usuario: "juan",
    password: "Juan123*",
    nombre: "Juan Pérez",
    cargo: "Mayordomo",
    rol: "mayordomo",
    zonas: [],
    haciendas: ["Hda. La Esperanza"],
  },

  {
    usuario: "miguel",
    password: "Miguel123*",
    nombre: "Miguel Rodríguez",
    cargo: "Mayordomo",
    rol: "mayordomo",
    zonas: [],
    haciendas: ["Hda. San Carlos"],
  },

  {
    usuario: "andres",
    password: "Andres123*",
    nombre: "Andrés Gómez",
    cargo: "Mayordomo",
    rol: "mayordomo",
    zonas: [],
    haciendas: ["Hda. El Porvenir"],
  },

  {
    usuario: "pablo",
    password: "Pablo123*",
    nombre: "Pablo Perez",
    cargo: "Mayordomo",
    rol: "mayordomo",
    zonas: [],
    haciendas: ["Hda. El Porvenir"],
  },
];

/* Validar contraseña del administrador */

if (!process.env.ADMIN_PASSWORD) {
  throw new Error(
    "No se encontró ADMIN_PASSWORD en el archivo .env."
  );
}

/* Generar los hashes de contraseña */

for (const usuario of usuarios) {
  usuario.passwordHash = await bcrypt.hash(
    usuario.password,
    10
  );
}

/* Preparar consultas */

const obtenerUsuario = db.prepare(`
  SELECT id
  FROM usuarios
  WHERE usuario = ?
`);

const crearUsuario = db.prepare(`
  INSERT INTO usuarios (
    usuario,
    password_hash,
    nombre,
    cargo,
    rol,
    zona
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);

const actualizarUsuario = db.prepare(`
  UPDATE usuarios
  SET
    password_hash = ?,
    nombre = ?,
    cargo = ?,
    rol = ?,
    zona = ?
  WHERE usuario = ?
`);

const crearZona = db.prepare(`
  INSERT OR IGNORE INTO zonas (
    nombre
  )
  VALUES (?)
`);

const obtenerZona = db.prepare(`
  SELECT id
  FROM zonas
  WHERE nombre = ?
`);

const crearHacienda = db.prepare(`
  INSERT OR IGNORE INTO haciendas (
    nombre
  )
  VALUES (?)
`);

const obtenerHacienda = db.prepare(`
  SELECT id
  FROM haciendas
  WHERE nombre = ?
`);

const eliminarZonasUsuario = db.prepare(`
  DELETE FROM usuario_zonas
  WHERE usuario_id = ?
`);

const eliminarHaciendasUsuario = db.prepare(`
  DELETE FROM usuario_haciendas
  WHERE usuario_id = ?
`);

const asignarZona = db.prepare(`
  INSERT OR IGNORE INTO usuario_zonas (
    usuario_id,
    zona_id
  )
  VALUES (?, ?)
`);

const asignarHacienda = db.prepare(`
  INSERT OR IGNORE INTO usuario_haciendas (
    usuario_id,
    hacienda_id
  )
  VALUES (?, ?)
`);

/* Transacción SQLite */

const procesarUsuarios = db.transaction(
  (usuariosPreparados) => {
    for (const usuario of usuariosPreparados) {
      const usuarioExistente =
        obtenerUsuario.get(
          usuario.usuario
        );

      let usuarioId;

      if (usuarioExistente) {
        actualizarUsuario.run(
          usuario.passwordHash,
          usuario.nombre,
          usuario.cargo,
          usuario.rol,
          null,
          usuario.usuario
        );

        usuarioId = usuarioExistente.id;

        console.log(
          `✓ Usuario actualizado: ${usuario.usuario}`
        );
      } else {
        const resultado =
          crearUsuario.run(
            usuario.usuario,
            usuario.passwordHash,
            usuario.nombre,
            usuario.cargo,
            usuario.rol,
            null
          );

        usuarioId =
          resultado.lastInsertRowid;

        console.log(
          `✓ Usuario creado: ${usuario.usuario}`
        );
      }

      /* Limpiar asignaciones anteriores */

      eliminarZonasUsuario.run(
        usuarioId
      );

      eliminarHaciendasUsuario.run(
        usuarioId
      );

      /* Asignar zonas */

      for (const nombreZona of usuario.zonas) {
        crearZona.run(
          nombreZona
        );

        const zona =
          obtenerZona.get(
            nombreZona
          );

        if (!zona) {
          throw new Error(
            `No se pudo obtener la zona "${nombreZona}".`
          );
        }

        asignarZona.run(
          usuarioId,
          zona.id
        );
      }

      /* Asignar haciendas */

      for (
        const nombreHacienda
        of usuario.haciendas
      ) {
        crearHacienda.run(
          nombreHacienda
        );

        const hacienda =
          obtenerHacienda.get(
            nombreHacienda
          );

        if (!hacienda) {
          throw new Error(
            `No se pudo obtener la hacienda "${nombreHacienda}".`
          );
        }

        asignarHacienda.run(
          usuarioId,
          hacienda.id
        );
      }
    }
  }
);

/* Ejecutar */

try {
  procesarUsuarios(
    usuarios
  );

  console.log(
    "\n✓ Proceso de usuarios terminado correctamente."
  );
} catch (error) {
  console.error(
    "\n✗ El proceso de usuarios fue cancelado:"
  );

  console.error(
    error
  );

  process.exitCode = 1;
}