import User from "../models/user.model.js";
import Message from "../models/message.model.js"

import cloudinary from "../lib/cloudinary.js"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getReceiverSocketId, io } from "../lib/socket.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getUsersForSidebar = async (req,res)=>{
    try 
    {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");
        res.status(200).json(filteredUsers);    
    } 
    catch (error) 
    {
        console.log("Error in getUsersForSidebar : ", error.message);
        return res.status(500).json({error: "Internal server error"})
    }
}

export const getMessages = async (req,res)=>{
    try 
    {
        const {id:userTochatId}= req.params;
        const myId = req.user._id;
        
        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId:userTochatId},
                {senderId:userTochatId, receiverId:myId},
            ]
        })

        return res.status(200).json(messages)
    }
    catch (error) 
    {
        console.log("error in message controller : ", error.message);
        return res.status(500).json({error: "Internal server error"})
    }
}

export const sendMessage = async (req,res)=>{
    try 
    {
        const {text, image} = req.body;
        const {id : receiverId} = req.params;
        const senderId = req.user._id;
        
        let imageUrl;
        if(image)
        {
            if(image.startsWith("http"))
            {
                imageUrl = image;
            }
            else
            {
                const uploadResponse = await cloudinary.uploader.upload(image);
                imageUrl = uploadResponse.secure_url;
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image : imageUrl
        })

        await newMessage.save();

        //todo
        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId)
        {
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        return res.status(200).json(newMessage)
    }
    catch (error)
    {
        console.log("error in sent message controller : ", error.message);
        return res.status(500).json({error: "Internal server error"})
    }
}

export const getTrendingGifs = async (req, res) => {
  try {
    const apiKey = process.env.GIPHY_API_KEY;
    // We fetch trending gifs with a limit of 10
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=10&rating=g`
    );
    
    if (!response.ok) throw new Error("Giphy API error");

    const data = await response.json();
    
    // Map the data to only send what the frontend needs
    const gifs = data.data.map((gif) => ({
      id: gif.id,
      preview: gif.images.fixed_height_small.url, // For the picker
      url: gif.images.fixed_height.url,           // For the actual message
    }));

    res.status(200).json(gifs);
  } catch (error) {
    console.error("Giphy Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const searchGifs = async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.GIPHY_API_KEY;
    
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${query}&limit=10&rating=g`
    );
    
    const data = await response.json();
    const gifs = data.data.map((gif) => ({
      id: gif.id,
      preview: gif.images.fixed_height_small.url,
      url: gif.images.fixed_height.url,
    }));

    res.status(200).json(gifs);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query; // Get search term from frontend
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId }, // Don't include the logged-in user
      fullName: { $regex: query, $options: "i" }, 
    }).select("-password"); // Exclude passwords for security

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const summarizeMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
    }).sort({ createdAt: -1 }).limit(30);

    if (messages.length < 5) {
      return res.status(400).json({ message: "Not enough messages to summarize." });
    }

    //PRIVACY MASKING: Replacing real names/IDs with "User A" and "User B"
    const maskedHistory = messages
      .reverse()
      .map((m) => {
        const role = m.senderId.toString() === myId.toString() ? "User A (Me)" : "User B";
        return `${role}: ${m.text}`;
      })
      .join("\n");

    //AI Processing
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a professional chat assistant. Summarize the following conversation.
    FORMAT RULES:
    - Use clear bullet points.
    - Start each point on a new line.
    - Do not use introductory phrases like "Here is a summary".
    - Keep it under 4 bullets.

    Chat logs:
    ${maskedHistory}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.status(200).json({ summary });
  } catch (error) {
    console.error("Summarization Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};