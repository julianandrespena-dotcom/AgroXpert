
import { getSessionUser } from "../services/sessionService.js";
import { registrarEvento } from "../services/bitacoraService.js";

async function registrarAccesoDenegado(req, motivo) {
  try {
    await registrarEvento({
      actorUsuarioId: null,
      actorUsuario: null,
      categoria: "AUTORIZACION",
      evento: "ACCESS_DENIED",
      modulo: "AUTENTICACION",
      descripcion: "Intento de acceso sin una sesión válida.",
      resultado: "DENEGADO",
      motivo,
      ip: req.ip,
      metodo: req.method,
      ruta: req.originalUrl,
    });
  } catch (error) {
    console.error("Error registrando acceso denegado:", error);
  }
}

export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.agroxpert_session;

    if (!token) {
      await registrarAccesoDenegado(req, "NO_SESSION_TOKEN");

      return res.status(401).json({
        success: false,
        message: "No autenticado.",
      });
    }

    const user = getSessionUser(token);

    if (!user) {
      await registrarAccesoDenegado(req, "SESSION_INVALID_OR_EXPIRED");

      return res.status(401).json({
        success: false,
        message: "La sesión no es válida o ha expirado.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Error verificando sesión:", error);

    return res.status(500).json({
      success: false,
      message: "Error verificando la sesión.",
    });
  }
}
