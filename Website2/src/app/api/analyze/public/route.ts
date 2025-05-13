import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.errorMessage;

    if (!query) {
      return NextResponse.json(
        { error: "Query or error message is required" },
        { status: 400 }
      );
    }

    // Generate public solution using Azure OpenAI
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

    const systemPrompt = `You are a knowledgeable coding assistant that can handle various types of queries including:
- Technical questions and code-related queries
- Error diagnostics and resolutions
- General programming concepts
- Best practices and recommendations
- Simple informational queries

Analyze the query and provide a helpful, accurate response.`;

    const userPrompt = `Query: ${query}

Format your response as:

# Analysis
[Brief explanation of the query/issue]

# Solution
[2-3 bullet points with clear steps or explanation]

# Code Example (if applicable)
\`\`\`[language]
[relevant code example]
\`\`\`

Keep the response focused and concise.`;

    const publicResponse = await chat.invoke([
      ["system", systemPrompt],
      ["user", userPrompt],
    ]);

    return NextResponse.json({
      solution: publicResponse.content,
    });
  } catch (error) {
    console.error("Public analysis error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
