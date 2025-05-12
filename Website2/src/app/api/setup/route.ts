import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/flowfix";
const DB_NAME = "flowfix";
const DOCUMENTS_COLLECTION = "documents";
const KNOWLEDGE_BASE_COLLECTION = "internal_knowledge_base";

export async function GET() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const knowledgeBaseCollection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    // Create vector search index
    await db.command({
      createSearchIndex: KNOWLEDGE_BASE_COLLECTION,
      name: "flowfix_vector_search_index",
      definition: {
        mappings: {
          dynamic: true,
          fields: {
            vector: {
              type: "knnVector",
              dimensions: 3072,
              similarity: "dotProduct",
            },
          },
        },
      },
    });

    await client.close();

    return NextResponse.json({
      message: "MongoDB setup completed successfully",
    });
  } catch (error) {
    console.error("MongoDB setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup MongoDB" },
      { status: 500 }
    );
  }
}
