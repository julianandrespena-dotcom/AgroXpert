
import sql from "mssql";
import { getFabricPool } from "../database/fabric.js";

function obtenerEnteroPositivo(valor, defecto) {
  const numero = Number(valor);

  return Number.isInteger(numero) && numero > 0
    ? numero
    : defecto;
}

function validarFecha(valor) {
  if (!valor) return null;

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export async function getBitacora(req, res) {
  try {
    const pool = await getFabricPool();

    const pagina = obtenerEnteroPositivo(req.query.pagina, 1);
    const limiteSolicitado = obtenerEnteroPositivo(
      req.query.limite,
      25
    );
    const limite = Math.min(limiteSolicitado, 100);
    const desplazamiento = (pagina - 1) * limite;

    const busqueda = String(req.query.busqueda || "").trim();
    const categoria = String(req.query.categoria || "").trim();
    const evento = String(req.query.evento || "").trim();
    const resultado = String(req.query.resultado || "").trim();

    const fechaDesde = validarFecha(req.query.fechaDesde);
    const fechaHasta = validarFecha(req.query.fechaHasta);

    if (req.query.fechaDesde && !fechaDesde) {
      return res.status(400).json({
        mensaje: "La fecha inicial no es válida.",
      });
    }

    if (req.query.fechaHasta && !fechaHasta) {
      return res.status(400).json({
        mensaje: "La fecha final no es válida.",
      });
    }

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      return res.status(400).json({
        mensaje: "La fecha inicial no puede ser posterior a la fecha final.",
      });
    }

    const request = pool.request();

    request.input("busqueda", sql.NVarChar(256), busqueda || null);
    request.input("categoria", sql.NVarChar(50), categoria || null);
    request.input("evento", sql.NVarChar(100), evento || null);
    request.input("resultado", sql.NVarChar(30), resultado || null);
    request.input("fechaDesde", sql.DateTime2, fechaDesde);
    request.input("fechaHasta", sql.DateTime2, fechaHasta);
    request.input("desplazamiento", sql.Int, desplazamiento);
    request.input("limite", sql.Int, limite);

    const filtros = `
      WHERE
        (@busqueda IS NULL OR
          actor_usuario LIKE '%' + @busqueda + '%' OR
          usuario_afectado LIKE '%' + @busqueda + '%' OR
          descripcion LIKE '%' + @busqueda + '%' OR
          evento LIKE '%' + @busqueda + '%')
        AND (@categoria IS NULL OR categoria = @categoria)
        AND (@evento IS NULL OR evento = @evento)
        AND (@resultado IS NULL OR resultado = @resultado)
        AND (@fechaDesde IS NULL OR fecha_hora_utc >= @fechaDesde)
        AND (@fechaHasta IS NULL OR fecha_hora_utc < DATEADD(DAY, 1, @fechaHasta))
    `;

    const resultadoConsulta = await request.query(`
      SELECT
        id,
        actor_usuario_id,
        actor_usuario,
        usuario_afectado_id,
        usuario_afectado,
        categoria,
        evento,
        modulo,
        descripcion,
        resultado,
        motivo,
        ip,
        metodo,
        ruta,
        datos_anteriores,
        datos_nuevos,
        fecha_hora_utc
      FROM dbo.Bitacora
      ${filtros}
      ORDER BY fecha_hora_utc DESC, id DESC
      OFFSET @desplazamiento ROWS
      FETCH NEXT @limite ROWS ONLY;

      SELECT COUNT_BIG(*) AS total
      FROM dbo.Bitacora
      ${filtros};
    `);

    const registros = resultadoConsulta.recordsets[0];
    const total = Number(resultadoConsulta.recordsets[1][0].total);

    return res.json({
      registros,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error consultando bitácora:", error);

    return res.status(500).json({
      mensaje: "No fue posible consultar la bitácora.",
    });
  }
}
