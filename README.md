# FlowFix - AI-Powered Error Assistant for VS Code

FlowFix is a VS Code extension that helps developers quickly understand and fix errors by providing AI-powered analysis and solutions.

## Features

- Automatic error detection from the Problems panel
- Manual error input through a chat interface
- AI-powered error analysis using OpenAI's GPT-4
- Internal knowledge base search through SharePoint
- Beginner-friendly error explanations
- Code snippet suggestions
- Dark/light theme support

## Installation

1. Install the extension from the VS Code marketplace
2. Configure your OpenAI API key:
   - Open VS Code Settings (Ctrl+,)
   - Search for "FlowFix"
   - Enter your OpenAI API key in the "OpenAI API Key" field
3. (Optional) Configure your SharePoint URL for internal knowledge base access

## Usage

### Automatic Error Detection

FlowFix automatically detects errors in your code and provides solutions when:

- New errors appear in the Problems panel
- You save a file with errors
- You run code with errors

### Manual Error Analysis

1. Open the FlowFix panel:
   - Click the FlowFix icon in the Activity Bar
   - Or use the command palette (Ctrl+Shift+P) and type "FlowFix: Open Chat"
2. Paste your error message in the input box
3. Click "Analyze Error" to get solutions

### Command Palette Commands

- `FlowFix: Fix Current Error` - Analyze the current error in the active editor
- `FlowFix: Open Chat` - Open the FlowFix chat interface

## Configuration

You can configure FlowFix through VS Code settings:

- `flowfix.openaiApiKey`: Your OpenAI API key
- `flowfix.sharepointUrl`: URL to your internal knowledge base
- `flowfix.autoFetch`: Enable/disable automatic error detection
- `flowfix.modelTemperature`: Control the creativity of AI responses (0-1)

## Requirements

- VS Code 1.85.0 or higher
- OpenAI API key
- (Optional) SharePoint URL for internal knowledge base

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

### Docker Setup

1. Build the Docker images:

```bash
# Build backend image
docker build -t flowfix-backend ./backend

# Build frontend image
docker build -t flowfix-frontend ./frontend
```

2. Run the containers:

```bash
# Option 1: Run standard MongoDB container
docker run -d --name flowfix-mongodb -p 27017:27017 mongo:latest

# Option 2: Run UHC MongoDB container (if you have access to UHC's Docker Hub)
docker run -d --name flowfix-mongodb -p 27017:27017 docker-hub.repo1.uhc.com/mongodb/mongodb-atlas-local:latest

# Run backend container
docker run -d --name flowfix-backend -p 3000:3000 --env-file .env flowfix-backend

# Run frontend container
docker run -d --name flowfix-frontend -p 5173:5173 flowfix-frontend
```
