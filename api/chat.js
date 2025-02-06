app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Initialize chat history in session if not set
    if (!req.session.chatHistory) {
        req.session.chatHistory = [
            { role: "system", content: "You are AIchan, a tsundere AI assistant. Be concise and reply with personality." }
        ];
    }

    // Add user message to history
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
                messages: req.session.chatHistory, // ✅ Send full chat history
                max_tokens: 150,
                temperature: 0.8,
                top_p: 0.9,
            }),
        });

        const data = await response.json();
        console.log("🔹 OpenAI API Response:", JSON.stringify(data, null, 2));

        const aiResponse = data.choices?.[0]?.message?.content?.trim() || "⚠️ AI Error: No response received.";

        // ✅ Store AI response in chat history
        req.session.chatHistory.push({ role: "assistant", content: aiResponse });

        // ✅ Send back the full conversation history
        res.status(200).json({
            choices: [{ message: { content: aiResponse } }],
            chatHistory: req.session.chatHistory
        });

    } catch (error) {
        console.error("❌ Error calling OpenAI API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
