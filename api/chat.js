import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;  // ✅ Render가 인식하는 포트 사용

app.use(express.json());

// CORS 설정 추가
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// OPTIONS 요청 처리 (CORS 문제 해결)
app.options("/chat", (req, res) => {
    res.sendStatus(200);
});

// ✅ POST 요청만 허용
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are AIchan, a tsundere AI assistant..." },
                    { role: "user", content: message }
                ],
            }),
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ 서버 시작
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
