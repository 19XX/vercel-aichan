export default async function handler(req, res) {
    // ✅ CORS 설정 추가
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ OPTIONS 요청 처리 (CORS 문제 해결)
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // ✅ POST 요청이 아니면 405 오류 반환
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

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
}
