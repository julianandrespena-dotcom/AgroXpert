import React from "react";
import ReactDOM from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";

import App from "./App";
import { AppProvider } from "./context/AppContext";
import { msalInstance } from "./auth/msalConfig";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/login.css";
import "./styles/dashboard.css";
import "./styles/admin.css";

async function startApp() {
  await msalInstance.initialize();

  ReactDOM.createRoot(
    document.getElementById("root")
  ).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <AppProvider>
          <App />
        </AppProvider>
      </MsalProvider>
    </React.StrictMode>
  );
}

startApp().catch((error) => {
  console.error("Error inicializando AgroXpert:", error);
});
