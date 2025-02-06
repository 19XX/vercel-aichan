export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { message } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // 🔥 API Key는 환경변수로 숨김
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are AIchan, a futuristic tsundere AI..." },
                { role: "user", content: message }
            ],
        }),
    });

    const data = await response.json();
    res.status(200).json(data);
}
