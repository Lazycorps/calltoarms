# Use Node.js as the base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy built application from build stage
COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

# Environment variables
# Database
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG DIRECT_URL
ENV DIRECT_URL=$DIRECT_URL

# Supabase
ARG SUPABASE_URL
ENV SUPABASE_URL=$SUPABASE_URL
ARG SUPABASE_KEY
ENV SUPABASE_KEY=$SUPABASE_KEY

# Twitch
ARG TWITCH_TOKEN
ENV TWITCH_TOKEN=$TWITCH_TOKEN
ARG TWITCH_SECRET
ENV TWITCH_SECRET=$TWITCH_SECRET
ARG TWITCH_CLIENT_ID
ENV TWITCH_CLIENT_ID=$TWITCH_CLIENT_ID

# Firebase Web SDK (Client-side)
ARG FIREBASE_API_KEY
ENV FIREBASE_API_KEY=$FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ENV FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ENV FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ENV FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ENV FIREBASE_APP_ID=$FIREBASE_APP_ID
ARG FIREBASE_VAPID_KEY
ENV FIREBASE_VAPID_KEY=$FIREBASE_VAPID_KEY

# Firebase Admin SDK (Server-side)
ARG FIREBASE_CLIENT_EMAIL
ENV FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY
ENV FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD ["node", ".output/server/index.mjs"]
