import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { AppProvider } from "./context/AppContext";
import AuthProvider from "./auth/AuthProvider";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/login.css";
import "./styles/dashboard.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>
);
