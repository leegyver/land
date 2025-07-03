# Real Estate Management System

## Overview

This is a comprehensive real estate management system built with React, Express, and PostgreSQL. The application provides a modern web interface for property listings, user authentication, content management, and administrative features. It's designed specifically for Korean real estate markets with features like Korean address handling, property type management, and localized content.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with multiple strategies (Local, Naver, Kakao)
- **Session Management**: Express-session with PostgreSQL store
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Architecture**: RESTful API with structured error handling

### Database Schema
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Tables**: Properties, Users, News, Property Inquiries, Favorites
- **Migrations**: Drizzle-kit for schema migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Property Management
- Comprehensive property schema with Korean real estate specifics
- Multiple image support with featured image selection
- Property types: 토지, 주택, 아파트연립다세대, 원투룸, 상가공장창고펜션
- District-based filtering with Korean administrative divisions
- Price range filtering with Korean currency formatting

### User Authentication
- Multi-provider authentication (Local, Naver, Kakao)
- Role-based access control (admin/user)
- Session-based authentication with secure cookies
- Protected routes for admin functionality

### Content Management
- News aggregation from Naver API
- Blog post integration with Naver Blog
- YouTube video integration
- Real estate transaction data from government APIs

### Administrative Features
- Property CRUD operations
- User management
- News content management
- Google Sheets import functionality
- Bulk operations for data management

## Data Flow

### Client-Server Communication
1. React frontend makes API calls through TanStack Query
2. Express server handles authentication and authorization
3. Database operations through Drizzle ORM
4. Response data flows back through the same pipeline

### External API Integration
- **Naver APIs**: News search, blog posts, social authentication
- **Kakao APIs**: Social authentication, map services
- **Government APIs**: Real estate transaction data
- **YouTube API**: Video content integration

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React-DOM, React-Router via Wouter)
- Express.js with middleware stack
- PostgreSQL with Neon serverless driver
- Drizzle ORM for database operations

### Authentication Services
- Passport.js with strategies for Naver and Kakao
- Session management with connect-pg-simple

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- Shadcn/UI component library
- Lucide React for iconography

### External APIs
- Naver Developer APIs (News, Blog, Authentication)
- Kakao Developers APIs (Authentication, Maps)
- Korea Data Portal APIs (Real estate data)
- YouTube Data API v3

## Deployment Strategy

### Build Process
1. Frontend: Vite builds React app to `dist/public`
2. Backend: esbuild bundles server code to `dist/index.js`
3. Database: Drizzle migrations applied via `db:push`

### Environment Configuration
- Development: Uses tsx for TypeScript execution
- Production: Node.js runs bundled JavaScript
- Database: Requires `DATABASE_URL` environment variable
- API Keys: Multiple external service keys required

### File Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
├── server/          # Express backend
│   ├── routes.ts
│   ├── auth.ts
│   ├── storage.ts
│   └── db.ts
├── shared/          # Shared types and schemas
│   └── schema.ts
└── migrations/      # Database migrations
```

## Changelog

Changelog:
- July 03, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.