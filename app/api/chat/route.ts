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
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    const payload = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const MAX_RETRIES = 4;
    let lastError = "";

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      // Success path
      if (res.ok) {
        const data = await res.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "I apologize, I could not generate a response. Please try again.";
        return NextResponse.json({ response: text });
      }

      // Rate-limited -- exponential backoff with server hint
      if (res.status === 429) {
        const errorBody = await res.text();
        lastError = errorBody;

        // Parse server-suggested retry delay if available
        let serverDelay = 0;
        try {
          const parsed = JSON.parse(errorBody);
          const retryInfo = parsed?.error?.details?.find(
            (d: { "@type": string }) => d["@type"]?.includes("RetryInfo")
          );
          if (retryInfo?.retryDelay) {
            serverDelay = Number.parseInt(retryInfo.retryDelay, 10) || 0;
          }
        } catch {
          // Ignore parse errors
        }

        // Exponential backoff: 1s, 2s, 4s, 8s -- but respect server hint if larger
        const backoffMs = Math.max(1000 * 2 ** attempt, serverDelay * 1000);
        // Cap at 30 seconds to avoid Vercel function timeout
        const delayMs = Math.min(backoffMs, 30000);

        if (attempt < MAX_RETRIES - 1) {
          console.log(
            `[v0] Gemini 429 - retry ${attempt + 1}/${MAX_RETRIES - 1}, waiting ${delayMs}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // Non-429 error
      const errorData = await res.text();
      console.error("Gemini API error:", errorData);

      return NextResponse.json({
        response:
          "I'm having trouble connecting to the AI service right now. Please check that your GEMINI_API_KEY is valid, or try again in a moment.",
      });
    }

    // All retries exhausted on 429
    console.error("Gemini API rate limit exhausted after retries:", lastError);
    return NextResponse.json({
      response:
        "The AI service is very busy right now due to free-tier rate limits. Please wait about 30-60 seconds before trying again, or consider upgrading your Gemini API plan for higher limits.",
      rateLimited: true,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      response:
        "Something went wrong while processing your request. Please try again.",
    });
  }
}
