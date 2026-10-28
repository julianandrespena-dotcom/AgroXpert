import sql from "mssql";
import { getFabricPool } from "../database/fabric.js";

/*
 * ALCANCE AGRÍCOLA DEL USUARIO
 *
 * Replica exactamente las reglas de permisos de dashboardController.js
 * para que todos los dashboards (D1…D5) vean las mismas suertes:
 *
 *  - Usuarios de prueba (auth.js): por acceso_global o zonasPermitidas.
 *  - Usuarios reales: asignaciones en Fabric (Usuario_Suerte,
 *    Usuario_Hacienda, Usuario_Zona), solo zonas/haciendas/suertes activas.
 *
 * Devuelve la lista de códigos SIA (codsia) autorizados, sin duplicados.
 */

const BASE_SUERTES_ACTIVAS = `
  SELECT DISTINCT s.codigo_sia AS codigo
  FROM dbo.Suertes s
  INNER JOIN dbo.Haciendas h
    ON h.id = s.hacienda_id
  INNER JOIN dbo.Zonas z
    ON z.id = h.zona_id
  WHERE s.activa = 1
    AND h.activa = 1
    AND z.activa = 1
`;

function limpiarCodigos(recordset) {
  return [
    ...new Set(
      (recordset ?? [])
        .map((registro) => String(registro.codigo ?? "").trim())
        .filter(Boolean),
    ),
  ];
}

export async function obtenerCodigosAutorizados(user) {
  const usuarioId = Number(user?.id);
  const permisosPool = await getFabricPool();

  if (user?.esUsuarioPrueba === true) {
    if (user?.acceso_global === true) {
      const resultado = await permisosPool.request().query(BASE_SUERTES_ACTIVAS);
      return { global: true, codigos: limpiarCodigos(resultado.recordset) };
    }

    const zonasPermitidas = [
      ...new Set(
        (Array.isArray(user?.zonasPermitidas) ? user.zonasPermitidas : [])
          .map(Number)
          .filter((zonaId) => Number.isInteger(zonaId) && zonaId > 0),
      ),
    ];

    if (zonasPermitidas.length === 0) {
      return { global: false, codigos: [] };
    }

    const request = permisosPool.request();
    const parametros = zonasPermitidas.map((zonaId, index) => {
      const nombre = `zona${index}`;
      request.input(nombre, sql.Int, zonaId);
      return `@${nombre}`;
    });

    const resultado = await request.query(`
      ${BASE_SUERTES_ACTIVAS}
        AND z.id IN (${parametros.join(", ")})
    `);

    return { global: false, codigos: limpiarCodigos(resultado.recordset) };
  }

  const resultado = await permisosPool
    .request()
    .input("usuarioId", sql.Int, usuarioId).query(`
      ${BASE_SUERTES_ACTIVAS}
        AND (
          EXISTS (
            SELECT 1
            FROM dbo.Usuario_Suerte us
            WHERE us.usuario_id = @usuarioId
              AND us.suerte_id = s.id
          )
          OR EXISTS (
            SELECT 1
            FROM dbo.Usuario_Hacienda uh
            WHERE uh.usuario_id = @usuarioId
              AND uh.hacienda_id = h.id
          )
          OR EXISTS (
            SELECT 1
            FROM dbo.Usuario_Zona uz
            WHERE uz.usuario_id = @usuarioId
              AND uz.zona_id = z.id
          )
        )
    `);

  return { global: false, codigos: limpiarCodigos(resultado.recordset) };
}
