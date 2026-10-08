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
  const {
    login,
  } = useApp();

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

  const [loading, setLoading] =
    useState(false);


  // LOGIN

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const normalizedUsername =
      username.trim().toLowerCase();

    const result = await login(
      normalizedUsername,
      password
    );

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
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
            Sistema experto basado en inteligencia
            artificial para la gestión agronómica
            de la caña de azúcar. Un solo lugar
            para producción, clima, suelo, labores
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
                disabled={loading}
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
                  disabled={loading}
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
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
                  disabled={loading}
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
                disabled={loading}
              >
                ¿Olvidaste tu acceso?
              </button>

            </div>


            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "Ingresando..."
                : "Ingresar"}
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

        </div>

      </section>

    </div>
  );
}
