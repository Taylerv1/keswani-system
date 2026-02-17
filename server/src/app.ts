import express from "express";
import cors from "cors";
import routes from "./routes";
import errorHandler from "./middlewares/error.middleware";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api", routes);

// Global error handler
app.use(errorHandler);

export default app;
