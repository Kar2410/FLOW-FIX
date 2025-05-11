import { NextResponse } from "next/server";
import { searchSimilarChunks } from "@/utils/vectorSearch";

export async function POST(request: Request) {
  try {
    const { errorMessage } = await request.json();

    if (!errorMessage) {
      return NextResponse.json(
        { error: "No error message provided" },
        { status: 400 }
      );
    }

    // Search for similar chunks
    const results = await searchSimilarChunks(errorMessage);

    if (results.length === 0) {
      return NextResponse.json({
        solution: "No solution found in internal knowledge base.",
        source: "internal",
      });
    }

    // Get the most relevant result
    const bestMatch = results[0];

    return NextResponse.json({
      solution: bestMatch.content,
      source: "internal",
      similarity: bestMatch.similarity,
    });
  } catch (error) {
    console.error("Error analyzing error:", error);
    return NextResponse.json(
      { error: "Failed to analyze error message" },
      { status: 500 }
    );
  }
}
