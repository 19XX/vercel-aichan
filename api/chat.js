import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import fetch from "node-fetch";
import MemoryStore from "memorystore"; // Ensure memorystore is installed

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Set up session middleware with MemoryStore for session-based chat history
app.use(
  session({
    store: new (MemoryStore(session))({ checkPeriod: 86400000 }), // Clean up expired sessions every 24 hours
    secret: "ai-chan-secret", // Change this to a secure secret key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure: true if using HTTPS
  })
);

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Initialize chat history if it doesn't exist
  if (!req.session.chatHistory) {
    req.session.chatHistory = [
      {
        role: "system",
        content:
          "You are AIchan, a tsundere AI assistant. Be concise and reply with personality.",
      },
    ];
  }

  // Append the new user message to the session history
  req.session.chatHistory.push({ role: "user", content: message });

  try {
    // Send the full chat history to OpenAI
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

    // Extract AI response or set an error message if not received
    const aiResponse =
      data.choices?.[0]?.message?.content?.trim() ||
      "⚠️ AI Error: No response received.";

    // Append the AI's response to the session history
    req.session.chatHistory.push({ role: "assistant", content: aiResponse });

    // Return the AI's response to the client
    res.status(200).json({ choices: [{ message: { content: aiResponse } }] });
  } catch (error) {
    console.error("❌ Error calling OpenAI API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
