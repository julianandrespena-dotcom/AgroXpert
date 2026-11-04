
import sql from "mssql";
import { getFabricPool } from "../database/fabric.js";
import { getFabricAgricolaPool } from "../database/fabricAgricola.js";

export async function getDashboardData(req, res) {
  try {
    const usuarioId = Number(req.user?.id);
    const esUsuarioPrueba = req.user?.esUsuarioPrueba === true;
    const rol = String(req.user?.rol ?? "").toLowerCase();

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(401).json({
        mensaje: "No se pudo identificar al usuario autenticado.",
      });
    }

    // Los mayordomos no tienen acceso al dashboard por ahora.
    if (rol === "mayordomo") {
      return res.status(403).json({
        mensaje: "Tu rol no tiene acceso al dashboard agrícola.",
      });
    }

    const permisosPool = await getFabricPool();
    let codigos = [];

    /*
     * USUARIOS TEMPORALES DE PRUEBA
     *
     * Estas cuentas se definen en auth.js y no se crean en Fabric.
     * Sus permisos se determinan mediante las zonas incluidas en
     * req.user.zonasPermitidas.
     */
    if (esUsuarioPrueba) {
      const accesoGlobal = req.user?.acceso_global === true;

      if (accesoGlobal) {
        // Gerente de prueba: consultar todas las suertes activas.
        const resultado = await permisosPool.request().query(`
          SELECT DISTINCT s.codigo_sia AS codigo
          FROM dbo.Suertes s
          INNER JOIN dbo.Haciendas h
            ON h.id = s.hacienda_id
          INNER JOIN dbo.Zonas z
            ON z.id = h.zona_id
          WHERE s.activa = 1
            AND h.activa = 1
            AND z.activa = 1
        `);

        codigos = resultado.recordset
          .map((registro) => String(registro.codigo ?? "").trim())
          .filter(Boolean);
      } else {
        const zonasPermitidas = [
          ...new Set(
            (Array.isArray(req.user?.zonasPermitidas)
              ? req.user.zonasPermitidas
              : []
            )
              .map(Number)
              .filter(
                (zonaId) =>
                  Number.isInteger(zonaId) && zonaId > 0
              )
          ),
        ];

        // Si el usuario de prueba no tiene zonas válidas,
        // no se le devuelve información agrícola.
        if (zonasPermitidas.length > 0) {
          const request = permisosPool.request();

          const parametrosZonas = zonasPermitidas.map(
            (zonaId, index) => {
              const nombre = `zona${index}`;
              request.input(nombre, sql.Int, zonaId);
              return `@${nombre}`;
            }
          );

          const resultado = await request.query(`
            SELECT DISTINCT s.codigo_sia AS codigo
            FROM dbo.Suertes s
            INNER JOIN dbo.Haciendas h
              ON h.id = s.hacienda_id
            INNER JOIN dbo.Zonas z
              ON z.id = h.zona_id
            WHERE s.activa = 1
              AND h.activa = 1
              AND z.activa = 1
              AND z.id IN (${parametrosZonas.join(", ")})
          `);

          codigos = resultado.recordset
            .map((registro) => String(registro.codigo ?? "").trim())
            .filter(Boolean);
        }
      }
    } else {
      /*
       * USUARIOS REALES
       *
       * Se conservan las asignaciones registradas en Fabric:
       * suerte, hacienda o zona.
       */
      const permisosResult = await permisosPool
        .request()
        .input("usuarioId", sql.Int, usuarioId)
        .query(`
          SELECT DISTINCT s.codigo_sia AS codigo
          FROM dbo.Suertes s
          INNER JOIN dbo.Haciendas h
            ON h.id = s.hacienda_id
          INNER JOIN dbo.Zonas z
            ON z.id = h.zona_id
          WHERE s.activa = 1
            AND h.activa = 1
            AND z.activa = 1
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

      codigos = permisosResult.recordset
        .map((registro) => String(registro.codigo ?? "").trim())
        .filter(Boolean);
    }

    // Eliminar códigos vacíos y duplicados.
    codigos = [...new Set(codigos)];

    // Sin asignaciones válidas, devolver resultados vacíos.
    if (codigos.length === 0) {
      return res.json({
        indicadores: {
          tchPromedio: null,
          tchMensual: null,
          totalSuertes: 0,
        },
        filtros: {
          zonas: [],
          haciendas: [],
          suertes: [],
        },
        registros: [],
      });
    }

    // Consultar únicamente los códigos de suerte autorizados.
    const agricolaPool = await getFabricAgricolaPool();
    const requestAgricola = agricolaPool.request();

    const parametrosCodigos = codigos.map((codigo, index) => {
      const nombre = `codigo${index}`;
      requestAgricola.input(nombre, sql.VarChar(50), codigo);
      return `@${nombre}`;
    });

    const datosResult = await requestAgricola.query(`
      SELECT *
      FROM dbo.modelo_de_datos_v2
      WHERE LTRIM(RTRIM(CAST(codsia AS VARCHAR(50))))
        IN (${parametrosCodigos.join(", ")})
    `);

    const registros = datosResult.recordset;

    const zonas = [
      ...new Set(
        registros
          .map((registro) => registro.Zona)
          .filter(
            (zona) =>
              zona != null && String(zona).trim() !== ""
          )
      ),
    ];

    const haciendas = [
      ...new Set(
        registros
          .map((registro) => String(registro.Hacienda ?? "").trim())
          .filter(Boolean)
      ),
    ];

    const suertes = [
      ...new Set(
        registros
          .map((registro) => String(registro.codsia ?? "").trim())
          .filter(Boolean)
      ),
    ];

    const aNumero = (valor) => {
      if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : null;
      }

      if (valor == null || String(valor).trim() === "") {
        return null;
      }

      const numero = Number(
        String(valor).trim().replace(",", ".")
      );

      return Number.isFinite(numero) ? numero : null;
    };

    const promedio = (valores) => {
      const validos = valores
        .map(aNumero)
        .filter((numero) => numero !== null);

      if (validos.length === 0) {
        return null;
      }

      return (
        validos.reduce((suma, numero) => suma + numero, 0) /
        validos.length
      );
    };

    return res.json({
      indicadores: {
        tchPromedio: promedio(
          registros.map((registro) => registro.TCH)
        ),
        tchMensual: promedio(
          registros.map((registro) => registro.tchm)
        ),
        totalSuertes: suertes.length,
      },
      filtros: {
        zonas: zonas.sort(),
        haciendas: haciendas.sort(),
        suertes: suertes.sort(),
      },
      registros,
    });
  } catch (error) {
    console.error(
      "Error cargando el dashboard agrícola:",
      error
    );

    return res.status(500).json({
      mensaje: "No fue posible cargar los datos del dashboard.",
    });
  }
}
