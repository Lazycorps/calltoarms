ARG NODE_VERSION=22

# Create build stage
FROM node:${NODE_VERSION}-slim AS build

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

ARG STEAM_API_KEY
ENV STEAM_API_KEY=$STEAM_API_KEY


# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le package.json et le package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Construire l'application Nuxt.js pour la production
RUN npm run build

# Étape 2 : Exécuter l'application
FROM node:22

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier uniquement les fichiers nécessaires du build précédent
COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules

# Exposer le port sur lequel l'application s'exécutera
EXPOSE 3000

# Lancer l'application Nuxt.js
CMD ["node", ".output/server/index.mjs"]
