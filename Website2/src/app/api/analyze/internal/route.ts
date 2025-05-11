import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoClient } from "mongodb";
import { cosineSimilarity } from "@/utils/mathUtils";

const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "internal_knowledge_base";

export async function POST(request: Request) {
  try {
    const { errorMessage } = await request.json();

    if (!errorMessage) {
      return NextResponse.json(
        { error: "No error message provided" },
        { status: 400 }
      );
    }

    // Generate embedding for the error message
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-large",
      azureOpenAIApiDeploymentName:
        process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
    });

    const queryEmbedding = await embeddings.embedQuery(errorMessage);

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Get all chunks from the knowledge base
    const chunks = await collection.find({}).toArray();
    await client.close();

    if (chunks.length === 0) {
      return NextResponse.json({
        solution: "No solution found in internal knowledge base.",
        source: "internal",
      });
    }

    // Calculate similarity scores for each chunk
    const similarities = chunks.map((chunk) => ({
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.vector),
    }));

    // Sort by similarity and get the most relevant chunks
    const relevantChunks = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .filter((chunk) => chunk.similarity > 0.7); // Only include chunks with similarity > 0.7

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        solution: "No solution found in internal knowledge base.",
        source: "internal",
      });
    }

    // Combine the most relevant chunks into a solution
    const solution = relevantChunks.map((chunk) => chunk.content).join("\n\n");

    return NextResponse.json({
      solution,
      source: "internal",
    });
  } catch (error) {
    console.error("Error searching chunks:", error);
    return NextResponse.json(
      { error: "Failed to analyze error message" },
      { status: 500 }
    );
  }
}
