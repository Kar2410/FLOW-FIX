import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
  try {
    const { errorMessage } = await request.json();

    if (!errorMessage) {
      return NextResponse.json(
        { error: "Error message is required" },
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

    const systemPrompt = `You are a coding assistant. Analyze this error and provide a concise solution.`;
    const userPrompt = `Error: ${errorMessage}

Provide a response in this format:

# Error Analysis
[One line explanation of the error]

# Solution
[2-3 bullet points with clear steps]

# Code Fix
\`\`\`[language]
[only the relevant code fix]
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
      { error: "Failed to analyze error" },
      { status: 500 }
    );
  }
}
