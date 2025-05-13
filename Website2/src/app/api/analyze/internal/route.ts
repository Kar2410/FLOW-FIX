import { NextResponse } from "next/server";
import { searchSimilarChunks } from "@/utils/vectorSearch";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.errorMessage;

    if (!query) {
      return NextResponse.json(
        { error: "No query or error message provided" },
        { status: 400 }
      );
    }

    console.log("Processing query:", query);

    // Search for similar chunks
    const results = await searchSimilarChunks(query);

    // Initialize ChatOpenAI
    const chat = new ChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiDeploymentName: "gpt-4-deployment",
      azureOpenAIApiVersion: "2024-02-15-preview",
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.replace(
        "https://",
        ""
      ).replace(".openai.azure.com/", ""),
      configuration: {
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      },
      temperature: 0.7,
    });

    let systemPrompt = `You are a knowledgeable coding assistant that can handle various types of queries including:
- Technical questions and code-related queries
- Error diagnostics and resolutions
- General programming concepts
- Best practices and recommendations
- Simple informational queries

Analyze the query and provide a helpful, accurate response.`;

    let userPrompt = `Query: ${query}`;

    // If we have matching results from the knowledge base, include them
    if (results.length > 0) {
      const bestMatch = results[0];
      console.log(
        "Found matching content with similarity:",
        bestMatch.similarity
      );

      userPrompt += `\n\nRelevant knowledge base entry (similarity: ${Math.round(
        bestMatch.similarity * 100
      )}%):
${bestMatch.content}

Instructions:
1. First, determine if this knowledge base entry is relevant to the query.
2. If it is relevant, incorporate it into your response.
3. If it's not relevant, provide a general response based on your knowledge.

Format your response as:

# Analysis
[Brief explanation of the query/issue]

# Solution
[2-3 bullet points with clear steps or explanation]

# Code Example (if applicable)
\`\`\`[language]
[relevant code example]
\`\`\`

# Source
From internal knowledge base (${Math.round(
        bestMatch.similarity * 100
      )}% relevance)`;
    } else {
      userPrompt += `\n\nFormat your response as:

# Analysis
[Brief explanation of the query/issue]

# Solution
[2-3 bullet points with clear steps or explanation]

# Code Example (if applicable)
\`\`\`[language]
[relevant code example]
\`\`\``;
    }

    const response = await chat.invoke([
      ["system", systemPrompt],
      ["user", userPrompt],
    ]);

    const formattedSolution = response.content.toString().trim();

    return NextResponse.json({
      solution: formattedSolution,
      source: "internal",
      similarity: results.length > 0 ? results[0].similarity : null,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
