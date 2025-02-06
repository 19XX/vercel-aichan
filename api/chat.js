import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// 🚀 Store chat history per user (session-based)
app.use(session({
    secret: "ai-chan-secret", // Change this to a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.post("/chat", async (req, res) => {
    const { message } = req.body;

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
                messages: req.session.chatHistory, // 🚀 Send full chat history
            }),
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        req.session.chatHistory.push({ role: "assistant", content: aiResponse });

        res.status(200).json({ choices: [{ message: { content: aiResponse } }] });
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
