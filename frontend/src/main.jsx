import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { AppProvider } from "./context/AppContext";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/login.css";
import "./styles/dashboard.css";
import "./styles/admin.css";

ReactDOM.createRoot(
document.getElementById("root")
).render(
<React.StrictMode> <AppProvider> <App /> </AppProvider>
</React.StrictMode>
);
