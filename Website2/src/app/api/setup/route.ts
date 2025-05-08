import { NextResponse } from "next/server";
import { setupMongoDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await setupMongoDB();
    return NextResponse.json({
      message: "MongoDB setup completed successfully",
    });
  } catch (error) {
    console.error("MongoDB setup failed:", error);
    return NextResponse.json(
      { error: "Failed to setup MongoDB" },
      { status: 500 }
    );
  }
}
