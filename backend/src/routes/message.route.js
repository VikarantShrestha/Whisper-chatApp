import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js";

import { getMessages, sendMessage , getUsersForSidebar, getTrendingGifs, searchUsers } from "../controllers/message.controller.js";
import { summarizeMessages,searchGifs } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/gifs/trending", protectRoute, getTrendingGifs);
router.get("/gifs/search", protectRoute, searchGifs);
router.get("/users/search", protectRoute, searchUsers);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id",protectRoute, sendMessage)
router.get("/summarize/:userId", protectRoute, summarizeMessages);


export default router