import { getSessionUser } from "../services/sessionService.js";

export function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.agroxpert_session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No autenticado.",
      });
    }

    const user = getSessionUser(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "La sesión no es válida o ha expirado.",
      });
    }

    req.user = user;

    next();

  } catch (error) {
    console.error(
      "Error verificando sesión:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error verificando la sesión.",
    });
  }
}