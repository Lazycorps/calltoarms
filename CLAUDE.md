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
- `/app` - Frontend Vue application
  - `/components` - Reusable Vue components organized by feature
  - `/pages` - File-based routing pages
  - `/stores` - Pinia stores for state management
  - `/composables` - Vue composables for shared logic (Firebase, utils)
  - `/layouts` - Application layouts
  - `/plugins` - Nuxt plugins (Firebase, Vuetify)
- `/server` - Backend API routes and utilities
  - `/api` - REST API endpoints organized by resource
    - `/admin` - Admin game management endpoints
    - `/games` - Game data endpoints
    - `/notifications` - Notification system endpoints
    - `/user` - User management and library endpoints
  - `/middleware` - Server middleware (auth)
  - `/utils` - Server utilities including gaming platform services
- `/prisma` - Database schema and migrations
- `/shared` - Shared TypeScript models, DTOs between frontend and backend
  - `/models` - Core data models
  - `/utils` - Shared utilities
- `/docs` - Platform integration documentation

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

Required environment variables:
- **Database**: `DATABASE_URL`, `DIRECT_URL`
- **Auth**: `SUPABASE_URL`, `SUPABASE_KEY`
- **Firebase**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_VAPID_KEY`
- **Gaming APIs**: `STEAM_API_KEY`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`
- **Twitch**: `TWITCH_CLIENT_ID`, `TWITCH_SECRET`, `TWITCH_TOKEN`
- **General**: `BASE_URL`

### Development Notes

- SSR is disabled (`ssr: false` in nuxt.config.ts)
- Uses Prisma for type-safe database access
- Vuetify for Material Design UI components
- No test framework currently configured
- Using Nuxt 4 with Vue 3 Composition API
- ESLint configured for code quality

## Development Best Practices

### Code Structure and Conventions

1. **Components**: Use PascalCase for Vue components (`GameCard.vue`, `FriendsList.vue`)
2. **Composables**: Use camelCase with `use` prefix (`useFirebase.ts`, `useColorGenerator.ts`)
3. **Stores**: Use camelCase with descriptive names (`user.ts`, `gamingPlatforms.ts`)
4. **API Routes**: Follow RESTful conventions in `/server/api/`
5. **TypeScript**: All components use `<script setup lang="ts">` and strict typing

### Gaming Platform Integration

- Platform services extend abstract `PlatformService` base class
- Each platform (Steam, PlayStation, Xbox) has dedicated service classes
- Authentication and game syncing handled per platform
- Gaming data stored in PostgreSQL via Prisma

### Authentication & Security

- Supabase Auth for user management
- Server middleware validates auth tokens for protected routes
- Gaming platform credentials stored securely in database
- FCM tokens managed for push notifications

### API Response Format

- All API controllers return DTOs from `/shared/` directory
- Consistent error handling with proper HTTP status codes
- Use `createError()` for server-side error responses

### Component Organization

- `/components/friends/` - Friend management components
- `/components/game/` - Game-related UI components  
- `/components/library/` - Gaming library and platform connectors
- `/components/notifications/` - Notification system UI

### Firebase Integration

- Cloud Messaging for real-time notifications
- Admin SDK for server-side Firebase operations
- Client-side messaging handled via composables