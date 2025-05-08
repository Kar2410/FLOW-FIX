# FlowFix Web Application

A web-based version of the FlowFix error analysis tool that provides solutions from both public sources and internal knowledge base.

## Features

- User Interface:

  - Error message analysis
  - Solutions from public sources
  - Solutions from internal knowledge base
  - Clean and intuitive design

- Admin Interface:
  - PDF document upload
  - Internal knowledge base management
  - Document status tracking

## Prerequisites

- Node.js 18.x or later
- MongoDB (local or Atlas)
- Azure OpenAI API access
- OpenAI API access (optional, as fallback)

## Setup

1. Clone the repository and install dependencies:

   ```bash
   cd Website2
   npm install
   ```

2. Create a `.env.local` file in the root directory with the following variables:

   ```
    # MongoDB Configuration
    MONGODB_URI=mongodb://localhost:27017/flowfix

    # Azure OpenAI Configuration
    AZURE_OPENAI_API_KEY=your_azure_openai_api_key
    AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
    AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-deployment  # For chat completions
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002  # For embeddings
   ```

3. Set up MongoDB:

   - Install MongoDB locally or use MongoDB Atlas
   - Create a database named `flowfix`
   - Create a collection named `documents`
   - Create a vector search index on the `embedding` field

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Website2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   ├── upload/
│   │   │   └── documents/
│   │   ├── user/
│   │   └── admin/
│   ├── components/
│   ├── lib/
│   └── utils/
├── public/
└── package.json
```

## API Endpoints

- `POST /api/analyze`: Analyze error messages
- `POST /api/upload`: Upload PDF documents
- `DELETE /api/documents/[id]`: Delete documents

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- MongoDB
- Azure OpenAI
- LangChain
- React Dropzone

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
