import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import prisma from "./config/prisma";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
});

// Graceful shutdown to ensure Prisma disconnects and releases DB connections
const shutdown = async (signal: string) => {
    try {
        console.log(`Received ${signal} - closing server...`);
        server.close(async () => {
            try {
                await prisma.$disconnect();
                console.log("Prisma disconnected");
                process.exit(0);
            } catch (err) {
                console.error("Error during Prisma disconnect:", err);
                process.exit(1);
            }
        });
    } catch (err) {
        console.error("Shutdown error:", err);
        process.exit(1);
    }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    shutdown("uncaughtException");
});
