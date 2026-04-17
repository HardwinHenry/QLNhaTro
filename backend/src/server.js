import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./libs/db.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes/index.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public"))); // Serve public folder
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads"))); // Specifically serve uploads

app.use("/api", router);

if (isProduction) {
  const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
  console.log(`Production mode: serving frontend from ${frontendDistPath}`);
  
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get(/.*/, (req, res) => {
      const indexPath = path.join(frontendDistPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Frontend build not found (index.html missing)");
      }
    });
  } else {
    console.warn("Warning: frontend/dist directory not found. Static serving might fail.");
  }
}

connectDB().then(() => {
  console.log("JWT_SECRET is loaded:", !!process.env.JWT_SECRET);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
