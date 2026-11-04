import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import usersRoutes from "./routes/users.js";
import accessRoutes from "./routes/access.js";
import dashboardRoutes from "./routes/dashboard.js";
import bitacoraRoutes from "./routes/bitacora.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

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
app.use("/api/bitacora", bitacoraRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Backend ejecutándose en http://localhost:${PORT}`);
});