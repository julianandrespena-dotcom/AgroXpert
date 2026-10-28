import "dotenv/config";
import { getFabricAgricolaPool } from "../src/database/fabricAgricola.js";
import { obtenerEsquemaAgricola } from "../src/services/esquemaAgricolaService.js";

/*
 * Verifica qué tablas y columnas de Fabric agrícola usará el Dashboard 1.
 * Uso: node scripts/inspeccionar-esquema-agricola.mjs
 */

let pool;

try {
  pool = await getFabricAgricolaPool();

  const tablas = await pool.request().query(`
    SELECT t.TABLE_NAME, COUNT(c.COLUMN_NAME) AS Columnas
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN INFORMATION_SCHEMA.COLUMNS c
      ON c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
    WHERE t.TABLE_SCHEMA = 'dbo'
    GROUP BY t.TABLE_NAME
    ORDER BY t.TABLE_NAME;
  `);

  console.log("Tablas disponibles en Fabric agrícola:");
  console.table(tablas.recordset);

  const esquema = await obtenerEsquemaAgricola({ forzar: true });

  console.log(`\nTabla de producción: dbo.${esquema.produccion.tabla}`);
  console.table(
    Object.entries(esquema.produccion.columnas).map(([concepto, col]) => ({
      Concepto: concepto,
      Columna: col?.nombre ?? "(no encontrada)",
      Tipo: col?.tipo ?? "",
    })),
  );

  if (esquema.labores) {
    console.log(`\nTabla de labores: dbo.${esquema.labores.tabla}`);
    console.table(
      Object.entries(esquema.labores.columnas).map(([concepto, col]) => ({
        Concepto: concepto,
        Columna: col?.nombre ?? "(no encontrada)",
        Tipo: col?.tipo ?? "",
      })),
    );
  } else {
    console.log(
      "\nNo se encontró tabla de labores. Defina FABRIC_AGRICOLA_TABLA_LABORES en backend/.env para activar el filtro Labor.",
    );
  }
} catch (error) {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
} finally {
  if (pool) await pool.close();
}
