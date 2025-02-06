import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import fetch from "node-fetch";
import MemoryStore from "memorystore"; // ✅ Make sure this is correctly imported

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// ✅ Ensure this line is correct
app.use(session({
    store: new (MemoryStore(session))({ checkPeriod: 86400000 }),
    secret: "ai-chan-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ✅ Fix: Ensure the POST route exists for "/chat"
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (!req.session.chatHistory) {
        req.session.chatHistory = [
            { role: "system", content: "You are AIchan, a tsundere AI assistant..." }
        ];
    }

    req.session.chatHistory.push({ role: "user", content: message });

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: req.session.chatHistory, // ✅ AI remembers past messages
            }),
        });

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || "⚠️ AI Response Error";

        req.session.chatHistory.push({ role: "assistant", content: aiResponse });

        res.status(200).json({ choices: [{ message: { content: aiResponse } }] });
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Ensure your server is running and listening correctly
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
