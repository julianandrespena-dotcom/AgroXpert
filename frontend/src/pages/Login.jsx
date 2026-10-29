
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";

import { useApp } from "../context/AppContext";
import { loginRequest } from "../auth/msalConfig";

export default function Login() {
  const { login } = useApp();
  const { instance } = useMsal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [corporateLoading, setCorporateLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedUsername = username.trim().toLowerCase();
      const result = await login(normalizedUsername, password);

      if (!result.success) {
        setError(result.message);
      }
    } catch {
      setError("No fue posible iniciar sesión. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCorporateLogin = async () => {
    setError("");
    setCorporateLoading(true);

    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Error en el inicio de sesión corporativo:", err);
      setError(
        "No fue posible iniciar sesión con Microsoft. Verifica la configuración corporativa."
      );
      setCorporateLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-brand">
          <div className="brand-mark large">in</div>
          <div>
            <div className="login-brand-name">AgroXpert</div>
          </div>
        </div>

        <div className="login-mobile-logo">
          <div className="brand-mark large">in</div>
          <div>
            <strong>AgroXpert</strong>
            <span>INCAUCA</span>
          </div>
        </div>

        <div className="login-hero-content">
          <span className="login-eyebrow">
            INTELIGENCIA PARA EL CAMPO
          </span>

          <h1>
            Queremos ser{" "}
            <span className="login-highlight">la energía</span>{" "}
            que impulsa tu campo.
          </h1>

          <p>
            Sistema experto basado en inteligencia artificial para la
            gestión agronómica de la caña de azúcar. Un solo lugar para
            producción, clima, suelo, labores y recomendaciones IA.
          </p>

          <div className="login-tags">
            <span>Recomendaciones IA</span>
            <span>Consulta por voz</span>
            <span>Modo offline</span>
          </div>
        </div>

        <div className="login-footer">
          Incauca S.A. · Valle del Cauca
          <br />
          Acceso restringido a personal autorizado
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrapper">
          <div className="login-heading">
            <span className="login-heading-label">AGROXPERT · INCAUCA</span>
            <h2>Iniciar sesión</h2>
            <p>
              Elige cómo ingresar según tengas o no correo corporativo.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className="corporate-login-button"
            onClick={handleCorporateLogin}
            disabled={corporateLoading || loading}
          >
            <svg
              className="microsoft-logo"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path fill="#F25022" d="M1 1h10v10H1z" />
              <path fill="#7FBA00" d="M13 1h10v10H13z" />
              <path fill="#00A4EF" d="M1 13h10v10H1z" />
              <path fill="#FFB900" d="M13 13h10v10H13z" />
            </svg>

            <span className="corporate-button-copy">
              <strong>
                {corporateLoading
                  ? "Conectando con Microsoft..."
                  : "Ingresar con cuenta corporativa"}
              </strong>
              <small>
                Correo @incauca.com · Microsoft Entra ID (inicio de sesión único)
              </small>
            </span>
          </button>

          <div className="login-method-divider">
            <span>o, si no tienes correo corporativo</span>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Usuario de AgroXpert
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ingresa tu usuario"
                disabled={loading || corporateLoading}
                autoComplete="username"
                required
              />
            </label>

            <label>
              Contraseña
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña"
                  disabled={loading || corporateLoading}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="remember-option">
                <button
                  type="button"
                  className={`custom-checkbox ${remember ? "checked" : ""}`}
                  onClick={() => setRemember((value) => !value)}
                  disabled={loading}
                  aria-pressed={remember}
                  aria-label="Recordar usuario"
                >
                  {remember && <Check size={13} />}
                </button>
                <span>Recordar usuario</span>
              </label>

              <button
                type="button"
                className="forgot-button"
                disabled={loading}
                onClick={() =>
                  setError(
                    "Para recuperar tu acceso, comunícate con el administrador de AgroXpert."
                  )
                }
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading || corporateLoading}
            >
              {loading
                ? "Ingresando..."
                : "Ingresar con usuario AgroXpert"}
            </button>
          </form>

          <div className="login-security-note">
            <ShieldCheck size={18} />
            <p>
              Conexión cifrada. Las cuentas corporativas se validan con
              Microsoft Entra ID y las cuentas AgroXpert en el servidor de
              AgroXpert; en ambos casos el servidor carga tu rol y tu ámbito
              de zona y hacienda.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
