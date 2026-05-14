"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "5000", 10);
// ── Security Middleware ───────────────────────
app.use((0, helmet_1.default)());
// ── CORS ─────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// ── Body Parsing ──────────────────────────────
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// ── Request Logger (dev only) ─────────────────
if (process.env.NODE_ENV === "development") {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}
// ── API Routes ────────────────────────────────
app.use("/api", routes_1.default);
// ── 404 Handler ───────────────────────────────
app.use(error_middleware_1.notFoundHandler);
// ── Global Error Handler ──────────────────────
app.use(error_middleware_1.errorHandler);
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
exports.default = app;
//# sourceMappingURL=server.js.map