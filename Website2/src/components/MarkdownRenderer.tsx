import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 focus:outline-none"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title="Copy code"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const MarkdownRenderer = ({ children }: { children: string }) => (
  <ReactMarkdown
    components={{
      h1: ({ node, ...props }) => (
        <h1 className="text-2xl font-bold mt-6 mb-2" {...props} />
      ),
      h2: ({ node, ...props }) => (
        <h2 className="text-xl font-semibold mt-5 mb-2" {...props} />
      ),
      h3: ({ node, ...props }) => (
        <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
      ),
      ul: ({ node, ...props }) => (
        <ul className="list-disc list-inside ml-6 my-2" {...props} />
      ),
      ol: ({ node, ...props }) => (
        <ol className="list-decimal list-inside ml-6 my-2" {...props} />
      ),
      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children).replace(/\n$/, "");
        if (inline) {
          return (
            <code
              className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <div className="relative my-4">
            <CopyButton text={codeString} />
            <SyntaxHighlighter
              style={oneDark}
              language={match ? match[1] : "bash"}
              PreTag="div"
              className="rounded-lg text-sm !bg-gray-900 !p-4"
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      },
      strong: ({ node, ...props }) => (
        <strong className="font-bold text-gray-900" {...props} />
      ),
      p: ({ node, ...props }) => (
        <p className="my-2 text-gray-800" {...props} />
      ),
    }}
  >
    {children}
  </ReactMarkdown>
);

export default MarkdownRenderer;
