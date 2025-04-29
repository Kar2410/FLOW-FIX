import * as vscode from "vscode";
import { OpenAIService } from "./utils/openai";
import { SharePoint } from "./utils/sharepoint";
import { ChatViewProvider } from "./webview/chatViewProvider";
import { AzureOpenAIService } from "./utils/azureOpenAI";

let chatViewProvider: ChatViewProvider;
let openai: OpenAIService;
let azureOpenAI: AzureOpenAIService;
let sharepoint: SharePoint;

export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log("Initializing FlowFix...");

    // Initialize services
    openai = new OpenAIService(context);
    console.log("OpenAI service initialized");

    try {
      azureOpenAI = new AzureOpenAIService(context);
      console.log("Azure OpenAI service initialized");
    } catch (error) {
      console.error("Failed to initialize Azure OpenAI:", error);
      vscode.window.showErrorMessage(
        "Failed to initialize Azure OpenAI service. Please check your API key configuration."
      );
    }

    sharepoint = new SharePoint(context);
    console.log("SharePoint service initialized");

    chatViewProvider = new ChatViewProvider(
      context,
      openai,
      azureOpenAI,
      sharepoint
    );
    console.log("ChatViewProvider initialized");

    // Register the chat view provider
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        "flowfix.chatView",
        chatViewProvider
      )
    );

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand("flowfix.fixCurrentError", async () => {
        await handleCurrentError();
      }),
      vscode.commands.registerCommand("flowfix.openChat", () => {
        vscode.commands.executeCommand(
          "workbench.view.extension.flowfix-chat-view"
        );
      })
    );

    // Listen for diagnostic changes if auto-fetch is enabled
    if (vscode.workspace.getConfiguration("flowfix").get("autoFetch")) {
      vscode.languages.onDidChangeDiagnostics(async () => {
        await handleCurrentError();
      });
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to initialize FlowFix: ${error}`);
  }
}

async function handleCurrentError() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const diagnostics = vscode.languages.getDiagnostics(
    activeEditor.document.uri
  );
  if (diagnostics.length === 0) {
    return;
  }

  // Get the first error
  const error = diagnostics[0];
  if (error.severity === vscode.DiagnosticSeverity.Error) {
    await chatViewProvider.handleError(error.message);
  }
}

export function deactivate() {
  // Cleanup if needed
}
