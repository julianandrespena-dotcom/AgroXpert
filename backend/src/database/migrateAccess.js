import db from "./database.js";

console.log(
  "\nIniciando migración de zonas y haciendas...\n"
);

const usuarios = db
  .prepare(`
    SELECT
      id,
      usuario,
      zona
    FROM usuarios
    WHERE zona IS NOT NULL
      AND TRIM(zona) != ''
  `)
  .all();

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
    nombre,
    zona_id
  )
  VALUES (?, ?)
`);

const obtenerHacienda = db.prepare(`
  SELECT id
  FROM haciendas
  WHERE nombre = ?
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

const migrar = db.transaction(() => {
  for (const usuario of usuarios) {
    const nombreUbicacion =
      usuario.zona.trim();

    /*
      Los valores que comienzan con "Hda."
      se consideran haciendas.

      Los demás valores actuales se consideran
      zonas o ámbitos generales.
    */

    if (
      nombreUbicacion
        .toLowerCase()
        .startsWith("hda.")
    ) {
      crearHacienda.run(
        nombreUbicacion,
        null
      );

      const hacienda =
        obtenerHacienda.get(
          nombreUbicacion
        );

      asignarHacienda.run(
        usuario.id,
        hacienda.id
      );

      console.log(
        `✓ ${usuario.usuario} → Hacienda: ${nombreUbicacion}`
      );

    } else {
      crearZona.run(
        nombreUbicacion
      );

      const zona =
        obtenerZona.get(
          nombreUbicacion
        );

      asignarZona.run(
        usuario.id,
        zona.id
      );

      console.log(
        `✓ ${usuario.usuario} → Zona: ${nombreUbicacion}`
      );
    }
  }
});

try {
  migrar();

  console.log(
    "\n✓ Migración completada correctamente."
  );

} catch (error) {
  console.error(
    "\n✗ Error durante la migración:",
    error
  );

  process.exitCode = 1;
}