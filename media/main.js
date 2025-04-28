(function () {
  const vscode = acquireVsCodeApi();
  const errorInput = document.getElementById("errorInput");
  const analyzeButton = document.getElementById("analyzeButton");
  const openaiTab = document.getElementById("openai");
  const sharepointTab = document.getElementById("sharepoint");
  const tabButtons = document.querySelectorAll(".tab-button");
  const loadingElement = document.getElementById("loading");
  const responseElement = document.getElementById("response");
  const openaiResponseElement = document.getElementById("openaiResponse");
  const sharepointResponseElement =
    document.getElementById("sharepointResponse");

  // Handle tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      document.querySelectorAll(".tab-pane").forEach((pane) => {
        pane.classList.remove("active");
      });
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Handle analyze button click
  analyzeButton.addEventListener("click", () => {
    const errorMessage = errorInput.value.trim();
    if (errorMessage) {
      vscode.postMessage({
        type: "analyzeError",
        error: errorMessage,
      });
    }
  });

  // Handle messages from the extension
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "loading":
        document.querySelectorAll(".loading-spinner").forEach((spinner) => {
          spinner.classList.toggle("hidden", message.source !== "both");
        });
        responseElement.classList.toggle("hidden", message.value);
        break;
      case "results":
        handleResults(message);
        responseElement.classList.remove("hidden");
        break;
      case "error":
        const errorContent = document.querySelector(".result-content");
        errorContent.innerHTML = `<div class="error-message">${message.message}</div>`;
        responseElement.classList.remove("hidden");
        break;
    }
  });

  function handleResults(message) {
    // Update OpenAI tab content
    const openaiContent = document.querySelector("#openai .result-content");
    openaiContent.innerHTML = `
      <div class="result-section">
        <h3>AI Analysis (Public Sources)</h3>
        <div class="content">
          ${formatContent(message.openai.content)}
        </div>
      </div>
    `;

    // Update SharePoint tab content
    const sharepointContent = document.querySelector(
      "#sharepoint .result-content"
    );
    sharepointContent.innerHTML = `
      <div class="result-section">
        <h3>Internal Knowledge Base</h3>
        <div class="content">
          ${formatContent(message.sharepoint.content)}
        </div>
      </div>
    `;

    // Show the response container
    responseElement.classList.remove("hidden");
  }

  function formatContent(content) {
    // Split content into sections
    const sections = content.split(/(?=#\s)/);
    return sections
      .map((section) => {
        const [header, ...body] = section.split("\n");
        return `
          <div class="content-section">
            <h4>${header.trim()}</h4>
            <div class="section-body">
              ${body.join("\n").trim()}
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Add styles for better formatting
  const style = document.createElement("style");
  style.textContent = `
    .result-section {
      margin-bottom: 2rem;
      padding: 1rem;
      border-radius: 4px;
      background: var(--vscode-editor-background);
    }

    .result-section h3 {
      color: var(--vscode-textLink-foreground);
      margin-bottom: 1rem;
    }

    .content-section {
      margin-bottom: 1rem;
    }

    .content-section h4 {
      color: var(--vscode-textLink-foreground);
      margin-bottom: 0.5rem;
    }

    .section-body {
      color: var(--vscode-editor-foreground);
      white-space: pre-wrap;
    }

    .section-body code {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 0.2rem 0.4rem;
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);

  // Handle initial state
  vscode.postMessage({ type: "ready" });
})();
