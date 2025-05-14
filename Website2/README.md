# Centralized Solutioning Portal – FlowFix

## Overview

FlowFix is a centralized solutioning portal designed to provide intelligent, context-aware solutions for error messages and technical queries. It leverages both public and internal knowledge bases to deliver accurate, concise, and actionable responses.

## How It Works

### User Interaction

- Users input their error messages or queries through the main portal.
- The system processes the input and fetches solutions from two sources:
  - **Public Source**: Leverages Azure OpenAI to generate context-aware, concise responses. The system is instructed to include code examples only when relevant and to search the open internet for up-to-date information, including reference links if available.
  - **Internal Knowledge Base**: Utilizes vector search to find similar chunks from an internal knowledge base. If relevant information is found, it is formatted and returned to the user.

### Admin Portal & PDF Upload

- Administrators can upload PDF documents through the Admin Portal.
- Upon upload, the PDF is processed:
  - The document is split into chunks.
  - Each chunk is embedded using Azure OpenAI's embedding model.
  - The chunks and their embeddings are stored in MongoDB for future retrieval.
- This process enables the internal knowledge base to provide highly relevant, context-specific solutions based on the uploaded documentation.

## Tech Stack Used

- **Frontend**:
  - Next.js (React framework)
  - Tailwind CSS (styling)
  - React Icons (UI icons)
  - React Markdown (markdown rendering)
  - React Syntax Highlighter (code block formatting)
- **Backend**:
  - Next.js API Routes
  - Azure OpenAI (GPT-4 for response generation and embeddings)
  - MongoDB (vector search and document storage)
- **Utilities**:
  - LangChain (for OpenAI integration)
  - Vector search utilities (for semantic search)
  - PDF processing utilities (for document chunking and embedding)

## Key Features

- **Dual Knowledge Sources**: Combines public and internal knowledge bases for comprehensive solutions.
- **Context-Aware Responses**: Intelligently determines when to include code examples or external references.
- **Admin Portal**: Allows administrators to upload and manage internal documentation.
- **Vector Search**: Enables semantic search within the internal knowledge base for highly relevant results.
- **Modern UI**: Clean, responsive design with intuitive navigation and user-friendly interactions.

## Project Workflow

1. **User Input**: Users enter their error messages or queries on the main portal.
2. **Analysis**:
   - The system simultaneously queries the public source (Azure OpenAI) and the internal knowledge base (vector search).
   - Public responses are generated with context-aware formatting, including code examples and reference links if applicable.
   - Internal responses are retrieved based on semantic similarity to the query.
3. **Response Delivery**: The system presents the results in a structured, markdown-formatted response, with code blocks, headings, and lists styled for clarity.
4. **Admin Management**: Administrators can upload PDFs through the Admin Portal, which are processed, embedded, and stored for future retrieval.

## AI/ML Components

- **Azure OpenAI (GPT-4)**:
  - Used for generating context-aware, concise responses in the public source.
  - Instructed to include code examples only when relevant and to search for external references.
- **Azure OpenAI Embeddings**:
  - Used to convert PDF chunks into vector embeddings for semantic search.
- **Vector Search**:
  - Implemented in MongoDB to perform semantic search within the internal knowledge base.
  - Enables retrieval of highly relevant document chunks based on query similarity.
- **LangChain**:
  - Facilitates integration with Azure OpenAI for both response generation and embeddings.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (for vector search and document storage)
- Azure OpenAI API key and endpoint

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Website2
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:
   ```
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key
   AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
   MONGODB_URI=your_mongodb_uri
   ```
2. Ensure MongoDB is running and accessible.

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
2. Open your browser and navigate to `http://localhost:3000`.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request.

## Conclusion

FlowFix is a powerful, intelligent solutioning portal that combines the best of public and internal knowledge to deliver accurate, context-aware responses. Its modern tech stack, robust AI/ML components, and user-friendly design make it an invaluable tool for both technical and business stakeholders.
