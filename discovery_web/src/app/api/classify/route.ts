import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text prompt is required for classification." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert product and growth strategy research analyst for Urban Company and Indian home service platforms.
Analyze the customer feedback and classify it strictly according to this JSON schema:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "service_category": "Cleaning & Pest Control" | "Salon & Spa at Home" | "AC & Appliance Repair" | "Plumbing, Electrician & Carpentry" | "Painting & Renovation" | "Customer Support & Policies" | "App & Platform Experience" | "Other / General Home Service",
  "pain_point": "Crisp root cause phrase or friction",
  "summary": "1 crisp analytical sentence capturing core customer insight",
  "opportunity_theme": "Offline / Local Habit Fallback" | "Post-Service Maintenance & Reminder Gap" | "Cross-Category Discovery Gap" | "Trust & Predictability Anxiety" | "App & Booking Friction" | "Service Quality / Partner Ops (Out of Scope)" | "Pricing & Hidden Charges (Out of Scope)" | "Positive / No Clear Friction",
  "workaround_mentioned": "Local Technician" | "Competitor App" | "Maid / Neighbour / WhatsApp" | "DIY" | "None",
  "consumer_growth_controllable": boolean (true ONLY if solvable via customer digital product workflows, reminders, scheduling, transparency WITHOUT price cuts or partner disciplinary ops)
}

Return ONLY valid JSON with no markdown formatting or extra text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemInstruction}\n\nCustomer Feedback to Analyze:\n"""${text}"""` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const outputText = response.text || "{}";
    const parsedData = JSON.parse(outputText);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Classification error:", err);
    return NextResponse.json(
      {
        error: err?.message || "Failed to classify feedback with Gemini.",
      },
      { status: 500 }
    );
  }
}
