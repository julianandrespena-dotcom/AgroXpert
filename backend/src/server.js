import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import usersRoutes from "./routes/users.js";
import accessRoutes from "./routes/access.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS para permitir las peticiones del frontend.
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Middlewares.
app.use(express.json());
app.use(cookieParser());

// Ruta de comprobación del backend.
app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend de AgroXpert funcionando correctamente",
  });
});

// Rutas de la API.
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/dashboard", dashboardRoutes);

export default app;

// Inicia el servidor únicamente cuando se ejecuta directamente.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  app.listen(PORT, () => {
    console.log(`Backend ejecutándose en http://localhost:${PORT}`);
  });
}