import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./libs/db.js";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // Serve public folder
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads"))); // Specifically serve uploads

app.use("/api", router);

connectDB().then(() => {
  console.log("JWT_SECRET is loaded:", !!process.env.JWT_SECRET);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}); 

if (process.env.NODE_ENV != "production") {
  app.use(cors({ origin: "http://localhost:5173" }));
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {  
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  }); 
}
