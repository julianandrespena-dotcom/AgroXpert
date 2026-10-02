import crypto from "crypto";

import db from "../database/database.js";

const SESSION_DURATION_HOURS = 8;

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function createSession(usuarioId) {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() +
      SESSION_DURATION_HOURS * 60 * 60 * 1000
  );

  db.prepare(`
    INSERT INTO sesiones (
      usuario_id,
      token_hash,
      expires_at
    )
    VALUES (?, ?, ?)
  `).run(
    usuarioId,
    tokenHash,
    expiresAt.toISOString()
  );

  return {
    token,
    expiresAt,
  };
}

export function getSessionUser(token) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const session = db
    .prepare(`
      SELECT
        sesiones.id AS session_id,
        sesiones.usuario_id,
        sesiones.expires_at,

        usuarios.id,
        usuarios.usuario,
        usuarios.nombre,
        usuarios.cargo,
        usuarios.rol,
        usuarios.zona,
        usuarios.activo

      FROM sesiones

      INNER JOIN usuarios
        ON usuarios.id = sesiones.usuario_id

      WHERE sesiones.token_hash = ?
    `)
    .get(tokenHash);

  if (!session) {
    return null;
  }

  const expiresAt = new Date(
    session.expires_at
  );

  if (expiresAt <= new Date()) {
    db.prepare(`
      DELETE FROM sesiones
      WHERE id = ?
    `).run(session.session_id);

    return null;
  }

  if (!session.activo) {
    return null;
  }

  return {
    id: session.id,
    usuario: session.usuario,
    nombre: session.nombre,
    cargo: session.cargo,
    rol: session.rol,
    zona: session.zona,
  };
}

export function deleteSession(token) {
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);

  db.prepare(`
    DELETE FROM sesiones
    WHERE token_hash = ?
  `).run(tokenHash);
}