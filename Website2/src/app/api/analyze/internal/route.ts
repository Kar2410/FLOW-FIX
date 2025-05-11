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

    const similarChunks = await searchSimilarChunks(errorMessage);

    if (!similarChunks || similarChunks.length === 0) {
      return NextResponse.json({
        solution: "No solution found in internal knowledge base.",
        source: "internal",
      });
    }

    // Get the most relevant chunk
    const mostRelevantChunk = similarChunks[0];

    return NextResponse.json({
      solution: mostRelevantChunk.content,
      source: "internal",
      similarity: mostRelevantChunk.similarity,
    });
  } catch (error) {
    console.error("Error analyzing error message:", error);
    return NextResponse.json(
      { error: "Failed to analyze error message" },
      { status: 500 }
    );
  }
}
