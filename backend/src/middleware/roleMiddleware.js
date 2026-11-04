
import { registrarEvento } from "../services/bitacoraService.js";

async function registrarAccesoDenegado(req, motivo) {
  try {
    await registrarEvento({
      actorUsuarioId: req.user?.id ? String(req.user.id) : null,
      actorUsuario: req.user?.usuario ?? null,
      categoria: "AUTORIZACION",
      evento: "ACCESS_DENIED",
      modulo: "CONTROL_DE_ACCESO",
      descripcion: "Intento de acceso rechazado.",
      resultado: "DENEGADO",
      motivo,
      ip: req.ip,
      metodo: req.method,
      ruta: req.path,
    });
  } catch (error) {
    console.error("Error registrando acceso denegado:", error);
  }
}

export function requireRole(...rolesPermitidos) {
  return async (req, res, next) => {
    if (!req.user) {
      await registrarAccesoDenegado(req, "NO_AUTENTICADO");

      return res.status(401).json({
        success: false,
        message: "No autenticado.",
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      await registrarAccesoDenegado(req, "ROL_NO_AUTORIZADO");

      return res.status(403).json({
        success: false,
        message:
          "No tienes permisos para realizar esta acción.",
      });
    }

    next();
  };
}
