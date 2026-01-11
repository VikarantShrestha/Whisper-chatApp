import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js";

import { getMessages, sendMessage , getUsersForSidebar } from "../controllers/message.controller.js";
import { summarizeMessages } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id",protectRoute, sendMessage)
router.get("/summarize/:userId", protectRoute, summarizeMessages);


export default router