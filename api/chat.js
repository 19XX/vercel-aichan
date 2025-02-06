app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (!req.session.chatHistory) {
        req.session.chatHistory = [
            { role: "system", content: "You are AIchan, a tsundere AI assistant. Respond concisely and with personality." }
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
                max_tokens: 100, // ✅ Prevents empty responses
                temperature: 0.7, // ✅ Makes responses more dynamic
            }),
        });

        const data = await response.json();
        console.log("🔹 OpenAI API Response:", JSON.stringify(data, null, 2)); // ✅ Debugging

        const aiResponse = data.choices?.[0]?.message?.content || "⚠️ AI Error: No response received.";

        req.session.chatHistory.push({ role: "assistant", content: aiResponse });

        res.status(200).json({ choices: [{ message: { content: aiResponse } }] });
    } catch (error) {
        console.error("❌ Error calling OpenAI API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
