import express from "express";
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import cors from "cors"

import path from "path";

import dotenv from "dotenv"
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser"
import { app,server } from "./lib/socket.js";

dotenv.config()

// const app = express();

const PORT = process.env.PORT || 5002
const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser())

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)

if (process.env.NODE_ENV === "production") {

    const frontendPath = path.join(__dirname, "..", "frontend", "dist");

    app.use(express.static(frontendPath));

    app.get("*path", (req, res) => {
        res.sendFile(path.resolve(frontendPath, "index.html"));
    });
}

server.listen(PORT,()=>{
    console.log("server running on port : "+ PORT);
    connectDB();
})