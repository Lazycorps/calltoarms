# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Call to Arms is a Nuxt 4 social gaming platform that allows users to:
- Connect gaming platforms (Steam, PlayStation, etc.)
- Track games and playtime across platforms
- Send notifications to friends about gaming sessions
- Manage friend relationships

## Essential Commands

### Development
```bash
npm install          # Install dependencies
npm run dev         # Start development server on http://localhost:3000
```

### Building
```bash
npm run build       # Build for production
npm run preview     # Preview production build locally
```

### Database
```bash
npx prisma migrate dev     # Run database migrations
npx prisma generate        # Generate Prisma client
npx prisma studio         # Open Prisma Studio for database management
```

## Architecture

### Tech Stack
- **Frontend**: Nuxt 4, Vue 3, Vuetify 3, Pinia
- **Backend**: Nuxt server API routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Notifications**: Firebase Cloud Messaging
- **Gaming APIs**: Steam Web API, PlayStation Network API

### Directory Structure
- `/app` - Frontend Vue components and pages
  - `/components` - Reusable components organized by feature
  - `/pages` - Route-based pages using Nuxt file routing
  - `/stores` - Pinia stores for state management
  - `/composables` - Vue composables for shared logic
- `/server` - Backend API routes and utilities
  - `/api` - REST API endpoints organized by resource
  - `/middleware` - Server middleware (auth)
  - `/utils` - Server utilities including gaming platform services
- `/prisma` - Database schema and migrations
- `/shared` - Shared TypeScript models between frontend and backend

### Key Architectural Patterns

1. **Gaming Platform Abstraction**: Uses abstract `PlatformService` base class to handle multiple gaming platforms uniformly. Each platform (Steam, PlayStation) implements this interface.

2. **API Structure**: RESTful endpoints follow pattern `/api/[resource]/[action].[method].ts`
   - Example: `/api/platforms/steam/sync.post.ts`

3. **Authentication Flow**: 
   - Supabase handles user authentication
   - Server middleware validates auth tokens
   - Gaming platform credentials stored separately in database

4. **Real-time Features**: Firebase Cloud Messaging for push notifications

### Environment Variables

Required environment variables (see README.md for full list):
- Database: `DATABASE_URL`, `DIRECT_URL`
- Auth: `SUPABASE_URL`, `SUPABASE_KEY`
- Firebase: `FIREBASE_*` (multiple keys)
- Gaming: `STEAM_API_KEY`, platform-specific keys

### Development Notes

- SSR is disabled (`ssr: false` in nuxt.config.ts)
- Uses Prisma for type-safe database access
- Vuetify for Material Design UI components
- No test framework currently configured