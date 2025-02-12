import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors"; // ✅ Import CORS
import MemoryStore from "memorystore";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ Enable CORS for Framer
app.use(cors({
    origin: "*", // ✅ Allow all origins (you can replace with Framer URL for more security)
    methods: "POST",
    allowedHeaders: ["Content-Type"]
}));

// ✅ Set up session middleware
app.use(session({
    store: new (MemoryStore(session))({ checkPeriod: 86400000 }),
    secret: "ai-chan-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (!req.session.chatHistory) {
        req.session.chatHistory = [
            { role: "system", content: "You are AIchan, a tsundere AI assistant. Be concise and reply with personality." }
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
                max_tokens: 150,
                temperature: 0.8,
                top_p: 0.9,
            }),
        });

        const data = await response.json();
        console.log("🔹 OpenAI API Response:", JSON.stringify(data, null, 2));

        const aiResponse = data.choices?.[0]?.message?.content?.trim() || "⚠️ AI Error: No response received.";

        req.session.chatHistory.push({ role: "assistant", content: aiResponse });

        res.status(200).json({ choices: [{ message: { content: aiResponse } }] });
    } catch (error) {
        console.error("❌ Error calling OpenAI API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
