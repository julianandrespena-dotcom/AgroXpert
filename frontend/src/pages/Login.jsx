import { useState } from "react";

import {
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Check,
  AlertCircle,
} from "lucide-react";

import { useApp } from "../context/AppContext";

export default function Login() {
  const { login } = useApp();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [remember, setRemember] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    const result = login(
      username.trim().toLowerCase(),
      password
    );

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">

      {/* PANEL IZQUIERDO */}

      <section className="login-hero">

        <div className="login-brand">

          <div className="brand-mark large">
            in
          </div>

          <div>
            <div className="login-brand-name">
              AgroXpert
            </div>

          </div>

        </div>

        <div className="login-hero-content">

          <span className="login-eyebrow">
            INTELIGENCIA PARA EL CAMPO
          </span>


        <h1>
          Queremos ser{" "}
          <span className="login-highlight">
            la energía
          </span>{" "}
          que impulsa tu campo.
        </h1>

          <p>
            Sistema experto basado en inteligencia artificial 
            para la gestión agronómica de la caña de azúcar. 
            Un solo lugar para producción, clima, suelo, labores 
            y recomendaciones IA.
          </p>

          <div className="login-tags">
            <span>
              Recomendaciones IA
            </span>

            <span>
              Consulta por voz
            </span>

            <span>
              Modo offline
            </span>
          </div>

        </div>

        <div className="login-footer">
          Incauca S.A. · Valle del Cauca
          <br />
          Acceso restringido a personal autorizado
        </div>

      </section>

      {/* PANEL LOGIN */}

      <section className="login-panel">

        <div className="login-form-wrapper">

          <div className="login-mobile-logo">

            <div className="brand-mark large">
              in
            </div>

            <div>
              <strong>
                AgroXpert
              </strong>

              <span>
                INCAUCA
              </span>
            </div>

          </div>

          <div className="login-heading">

            <span className="login-heading-label">
              BIENVENIDO
            </span>

            <h2>
              Iniciar sesión
            </h2>

            <p>
              Autenticación corporativa Incauca
            </p>

          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={17} />

              <span>
                {error}
              </span>
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <label>
              Usuario corporativo

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Ingresa tu usuario"
              />
            </label>

            <label>
              Contraseña

              <div className="password-input">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Ingresa tu contraseña"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
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
                  className={`custom-checkbox ${
                    remember
                      ? "checked"
                      : ""
                  }`}
                  onClick={() =>
                    setRemember(!remember)
                  }
                >
                  {remember && (
                    <Check size={13} />
                  )}
                </button>

                <span>
                  Recordar dispositivo
                </span>

              </label>

              <button
                type="button"
                className="forgot-button"
              >
                ¿Olvidaste tu acceso?
              </button>

            </div>

            <button
              type="submit"
              className="login-submit"
            >
              Ingresar
            </button>

          </form>

          <div className="login-divider">
          </div>

          <div className="login-alternatives">

            <button type="button">
              <Fingerprint size={20} />
              Ingreso Biométrico
            </button>

            <button type="button">
              <KeyRound size={19} />
              SSO corporativo
            </button>

          </div>

          {/* USUARIOS DE PRUEBA */}

          <div className="test-users">

            <div className="test-users-title">
              Usuarios de prueba
            </div>

            <div className="test-users-list">

              <button
                type="button"
                onClick={() => {
                  setUsername("gerente");
                  setPassword("1234");
                }}
              >
                <strong>
                  Gerente
                </strong>

                <span>
                  Carlos Córdoba
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("director");
                  setPassword("1234");
                }}
              >
                <strong>
                  Director
                </strong>

                <span>
                  Jaime Marín
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("supervisor");
                  setPassword("1234");
                }}
              >
                <strong>
                  Supervisor
                </strong>

                <span>
                  Héctor Zambrano
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("mayordomo");
                  setPassword("1234");
                }}
              >
                <strong>
                  Mayordomo
                </strong>

                <span>
                  Carlos Maya
                </span>
              </button>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}