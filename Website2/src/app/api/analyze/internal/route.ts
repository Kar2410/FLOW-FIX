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

    console.log("Analyzing error message:", errorMessage);

    // Search for similar chunks
    const results = await searchSimilarChunks(errorMessage);

    if (results.length === 0) {
      console.log("No matching solutions found in internal knowledge base");
      return NextResponse.json({
        solution: "No solution found in internal knowledge base.",
        source: "internal",
      });
    }

    // Get the most relevant result
    const bestMatch = results[0];
    console.log(
      "Found matching solution with similarity:",
      bestMatch.similarity
    );

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
