import * as vscode from "vscode";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class SharePoint {
  private context: vscode.ExtensionContext;
  private sharepointUrl: string;
  private genAI: GoogleGenerativeAI;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // Google Doc URL
    this.sharepointUrl =
      "https://docs.google.com/document/d/10NayoBF7aNo-oO3FA7Ejap6IsmCNrTfM-G64spza2v8/edit?usp=sharing";

    // Initialize Gemini
    const apiKey = "";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async searchKnowledgeBase(error: string): Promise<string | null> {
    try {
      // Get the content from the Google Doc
      const docContent = await this.getGoogleDocContent();
      if (!docContent) {
        return null;
      }

      // Extract key error information
      const errorInfo = this.extractErrorInfo(error);

      // First, let AI analyze if the documentation contains relevant information
      const analysisPrompt = `You are a coding assistant analyzing if documentation contains relevant solutions for an error.

Error: ${error}
Error Type: ${errorInfo.type}
Error Context: ${errorInfo.context}

Documentation Content:
${docContent}

Instructions:
1. Analyze if the documentation contains information relevant to this specific error
2. Consider:
   - The exact error type and message
   - The programming context (language, function, variable types)
   - The specific problem being addressed
3. Return ONLY "RELEVANT" if you find a meaningful match, or "NOT_RELEVANT" if not

Guidelines:
- Only consider it relevant if the documentation addresses this specific type of error
- Ignore general or unrelated information
- Consider the programming context and error type together`;

      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const analysisResult = await model.generateContent(analysisPrompt);
      const analysisResponse = await analysisResult.response;
      const isRelevant = analysisResponse.text().includes("RELEVANT");

      if (!isRelevant) {
        return null;
      }

      // Only if relevant content is found, generate the solution
      const solutionPrompt = `You are a coding assistant helping beginners understand and fix errors. 
      You have confirmed that our documentation contains relevant information for this error.
      Please provide a clear, beginner-friendly solution using ONLY the information from our documentation.

Error: ${error}
Error Type: ${errorInfo.type}
Error Context: ${errorInfo.context}

Documentation Content:
${docContent}

Instructions:
1. Use ONLY the information from our documentation
2. Format the solution as:
   # Error Explanation
   [Clear explanation of this specific error]

   # Solution
   [Steps to fix this specific error]

   # Corrected Code Example
   \`\`\`[language]
   [Relevant code example from documentation]
   \`\`\`

Guidelines:
- Focus on this specific error type and context
- Only include information directly relevant to solving this error
- Keep explanations clear and specific
- Reference specific parts of the documentation`;

      const solutionResult = await model.generateContent(solutionPrompt);
      const solutionResponse = await solutionResult.response;
      const solution = solutionResponse.text();

      // Validate the solution format and content
      if (
        !solution.includes("# Error Explanation") ||
        !solution.includes("# Solution") ||
        !solution.includes("# Corrected Code Example")
      ) {
        return null;
      }

      return solution.trim();
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      return null;
    }
  }

  private extractErrorInfo(error: string): { type: string; context: string } {
    // Extract error type (e.g., "cannot be used as a function")
    const typeMatch = error.match(/error: (.*?)(?:\n|$)/);
    const type = typeMatch ? typeMatch[1].trim() : error;

    // Extract context (file, line number, function)
    const contextMatch = error.match(/In (.*?):/);
    const context = contextMatch ? contextMatch[1] : "";

    return { type, context };
  }

  private findRelevantContent(content: string, errorMessage: string): string {
    const lines = content.split("\n");
    let relevantSections: string[] = [];
    let currentSection: string[] = [];
    let isRelevantSection = false;

    // Extract error type from the error message
    const errorType =
      errorMessage.match(/error: (.*?)[\n\[]/)?.[1] || errorMessage;

    for (const line of lines) {
      // Check if line contains error-related keywords or matches the error type
      if (this.containsErrorKeywords(line, errorType)) {
        isRelevantSection = true;
        if (currentSection.length > 0) {
          relevantSections.push(currentSection.join("\n"));
          currentSection = [];
        }
      }

      if (isRelevantSection) {
        // Skip lines that are just error messages or code output
        if (
          !line.includes("error:") &&
          !line.includes("[Running]") &&
          !line.includes("[Done]")
        ) {
          currentSection.push(line);
        }

        // If we hit a blank line or section end, save the section
        if (line.trim() === "" || line.startsWith("##")) {
          if (currentSection.length > 1) {
            relevantSections.push(currentSection.join("\n"));
          }
          currentSection = [];
          isRelevantSection = false;
        }
      }
    }

    // Add any remaining content
    if (currentSection.length > 0) {
      relevantSections.push(currentSection.join("\n"));
    }

    // Format the output to be more concise
    return relevantSections
      .map((section) => section.trim())
      .filter((section) => section.length > 0)
      .join("\n\n");
  }

  private containsErrorKeywords(line: string, errorMessage: string): boolean {
    const errorWords = errorMessage.toLowerCase().split(/\s+/);
    const lineLower = line.toLowerCase();

    // Check for exact matches of error type
    if (lineLower.includes(errorMessage.toLowerCase())) {
      return true;
    }

    // Check for common error-related terms
    const errorTerms = [
      "error",
      "fix",
      "solution",
      "correct",
      "wrong",
      "invalid",
      "type",
    ];
    return errorTerms.some((term) => lineLower.includes(term));
  }

  private async getGoogleDocContent(): Promise<string | null> {
    if (!this.sharepointUrl) {
      return null;
    }

    try {
      // Extract the document ID from the URL
      const docId = this.sharepointUrl.match(/\/d\/([^\/]+)/)?.[1];
      if (!docId) {
        return null;
      }

      // Use the Google Docs API to fetch content
      const exportUrl = `https://docs.google.com/document/export?format=txt&id=${docId}`;
      const response = await axios.get(exportUrl);
      const content = response.data;

      // Clean up the content
      return content
        .replace(/\r\n/g, "\n") // Normalize line endings
        .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
        .trim();
    } catch (error) {
      console.error("SharePoint access error:", error);
      return null;
    }
  }
}
