import {
  Bot,
  Send,
  Sparkles,
  User,
} from "lucide-react";

export default function Chatbot() {
  return (
    <div className="page-container chatbot-page">

      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            INTELIGENCIA ARTIFICIAL
          </span>

          <h1>
            Chatbot IA
          </h1>

          <p>
            Consulta información agrícola y recibe
            asistencia para la toma de decisiones.
          </p>
        </div>
      </div>

      <div className="chatbot-container">

        <div className="chatbot-header">

          <div className="chatbot-avatar">
            <Bot size={22} />
          </div>

          <div>
            <strong>
              AgroXpert IA
            </strong>

            <span>
              Asistente agrícola
            </span>
          </div>

          <span className="chatbot-status">
            En línea
          </span>

        </div>

        <div className="chat-messages">

          <div className="chat-message bot">

            <div className="message-avatar">
              <Bot size={16} />
            </div>

            <div className="message-bubble">
              <strong>
                AgroXpert IA
              </strong>

              <p>
                Hola. Soy el asistente inteligente
                de AgroXpert. Puedo ayudarte a
                consultar información de la operación.
              </p>
            </div>

          </div>

          <div className="suggested-questions">

            <span>
              Puedes preguntar:
            </span>

            <button>
              ¿Qué actividades tengo pendientes?
            </button>

            <button>
              ¿Cuál es el estado de la operación?
            </button>

            <button>
              Consulta información de una suerte
            </button>

          </div>

          <div className="chat-message user">

            <div className="message-bubble">
              <p>
                ¿Qué actividades están pendientes
                para hoy?
              </p>
            </div>

            <div className="message-avatar user">
              <User size={16} />
            </div>

          </div>

        </div>

        <div className="chat-input-area">

          <div className="chat-input">

            <input
              type="text"
              placeholder="Escribe tu consulta..."
            />

            <button>
              <Send size={18} />
            </button>

          </div>

          <small>
            <Sparkles size={12} />
            AgroXpert IA puede ayudarte con
            información agrícola.
          </small>

        </div>

      </div>

    </div>
  );
}