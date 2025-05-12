import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const DOCUMENTS_COLLECTION = "documents";
const KNOWLEDGE_BASE_COLLECTION = "internal_knowledge_base";

// This function should only be called from server-side code
export async function setupMongoDB() {
  if (typeof window !== "undefined") {
    // Don't run on client side
    return;
  }

  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const documentsCollection = db.collection(DOCUMENTS_COLLECTION);
    const knowledgeBaseCollection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    // Create vector search index if it doesn't exist
    try {
      await db.command({
        createSearchIndex: KNOWLEDGE_BASE_COLLECTION,
        name: "flowfix_vector_search_index",
        definition: {
          mappings: {
            dynamic: true,
            fields: {
              vector: {
                dimensions: 3072,
                similarity: "cosine",
                type: "knnVector",
              },
            },
          },
        },
      });
      console.log("Vector search index created successfully");
    } catch (error) {
      // Index might already exist, which is fine
      console.log("Vector search index setup skipped (might already exist)");
    }

    await client.close();
    console.log("MongoDB setup completed successfully");
  } catch (error) {
    console.error("MongoDB setup failed:", error);
    throw error;
  }
}
