import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      diagnosis: null,
      error:
        "GEMINI_API_KEY is not configured. Please add it in the Vars section to enable crop disease scanning.",
    });
  }

  try {
    const { image, description } = await request.json();

    if (!image) {
      return NextResponse.json({
        diagnosis: null,
        error: "Please upload an image of your crop for analysis.",
      });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const parts = [
      {
        text: `You are an expert plant pathologist and agricultural scientist. Analyze this crop/plant image carefully and provide a detailed diagnosis in the following JSON format ONLY (no markdown, no extra text):

{
  "disease_name": "Name of the disease or 'Healthy' if no disease detected",
  "confidence": 85,
  "severity": "Low|Medium|High|Critical",
  "description": "Brief description of what you observe",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "treatment": ["treatment recommendation 1", "treatment recommendation 2", "treatment recommendation 3"],
  "prevention": ["preventive measure 1", "preventive measure 2", "preventive measure 3"],
  "crop_type": "Identified crop type",
  "organic_treatment": "Organic/natural treatment option if available"
}

${description ? `Additional context from the farmer: ${description}` : ""}

Respond ONLY with the JSON object, nothing else.`,
      },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Data,
        },
      },
    ];

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const MAX_RETRIES = 3;
    let lastError = "";

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        try {
          // Clean potential markdown formatting
          const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const diagnosis = JSON.parse(cleaned);
          return NextResponse.json({ diagnosis });
        } catch {
          return NextResponse.json({
            diagnosis: {
              disease_name: "Analysis Complete",
              confidence: 70,
              severity: "Unknown",
              description: text,
              symptoms: [],
              treatment: ["Please consult a local agricultural expert for detailed advice."],
              prevention: [],
              crop_type: "Unknown",
              organic_treatment: "N/A",
            },
          });
        }
      }

      const errorBody = await res.text();
      lastError = errorBody;

      if (res.status === 429 && attempt < MAX_RETRIES - 1) {
        const delayMs = Math.min(1000 * 2 ** attempt, 15000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      break;
    }

    console.error("Disease scan API error:", lastError);
    return NextResponse.json({
      diagnosis: null,
      error: "Unable to analyze the image right now. The AI service may be rate-limited. Please try again in a minute.",
      rateLimited: lastError.includes("429"),
    });
  } catch (error) {
    console.error("Disease scan error:", error);
    return NextResponse.json({
      diagnosis: null,
      error: "An error occurred while processing the image. Please try again.",
    });
  }
}
