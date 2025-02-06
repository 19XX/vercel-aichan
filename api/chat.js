import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import fetch from "node-fetch";
import MemoryStore from "memorystore"; // ✅ Ensure this is properly imported

dotenv.config();
const app = express(); // ✅ This must be defined before using app.post
const PORT = process.env.PORT || 3000;
app.use(express.json());

// ✅ Ensure session middleware is set up correctly
app.use(session({
    store: new (MemoryStore(session))({ checkPeriod: 86400000 }),
    secret: "ai-chan-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ✅ Fix: Ensure app is defined before using it
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (!req.session.chatHistory) {
        req.session.chatHistory = [
            { role: "system", content: "You are AIchan, a tsundere AI assistant. Respond concisely with personality." }
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
                messages: req.session.chatHistory,
                max_tokens: 100,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        console.log("🔹 OpenAI API Response:", JSON.stringify(data, null, 2));

        const aiResponse = data.choices?.[0]?.message?.content || "⚠️ AI Error: No response received.";

        req.session.chatHistory.push({ role: "assistant", content: aiResponse });

        res.status(200).json({ choices: [{ message: { content: aiResponse } }] });
    } catch (error) {
        console.error("❌ Error calling OpenAI API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Ensure server starts correctly
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
