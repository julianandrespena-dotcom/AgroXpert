import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
} from "lucide-react";

export default function PowerBIEmbed({
  embedUrl,
  title = "Dashboard Power BI",
  subtitle = "Dashboard",
}) {
  const containerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  /* Detectar cambios de pantalla completa */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === containerRef.current
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  /* Entrar / salir de pantalla completa */
  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error(
        "No se pudo cambiar el modo de pantalla completa:",
        error
      );
    }
  };

  if (!embedUrl) {
    return (
      <div className="powerbi-empty">
        <div className="powerbi-empty-icon">
          📊
        </div>

        <h3>
          Dashboard no configurado
        </h3>
        
      </div>
    );
  }

  return (
    <section
      ref={containerRef}
      className={`powerbi-wrapper ${
        isFullscreen ? "powerbi-fullscreen" : ""
      }`}
    >
      <div className="powerbi-toolbar">

        <div className="powerbi-toolbar-info">
          <span className="powerbi-toolbar-title">
            {title}
          </span>

          <span className="powerbi-toolbar-subtitle">
            {subtitle}
          </span>
        </div>

        <button
          type="button"
          className="powerbi-fullscreen-button"
          onClick={handleFullscreen}
          title={
            isFullscreen
              ? "Salir de pantalla completa"
              : "Ver en pantalla completa"
          }
          aria-label={
            isFullscreen
              ? "Salir de pantalla completa"
              : "Ver dashboard en pantalla completa"
          }
        >
          {isFullscreen ? (
            <Minimize2 size={17} />
          ) : (
            <Maximize2 size={17} />
          )}

          <span>
            {isFullscreen ? "Salir" : "Expandir"}
          </span>
        </button>
      </div>

      <div className="powerbi-container">
        <iframe
          title={subtitle}
          src={embedUrl}
          className="powerbi-iframe"
          allowFullScreen
        />
      </div>
    </section>
  );
}
