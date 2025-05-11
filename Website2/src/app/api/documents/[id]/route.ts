import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const DOCUMENTS_COLLECTION = "documents";
const KNOWLEDGE_BASE_COLLECTION = "internal_knowledge_base";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const documentsCollection = db.collection(DOCUMENTS_COLLECTION);
    const knowledgeBaseCollection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    // Delete document metadata
    const deleteResult = await documentsCollection.deleteOne({ id: params.id });

    if (deleteResult.deletedCount === 0) {
      await client.close();
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete corresponding chunks from knowledge base
    await knowledgeBaseCollection.deleteMany({ "metadata.source": params.id });
    await client.close();

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
