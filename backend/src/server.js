import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import todosRouter from "./routes/todos.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

app.use(express.json());
app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});
app.use("/api/todos", todosRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

if (!mongoUri) {
  console.error("MONGODB_URI is required. Set it in backend/.env.");
  process.exit(1);
}

try {
  if (await mongoose.connect(mongoUri)) {
    console.log("Connected to MongoDB.");
  }
  const server = app.listen(port, () => {
    console.log(`Todo API listening at http://localhost:${port}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    });
  }
} catch (error) {
  console.error("Could not connect to MongoDB:", error);
  process.exit(1);
}
