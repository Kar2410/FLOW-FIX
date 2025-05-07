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

# FlowFix Web Application - Office Setup Guide

A web-based error analysis tool that combines public sources and internal knowledge base to provide comprehensive error solutions.

## Prerequisites

- Docker Desktop installed
- Access to UHC Docker Hub repository
- Azure OpenAI API credentials
- Network access to required services

## Project Structure

```
website/
├── frontend/          # React frontend application
├── backend/           # Express backend server
├── docker-compose.uhc.yml  # Docker configuration for UHC environment
└── README.md         # This file
```

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGO_ROOT_USERNAME=your_username
MONGO_ROOT_PASSWORD=your_password

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

## Installation Steps

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd website
   ```

2. **Build and Start the Application**

   ```bash
   # Start all services
   docker-compose -f docker-compose.uhc.yml up -d

   # View logs
   docker-compose -f docker-compose.uhc.yml logs -f
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Database Configuration

The application uses UHC's internal MongoDB image:

- Image: `docker-hub.repo1.uhc.com/mongodb/mongodb-atlas-local:latest`
- Port: 27017
- Database Name: flowfix
- Authentication: Enabled with username/password

## Troubleshooting

### Common Issues

1. **Docker Container Issues**

   ```bash
   # Check container status
   docker ps -a

   # View container logs
   docker-compose -f docker-compose.uhc.yml logs -f [service-name]
   ```

2. **MongoDB Connection Issues**

   - Verify MongoDB credentials in .env file
   - Check if MongoDB container is running
   - Ensure network connectivity to MongoDB

3. **Application Access Issues**
   - Verify all containers are running
   - Check port availability
   - Ensure proper network configuration

### Container Management

```bash
# Stop all services
docker-compose -f docker-compose.uhc.yml down

# Restart specific service
docker-compose -f docker-compose.uhc.yml restart [service-name]

# Remove all containers and volumes
docker-compose -f docker-compose.uhc.yml down -v
```

## Security Notes

1. Never commit sensitive information to version control
2. Keep your .env file secure and local
3. Regularly update Docker images and dependencies
4. Follow UHC security policies for data handling

## Support

For technical support or issues:

1. Check the troubleshooting guide above
2. Review application logs
3. Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.
