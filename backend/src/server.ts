// SalesPro CRM Backend Server - Force Restart [2026-05-16T12:35:00]
import "express-async-errors";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// ── Security Middleware ───────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires"],
  })
);

// ── Body Parsing ──────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Request Logger (dev only) ─────────────────
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ── API Routes ────────────────────────────────
app.use("/api", routes);

// ── 404 Handler ───────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler ──────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   SalesPro CRM — Backend Server       ║
  ║   Running on http://localhost:${PORT}     ║
  ║   Environment: ${process.env.NODE_ENV ?? "development"}          ║
  ╚════════════════════════════════════════╝
  `);
});

export default app;
