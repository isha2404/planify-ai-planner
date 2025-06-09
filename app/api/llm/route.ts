import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",  
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? "🤖 AI 无法理解你的请求。";
  return NextResponse.json({ reply });
}

