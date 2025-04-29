import * as vscode from "vscode";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // Hardcoded API key for testing
    const apiKey = "AIzaSyALQ2Lsvo8TVsl6V_FKzEKCB1B3N6qxHGM";

    console.log("Using hardcoded Gemini API Key for testing");
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeError(
    errorMessage: string,
    knowledgeBaseContent?: string
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      let prompt = `You are a coding assistant. Analyze this error and provide a concise solution:

Error: ${errorMessage}

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

      if (knowledgeBaseContent) {
        prompt += `\n\nInternal Knowledge Base Context:\n${knowledgeBaseContent}\n\nIncorporate this information if relevant.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "No response from Gemini";
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return `Error analyzing the error message: ${error.message}`;
    }
  }
}
