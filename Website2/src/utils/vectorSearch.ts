import { OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { MongoClient } from "mongodb";
import { cosineSimilarity } from "./mathUtils";

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
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME ||
    "embedding-model-txt-embedding-3-large",
  azureOpenAIApiVersion: "2024-10-01-preview",
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.replace(
    "https://",
    ""
  ).replace(".openai.azure.com/", ""),
  configuration: {
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  },
});

// Helper function to get MongoDB client
async function getMongoClient() {
  try {
    console.log("Connecting to MongoDB...");
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

    // Generate embeddings for chunks
    console.log("Generating embeddings...");
    const chunksWithEmbeddings = await Promise.all(
      splitDocs.map(async (doc: Document) => {
        const vector = await embeddings.embedQuery(doc.pageContent);
        return {
          content: doc.pageContent,
          vector,
          metadata: {
            source: fileName,
            page: doc.metadata.page,
          },
        };
      })
    );
    console.log("Embeddings generated successfully");

    // Connect to MongoDB and store chunks
    client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Insert chunks into MongoDB
    if (chunksWithEmbeddings.length > 0) {
      console.log(
        `Inserting ${chunksWithEmbeddings.length} chunks into MongoDB...`
      );
      const result = await collection.insertMany(chunksWithEmbeddings);
      console.log(`Successfully inserted ${result.insertedCount} chunks`);

      // Verify insertion
      const count = await collection.countDocuments();
      console.log(`Total documents in collection: ${count}`);
    }

    return {
      success: true,
      fileName,
      chunks: chunksWithEmbeddings,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error: "Failed to process PDF" };
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
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

    // Get all documents from MongoDB
    console.log("Fetching documents from MongoDB...");
    const documents = await collection.find({}).toArray();
    console.log(`Found ${documents.length} documents`);

    if (documents.length === 0) {
      console.log("No documents found in the database");
      return [];
    }

    // Calculate similarity scores
    const results = documents
      .filter((doc) => {
        if (!doc.vector || !Array.isArray(doc.vector)) {
          console.log("Skipping document with invalid vector:", doc._id);
          return false;
        }
        return true;
      })
      .map((doc) => ({
        content: doc.content,
        similarity: cosineSimilarity(queryEmbedding, doc.vector),
        metadata: doc.metadata,
      }));

    // Sort by similarity and filter by threshold
    const relevantResults = results
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
    console.log(
      `${relevantResults.length} results above threshold ${threshold}`
    );

    return relevantResults;
  } catch (error) {
    console.error("Error searching chunks:", error);
    return [];
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
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

    // Verify deletion
    const remainingDocs = await collection.countDocuments({
      "metadata.source": fileName,
    });
    console.log(
      `Remaining documents with source ${fileName}: ${remainingDocs}`
    );

    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}
