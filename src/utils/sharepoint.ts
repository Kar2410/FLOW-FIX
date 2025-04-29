import * as vscode from "vscode";
import axios from "axios";
import { AzureChatOpenAI } from "@langchain/azure-openai";
import { BaseMessage, HumanMessage, SystemMessage } from "langchain/schema";

export class SharePoint {
  private context: vscode.ExtensionContext;
  private sharepointUrl: string;
  private llm: AzureChatOpenAI;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // Google Doc URL
    this.sharepointUrl =
      "https://docs.google.com/document/d/10NayoBF7aNo-oO3FA7Ejap6IsmCNrTfM-G64spza2v8/edit?usp=sharing";

    // Initialize Azure OpenAI
    const AZURE_OPENAI_API_KEY = "xxxxxxxxxxxxxxxxxxx0f";
    const AZURE_OPENAI_ENDPOINT =
      "https://kgnwl0lm6yi5ugbopenai.openai.azure.com/";
    const AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4-deployment";

    this.llm = new AzureChatOpenAI({
      openAIApiKey: AZURE_OPENAI_API_KEY,
      azureOpenAIEndpoint: AZURE_OPENAI_ENDPOINT,
      azureOpenAIApiDeploymentName: AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: "2024-10-01-preview",
    });
  }

  async searchKnowledgeBase(error: string): Promise<string | null> {
    try {
      // Get the content from the Google Doc
      const docContent = await this.getGoogleDocContent();
      if (!docContent) {
        return "Unable to access the internal knowledge base.";
      }

      // Extract key error information
      const errorInfo = this.extractErrorInfo(error);

      // First, let AI perform a strict relevance check
      const analysisPrompt = `You are a technical error analyzer determining if documentation precisely matches an error.

Error: ${error}
Error Type: ${errorInfo.type}
Error Context: ${errorInfo.context}

Documentation Content:
${docContent}

Instructions:
1. STRICTLY analyze if the documentation contains a SPECIFIC solution for THIS EXACT error
2. Consider the following criteria for relevance:
   - The exact error message matches or is highly similar
   - The programming language/framework matches
   - The documentation contains a direct solution for this specific error case
   - The error context (variable types, function usage) matches
3. Return ONLY "RELEVANT" if ALL criteria are met with high confidence, otherwise return "NOT_RELEVANT"

Guidelines:
- NEVER return "RELEVANT" if you're unsure or if it's a partial match
- If the documentation addresses similar errors but not this specific case, return "NOT_RELEVANT"
- General solutions for error categories are NOT relevant unless they directly address this specific error
- Keyword similarity alone is NOT sufficient for relevance
- Only return "RELEVANT" if a developer would consider the documentation a direct solution for this exact error`;

      const messages: BaseMessage[] = [
        new SystemMessage("You are a technical error analyzer."),
        new HumanMessage(analysisPrompt),
      ];

      const analysisResponse = await this.llm.call(messages);
      const analysisText = analysisResponse.content.toString().trim();

      // Only proceed if we get an explicit "RELEVANT" response
      if (analysisText !== "RELEVANT") {
        return "No solution present in the internal knowledge base.";
      }

      // Additional verification check to prevent false positives
      const verificationPrompt = `You are a verification system performing a second strict check on error relevance.

Error: ${error}
Error Type: ${errorInfo.type}
Error Context: ${errorInfo.context}

Documentation Content:
${docContent}

Rate the relevance of the documentation to this specific error on a scale of 1-10, where:
- 10: Perfect match with exact error and solution
- 7-9: Very good match with directly applicable solution
- 4-6: Partial match with somewhat relevant information
- 1-3: Poor match with only tangentially related information

Return ONLY the numeric score, nothing else.`;

      const verificationMessages: BaseMessage[] = [
        new SystemMessage("You are a verification system."),
        new HumanMessage(verificationPrompt),
      ];

      const verificationResponse = await this.llm.call(verificationMessages);
      const relevanceScore = parseInt(
        verificationResponse.content.toString().trim()
      );

      // Only proceed if relevance score is 7 or higher
      if (isNaN(relevanceScore) || relevanceScore < 7) {
        return "No solution present in the internal knowledge base.";
      }

      // Only if double-verified, generate the solution
      const solutionPrompt = `You are a coding assistant providing solutions EXCLUSIVELY from documentation.

Error: ${error}
Error Type: ${errorInfo.type}
Error Context: ${errorInfo.context}

Documentation Content:
${docContent}

Instructions:
1. Extract ONLY the relevant part of the documentation that directly addresses this error
2. Format your response as:
   # Error Explanation
   [Concise explanation of the specific error]

   # Solution from Internal Knowledge Base
   [Steps to fix this specific error, directly from documentation]

   # Corrected Code Example
   \`\`\`[language]
   [Code example from documentation]
   \`\`\`

IMPORTANT:
- If you cannot find a DIRECT solution for this SPECIFIC error in the documentation, respond ONLY with "No solution present in the internal knowledge base."
- Do NOT create or extrapolate solutions not explicitly in the documentation
- Do NOT combine multiple partial solutions
- Do NOT use general programming knowledge - ONLY use information from the documentation`;

      const solutionMessages: BaseMessage[] = [
        new SystemMessage("You are a coding assistant."),
        new HumanMessage(solutionPrompt),
      ];

      const solutionResponse = await this.llm.call(solutionMessages);
      const solution = solutionResponse.content.toString().trim();

      // Final validation - check if the solution looks genuine
      if (
        solution === "No solution present in the internal knowledge base." ||
        !solution.includes("# Error Explanation") ||
        !solution.includes("# Solution from Internal Knowledge Base") ||
        !solution.includes("# Corrected Code Example") ||
        solution.includes("general solution") ||
        solution.includes("generally") ||
        solution.includes("common error") ||
        solution.toLowerCase().includes("typically") ||
        solution.toLowerCase().includes("usually")
      ) {
        return "No solution present in the internal knowledge base.";
      }

      return solution;
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      return "An error occurred while searching the internal knowledge base.";
    }
  }

  private extractErrorInfo(error: string): { type: string; context: string } {
    // Extract more detailed error information

    // Extract error type - look for pattern "error: something" or just use first line
    const typeMatch = error.match(/error:?\s+(.*?)(?:\n|$)/i);
    const type = typeMatch ? typeMatch[1].trim() : error.split("\n")[0].trim();

    // Try to identify programming language/framework from error format
    let language = "";
    if (error.includes("TypeError:")) language = "JavaScript/TypeScript";
    else if (error.includes("SyntaxError:")) language = "JavaScript/TypeScript";
    else if (error.includes("ImportError:")) language = "Python";
    else if (error.includes("RuntimeError:")) language = "Python";
    else if (error.includes("NullPointerException")) language = "Java";
    else if (error.includes("ValueError:")) language = "Python";

    // Extract context - look for code snippets, file paths, line numbers
    const fileMatch = error.match(/(?:in|at|from)\s+([^:]+?):(\d+)/);
    const functionMatch = error.match(/(?:in|at)\s+([a-zA-Z0-9_.]+)\(/);
    const lineMatch = error.match(/line\s+(\d+)/i);

    const file = fileMatch ? fileMatch[1].trim() : "";
    const line = lineMatch
      ? lineMatch[1].trim()
      : fileMatch
      ? fileMatch[2].trim()
      : "";
    const func = functionMatch ? functionMatch[1].trim() : "";

    const contextParts = [];
    if (language) contextParts.push(`Language: ${language}`);
    if (file) contextParts.push(`File: ${file}`);
    if (line) contextParts.push(`Line: ${line}`);
    if (func) contextParts.push(`Function: ${func}`);

    // Extract code snippets if present
    const codeMatch = error.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
    const code = codeMatch ? `Code: ${codeMatch[1].trim()}` : "";
    if (code) contextParts.push(code);

    return {
      type,
      context:
        contextParts.length > 0
          ? contextParts.join("\n")
          : "No additional context",
    };
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
