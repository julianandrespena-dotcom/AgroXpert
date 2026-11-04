import sql from "mssql";
import { getFabricPool } from "../database/fabric.js";

export async function registrarEvento({
  actorUsuarioId = null,
  actorUsuario = null,
  usuarioAfectadoId = null,
  usuarioAfectado = null,
  categoria,
  evento,
  modulo = null,
  descripcion = null,
  resultado = "EXITOSO",
  motivo = null,
  ip = null,
  metodo = null,
  ruta = null,
  datosAnteriores = null,
  datosNuevos = null,
  transaction = null,
}) {
  const request = transaction
    ? new sql.Request(transaction)
    : (await getFabricPool()).request();

  request
    .input("actorUsuarioId", sql.NVarChar(64), actorUsuarioId)
    .input("actorUsuario", sql.NVarChar(256), actorUsuario)
    .input("usuarioAfectadoId", sql.NVarChar(64), usuarioAfectadoId)
    .input("usuarioAfectado", sql.NVarChar(256), usuarioAfectado)
    .input("categoria", sql.NVarChar(50), categoria)
    .input("evento", sql.NVarChar(100), evento)
    .input("modulo", sql.NVarChar(100), modulo)
    .input("descripcion", sql.NVarChar(1000), descripcion)
    .input("resultado", sql.NVarChar(30), resultado)
    .input("motivo", sql.NVarChar(500), motivo)
    .input("ip", sql.NVarChar(45), ip)
    .input("metodo", sql.NVarChar(10), metodo)
    .input("ruta", sql.NVarChar(500), ruta)
    .input(
      "datosAnteriores",
      sql.NVarChar(sql.MAX),
      datosAnteriores ? JSON.stringify(datosAnteriores) : null
    )
    .input(
      "datosNuevos",
      sql.NVarChar(sql.MAX),
      datosNuevos ? JSON.stringify(datosNuevos) : null
    );

  await request.query(`
    INSERT INTO dbo.Bitacora (
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
      datos_nuevos
    )
    VALUES (
      @actorUsuarioId,
      @actorUsuario,
      @usuarioAfectadoId,
      @usuarioAfectado,
      @categoria,
      @evento,
      @modulo,
      @descripcion,
      @resultado,
      @motivo,
      @ip,
      @metodo,
      @ruta,
      @datosAnteriores,
      @datosNuevos
    )
  `);
}
