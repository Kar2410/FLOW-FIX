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

    // Format the response consistently with public source
    const formattedSolution = `# Error Analysis
${bestMatch.content.split("\n")[0]}

# Solution
${bestMatch.content.split("\n").slice(1).join("\n")}

# Source
From internal knowledge base (${Math.round(
      bestMatch.similarity * 100
    )}% relevance)`;

    return NextResponse.json({
      solution: formattedSolution,
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
