import * as vscode from "vscode";
import { OpenAIService } from "../utils/openai";
import { SharePoint } from "../utils/sharepoint";
import { AzureOpenAIService } from "../utils/azureOpenAI";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "flowfix.chatView";
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;
  private _openai: OpenAIService;
  private _azureOpenAI: AzureOpenAIService;
  private _sharepoint: SharePoint;

  constructor(
    context: vscode.ExtensionContext,
    openai: OpenAIService,
    azureOpenAI: AzureOpenAIService,
    sharepoint: SharePoint
  ) {
    this._context = context;
    this._openai = openai;
    this._azureOpenAI = azureOpenAI;
    this._sharepoint = sharepoint;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.type === "analyzeError") {
        await this.handleError(data.error);
      }
    });
  }

  public async handleError(error: string) {
    if (!this._view) {
      return;
    }

    // Show loading state for both sources
    this._view.webview.postMessage({
      type: "loading",
      source: "both",
      message: "Analyzing error...",
    });

    try {
      // First analyze with Azure OpenAI for public sources
      const azureOpenAIResult = await this._azureOpenAI.analyzeError(error);

      // Show loading state for internal knowledge base
      this._view.webview.postMessage({
        type: "loading",
        source: "sharepoint",
        message: "Searching internal knowledge base...",
      });

      // Then search in SharePoint/Google Doc
      const sharepointResult = await this._sharepoint.searchKnowledgeBase(
        error
      );

      // Send results to webview with clear separation
      this._view.webview.postMessage({
        type: "results",
        openai: {
          success: true,
          content: azureOpenAIResult,
          isPublic: true,
        },
        sharepoint: {
          success: sharepointResult ? true : false,
          content: sharepointResult
            ? `# Internal Knowledge Base Solution\n\n${sharepointResult}`
            : "# Internal Knowledge Base\n\nNo solution found in internal knowledge base.",
          isInternal: true,
        },
      });
    } catch (error) {
      this._view.webview.postMessage({
        type: "error",
        message: "Failed to analyze error. Please try again.",
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "media", "styles.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "media", "main.js")
    );

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FlowFix Chat</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div class="chat-container">
                <div class="error-input">
                    <textarea id="errorInput" placeholder="Paste your error message here..."></textarea>
                    <button id="analyzeButton">Analyze Error</button>
                </div>
                
                <div class="results-container">
                    <div class="tab-container">
                        <button class="tab-button active" data-tab="openai">AI Analysis</button>
                        <button class="tab-button" data-tab="sharepoint">Internal Knowledge</button>
                    </div>
                    
                    <div class="tab-content">
                        <div id="openai" class="tab-pane active">
                            <div class="loading-spinner hidden">
                                <div class="spinner"></div>
                                <p>Analyzing with AI...</p>
                            </div>
                            <div class="result-content"></div>
                        </div>
                        
                        <div id="sharepoint" class="tab-pane">
                            <div class="loading-spinner hidden">
                                <div class="spinner"></div>
                                <p>Searching internal knowledge base...</p>
                            </div>
                            <div class="result-content"></div>
                        </div>
                    </div>
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
  }
}
