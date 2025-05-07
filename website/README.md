# Error Solver Web Application

A web-based error analysis tool that combines public sources and internal knowledge base to provide comprehensive error solutions.

## Features

- Error analysis with AI-powered solutions
- Internal knowledge base management
- PDF document upload and processing
- Vector-based semantic search
- Clean and intuitive user interface

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or accessible via connection string)
- Azure OpenAI API credentials

## Project Structure

```
website/
├── frontend/          # React frontend application
├── backend/           # Express backend server
└── README.md         # This file
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:

   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/error-solver
   AZURE_OPENAI_API_KEY=your_api_key
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   AZURE_OPENAI_INSTANCE_NAME=your_instance_name
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## Usage

### User Interface

1. Navigate to the home page
2. Paste your error message in the input field
3. Click "Analyze Error"
4. View solutions from both public sources and internal knowledge base

### Admin Interface

1. Navigate to the admin panel
2. Upload PDF documents to expand the internal knowledge base
3. Manage existing documents (view, delete)
4. Monitor document processing status

## API Endpoints

### Error Analysis

- `POST /api/error/analyze` - Analyze error message

### Admin Operations

- `POST /api/admin/upload` - Upload new document
- `GET /api/admin/documents` - List all documents
- `DELETE /api/admin/documents/:id` - Delete document

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## DOCKER

Open a terminal in the website/backend directory and run:

docker-compose up -d

This will:
Pull the MongoDB Docker image if you don't have it
Create a container named error-solver-mongodb
Start MongoDB on port 27017
Create a persistent volume for your data

backend code is already configured to connect to this MongoDB instance through this line in index.ts:

mongoose.connect("mongodb://localhost:27017/error-solver")

To manage the MongoDB container:

To stop it: docker-compose down
To view logs: docker-compose logs mongodb
To restart it: docker-compose restart

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# FlowFix Web Application - Docker Setup Guide

This guide provides detailed instructions for setting up the FlowFix web application using Docker, with options for both standard MongoDB and UHC MongoDB configurations.

## Prerequisites

- Docker and Docker Compose installed
- Access to UHC Docker Hub repository (for UHC MongoDB setup)
- Azure OpenAI API credentials
- MongoDB connection string

## Docker Setup Options

### 1. Standard MongoDB Setup

This setup uses the official MongoDB image from Docker Hub.

#### Configuration

```yaml
# docker-compose.standard.yml
version: "3.8"

services:
  mongodb:
    image: mongo:latest
    container_name: flowfix-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: flowfix-backend
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/flowfix?authSource=admin
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
      - AZURE_OPENAI_DEPLOYMENT_NAME=${AZURE_OPENAI_DEPLOYMENT_NAME}
    depends_on:
      - mongodb

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: flowfix-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### Running the Standard Setup

```bash
# Start the services
docker-compose -f docker-compose.standard.yml up -d

# Stop the services
docker-compose -f docker-compose.standard.yml down

# View logs
docker-compose -f docker-compose.standard.yml logs -f
```

### 2. UHC MongoDB Setup

This setup uses the UHC-specific MongoDB image with additional security configurations.

#### Configuration

```yaml
# docker-compose.uhc.yml
version: "3.8"

services:
  mongodb:
    image: docker-hub.repo1.uhc.com/mongodb/mongodb-atlas-local:latest
    container_name: flowfix-mongodb-uhc
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=flowfix
    networks:
      - flowfix-network

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: flowfix-backend-uhc
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/flowfix?authSource=admin
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
      - AZURE_OPENAI_DEPLOYMENT_NAME=${AZURE_OPENAI_DEPLOYMENT_NAME}
    depends_on:
      - mongodb
    networks:
      - flowfix-network

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: flowfix-frontend-uhc
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - flowfix-network

networks:
  flowfix-network:
    driver: bridge

volumes:
  mongodb_data:
```

#### Environment Variables

Create a `.env` file in the website directory:

```env
# MongoDB Configuration
MONGO_ROOT_USERNAME=your_username
MONGO_ROOT_PASSWORD=your_password

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

#### Running the UHC Setup

```bash
# Login to UHC Docker Hub (if not already logged in)
docker login docker-hub.repo1.uhc.com

# Start the services
docker-compose -f docker-compose.uhc.yml up -d

# Stop the services
docker-compose -f docker-compose.uhc.yml down

# View logs
docker-compose -f docker-compose.uhc.yml logs -f
```

## Key Differences Between Setups

### Standard MongoDB

- Uses official MongoDB image
- Basic security configuration
- Suitable for development and testing
- Publicly accessible image

### UHC MongoDB

- Uses UHC-specific MongoDB image
- Enhanced security configurations
- Pre-configured for UHC environment
- Requires UHC Docker Hub access
- Additional network isolation
- Environment variable-based configuration

## Maintenance Commands

### View Container Status

```bash
docker ps
```

### View Container Logs

```bash
# All containers
docker-compose -f docker-compose.uhc.yml logs

# Specific service
docker-compose -f docker-compose.uhc.yml logs mongodb
```

### Clean Up

```bash
# Stop and remove containers
docker-compose -f docker-compose.uhc.yml down

# Remove volumes
docker-compose -f docker-compose.uhc.yml down -v

# Remove images
docker rmi flowfix-frontend flowfix-backend
```

## Troubleshooting

1. **Connection Issues**

   - Verify MongoDB connection string
   - Check network connectivity
   - Ensure proper authentication credentials

2. **Container Startup Failures**

   - Check container logs
   - Verify environment variables
   - Ensure proper Docker Hub access

3. **Data Persistence**
   - Data is stored in Docker volumes
   - Backup data before removing volumes
   - Use volume inspection for debugging

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for MongoDB
- Regularly update Docker images
- Monitor container logs for security issues
- Use network isolation for production deployments
