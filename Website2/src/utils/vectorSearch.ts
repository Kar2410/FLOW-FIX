import { OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { MongoClient } from "mongodb";

// MongoDB connection configuration
const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "internal_knowledge_base";

// MongoDB connection options
const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

// Initialize Azure OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName:
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
  azureOpenAIApiVersion: "2024-02-15-preview",
  azureOpenAIApiInstanceName: "kgnwl0lm6yi5ugbopenai",
  configuration: {
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  },
});

// Helper function to get MongoDB client
async function getMongoClient() {
  try {
    console.log("Attempting to connect to MongoDB...");
    const client = await MongoClient.connect(MONGODB_URI, mongoOptions);
    console.log("Successfully connected to MongoDB");
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error(
      "Failed to connect to MongoDB. Please check your connection settings."
    );
  }
}

export async function processPDF(file: File) {
  let client;
  try {
    console.log("Starting PDF processing...");

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    console.log(`Processing file: ${fileName}`);

    // Load and process the PDF
    const loader = new PDFLoader(
      new Blob([buffer], { type: "application/pdf" })
    );
    const docs = await loader.load();
    console.log(`PDF loaded successfully. Pages: ${docs.length}`);

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Text split into ${splitDocs.length} chunks`);

    // Connect to MongoDB
    client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Generate embeddings and store in MongoDB
    console.log("Generating embeddings...");
    const chunksWithEmbeddings = await Promise.all(
      splitDocs.map(async (doc: Document) => {
        try {
          const embedding = await embeddings.embedQuery(doc.pageContent);
          return {
            content: doc.pageContent,
            vector: embedding,
            metadata: {
              source: fileName,
              page: doc.metadata.page,
              timestamp: new Date(),
            },
          };
        } catch (error) {
          console.error("Error generating embedding:", error);
          throw error;
        }
      })
    );
    console.log("Embeddings generated successfully");

    // Insert chunks into MongoDB
    if (chunksWithEmbeddings.length > 0) {
      console.log(
        `Inserting ${chunksWithEmbeddings.length} chunks into MongoDB...`
      );
      try {
        const result = await collection.insertMany(chunksWithEmbeddings);
        console.log(`Successfully inserted ${result.insertedCount} chunks`);

        // Verify the insertion
        const count = await collection.countDocuments({
          "metadata.source": fileName,
        });
        console.log(
          `Verified ${count} documents in database for file ${fileName}`
        );

        return { success: true, fileName, insertedCount: result.insertedCount };
      } catch (error) {
        console.error("Error inserting documents into MongoDB:", error);
        throw error;
      }
    }

    return { success: true, fileName };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error: "Failed to process PDF" };
  } finally {
    if (client) {
      try {
        await client.close();
        console.log("MongoDB connection closed");
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
      }
    }
  }
}

export async function searchSimilarChunks(query: string, threshold = 0.7) {
  let client;
  try {
    console.log("Starting similarity search...");

    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query);
    console.log("Query embedding generated");

    // Connect to MongoDB
    client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Use MongoDB's vector search
    const results = await collection
      .aggregate([
        {
          $search: {
            index: "flowfix_vector_search_index",
            knnBeta: {
              vector: queryEmbedding,
              path: "vector",
              k: 5,
              filter: {
                score: { $gte: threshold },
              },
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

    console.log(`Found ${results.length} relevant results`);

    return results.map((result) => ({
      content: result.content,
      similarity: result.score,
      metadata: result.metadata,
    }));
  } catch (error) {
    console.error("Error searching chunks:", error);
    return [];
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function deleteDocument(fileName: string) {
  let client;
  try {
    console.log(`Deleting document: ${fileName}`);

    client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Delete all chunks associated with the file
    const result = await collection.deleteMany({
      "metadata.source": fileName,
    });
    console.log(`Deleted ${result.deletedCount} chunks`);

    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  } finally {
    if (client) {
      await client.close();
    }
  }
}
