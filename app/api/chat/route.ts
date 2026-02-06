import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      response:
        "The Gemini API key is not configured yet. Please add your GEMINI_API_KEY in the Vars section of the sidebar to enable AI responses. In the meantime, I can tell you that Agri-Voice is designed to help with crop management, disease identification, soil health, weather, and government farming schemes!",
    });
  }

  try {
    const { message, image } = await request.json();

    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];

    parts.push({
      text: `You are Agri-Voice, an expert AI agricultural assistant. You help farmers with crop management, disease identification, soil health, weather interpretation, government schemes, and modern farming techniques. Be concise, practical, and helpful. Use simple language that farmers can understand easily.\n\nUser query: ${message}`,
    });

    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Data,
        },
      });
      parts[0] = {
        text: `You are Agri-Voice, an expert AI agricultural assistant. You help farmers with crop management, disease identification, soil health, weather interpretation, government schemes, and modern farming techniques. Be concise, practical, and helpful. Use simple language that farmers can understand easily.\n\nThe user has uploaded an image of a crop/plant. Analyze it for potential diseases, pests, nutrient deficiencies, or growth stage. Provide diagnosis and actionable advice.\n\nUser query: ${message || "Please analyze this crop image and provide diagnosis."}`,
      };
    }

    const model = "gemini-2.0-flash";

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Gemini API error:", errorData);
      return NextResponse.json({
        response:
          "I'm having trouble connecting to the AI service right now. Please check that your GEMINI_API_KEY is valid, or try again in a moment.",
      });
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I apologize, I could not generate a response. Please try again.";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      response:
        "Something went wrong while processing your request. Please try again.",
    });
  }
}
