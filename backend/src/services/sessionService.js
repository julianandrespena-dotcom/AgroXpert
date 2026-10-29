
import crypto from "crypto";

const SESSION_DURATION_HOURS = 8;
const sessions = new Map();

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000
  );

  sessions.set(tokenHash, {
    user,
    expiresAt,
  });

  return { token, expiresAt };
}

export function getSessionUser(token) {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = sessions.get(tokenHash);

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    sessions.delete(tokenHash);
    return null;
  }

  if (!session.user.activo) return null;

  return session.user;
}

export function deleteSession(token) {
  if (!token) return;

  sessions.delete(hashToken(token));
}
