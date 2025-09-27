# Overview

DataExtract Pro is an AI-powered document data extraction web application that processes PDF, JPG, and PNG files to extract structured data. The application uses a full-stack TypeScript architecture with React frontend and Express.js backend, leveraging AI providers (OpenAI GPT-5 and Google Gemini) for intelligent document processing. Users can upload documents, configure extraction settings, and export results in multiple formats (JSON, CSV, Markdown).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack React Query for server state and async operations
- **Routing**: Wouter for lightweight client-side routing
- **File Structure**: Client code organized in `/client` directory with components, pages, hooks, and utilities

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with structured endpoints for document upload, extraction jobs, and result retrieval
- **File Handling**: Multer middleware for multipart file uploads with validation
- **Storage Layer**: Abstracted storage interface (`IStorage`) with in-memory implementation for development
- **AI Integration**: Pluggable AI provider system supporting OpenAI GPT-5 and Google Gemini
- **Document Processing**: Asynchronous job-based processing with progress tracking and status updates

### Database Schema Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in shared directory for type safety across frontend/backend
- **Tables**: Users, Documents, ExtractionJobs, SchemaTemplates with proper foreign key relationships
- **Migration**: Managed through Drizzle Kit with schema versioning
- **Database**: PostgreSQL provisioned and configured for Replit environment

### Shared Type System
- **Schema Validation**: Zod schemas for runtime type validation
- **Type Sharing**: Common types and schemas shared between client and server via `/shared` directory
- **API Contracts**: Strongly typed request/response interfaces

### Development and Build System
- **Build Tool**: Vite for frontend bundling with React plugin
- **TypeScript**: Strict configuration with path mapping for imports
- **Development**: Hot module replacement and development server integration
- **Production**: Optimized builds with code splitting and asset optimization

## External Dependencies

### AI Services
- **OpenAI API**: GPT-5 model for document analysis and data extraction
- **Google Gemini API**: Alternative AI provider for document processing
- **Integration**: Configurable AI provider selection with consistent interface

### Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Connection**: Environment-based configuration with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations

### File Storage
- **Local Storage**: Multer disk storage for uploaded files during development
- **File Validation**: MIME type checking for PDF, JPG, PNG formats
- **Size Limits**: 10MB maximum file size with proper error handling

### Authentication Infrastructure
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **User Management**: Basic user authentication system with username/password

### Development Tools
- **Replit Integration**: Specialized Replit plugins for development environment
- **Error Handling**: Runtime error overlay and development banner
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode

## Recent Changes

### Replit Environment Setup (September 21, 2025)
- ✅ Successfully configured for Replit environment with proper host settings (0.0.0.0:5000)
- ✅ PostgreSQL database provisioned and schema deployed using Drizzle Kit
- ✅ Workflow configured for frontend webview on port 5000
- ✅ All dependencies properly installed and working (tsx, canvas, etc.)
- ✅ API endpoints tested and responding correctly
- ✅ Deployment configuration set up for autoscale with npm build/start scripts
- ✅ Frontend configured to trust Replit proxy with allowedHosts: true setting