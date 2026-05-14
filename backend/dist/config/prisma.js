"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
require("dotenv/config");
// Singleton Prisma client to avoid too many connections in dev
const globalForPrisma = globalThis;
let prismaInstance;
if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
}
else {
    console.log("Initializing Prisma Client with pg adapter...");
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    prismaInstance = new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prismaInstance;
    }
}
exports.prisma = prismaInstance;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map