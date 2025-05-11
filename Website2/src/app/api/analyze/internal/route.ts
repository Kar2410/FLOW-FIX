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
        errorType: "Unknown Error",
        cause: "No matching solutions found in internal knowledge base",
        solution: "Please contact support or try searching in public sources",
        prevention:
          "Consider adding this error case to the internal knowledge base",
      });
    }

    // Get the most relevant result
    const bestMatch = results[0];

    return NextResponse.json({
      errorType: "Internal Knowledge Base Match",
      cause: "Found in internal documentation",
      solution: bestMatch.content,
      prevention: "Documentation available in internal knowledge base",
      source: bestMatch.metadata.source,
      page: bestMatch.metadata.page,
      similarity: bestMatch.similarity,
    });
  } catch (error) {
    console.error("Error analyzing error:", error);
    return NextResponse.json(
      { error: "Failed to analyze error" },
      { status: 500 }
    );
  }
}
