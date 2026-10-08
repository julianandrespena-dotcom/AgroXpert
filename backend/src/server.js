import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import usersRoutes from "./routes/users.js";
import accessRoutes from "./routes/access.js";

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
    mensaje:
      "Backend de AgroXpert funcionando correctamente",
  });
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/users",
  usersRoutes
);

app.use(
  "/api/access",
  accessRoutes
);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `Backend ejecutándose en http://localhost:${PORT}`
  );
});