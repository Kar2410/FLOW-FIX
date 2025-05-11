import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "documents";

interface SearchResult {
  content: string;
  source: string;
  page: number;
  relevance: number;
}

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

    // Try to get internal results if MongoDB is available
    let internalResults: SearchResult[] = [];
    try {
      const client = await MongoClient.connect(MONGODB_URI);
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      // Create embeddings for the error message using Azure OpenAI
      const embeddings = new OpenAIEmbeddings({
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiDeploymentName:
          process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME ||
          "embedding-model-txt-embedding-3-large",
        azureOpenAIApiVersion: "2024-02-15-preview",
        azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.replace(
          "https://",
          ""
        ).replace(".openai.azure.com/", ""),
        configuration: {
          baseURL: process.env.AZURE_OPENAI_ENDPOINT,
        },
      });
      const errorEmbedding = await embeddings.embedQuery(errorMessage);

      // Perform vector search
      const searchResults = await collection
        .aggregate([
          {
            $search: {
              index: "default",
              knnBeta: {
                vector: errorEmbedding,
                path: "embedding",
                k: 3,
              },
            },
          },
          {
            $project: {
              content: 1,
              metadata: 1,
              score: { $meta: "searchScore" },
            },
          },
        ])
        .toArray();

      internalResults = searchResults.map((result) => ({
        content: result.content,
        source: result.metadata.source,
        page: result.metadata.page,
        relevance: result.score,
      }));

      await client.close();
    } catch (error) {
      console.error("MongoDB search error:", error);
      // Continue without internal results
    }

    return NextResponse.json({
      publicSolution: publicResponse.content,
      internalResults,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze error" },
      { status: 500 }
    );
  }
}
