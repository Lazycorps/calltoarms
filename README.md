# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Docker Deployment

### Building the Docker Image

Build the Docker image with all required environment variables:

```bash
docker build \
  --build-arg DATABASE_URL="postgresql://username:password@host:5432/calltoarms?schema=public" \
  --build-arg DIRECT_URL="postgresql://username:password@host:5432/calltoarms?schema=public" \
  --build-arg SUPABASE_URL="https://your-supabase-url.supabase.co" \
  --build-arg SUPABASE_KEY="your-supabase-key" \
  --build-arg TWITCH_TOKEN="your-twitch-token" \
  --build-arg TWITCH_SECRET="your-twitch-secret" \
  --build-arg TWITCH_CLIENT_ID="your-twitch-client-id" \
  --build-arg FIREBASE_API_KEY="your-firebase-api-key" \
  --build-arg FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com" \
  --build-arg FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com" \
  --build-arg FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id" \
  --build-arg FIREBASE_APP_ID="your-app-id" \
  --build-arg FIREBASE_VAPID_KEY="your-vapid-key" \
  --build-arg FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com" \
  --build-arg FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n" \
  -t calltoarms:latest .
```

### Running the Docker Container

Run the Docker container:

```bash
docker run -p 3000:3000 calltoarms:latest
```

You can also override environment variables at runtime:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://username:password@new-host:5432/calltoarms?schema=public" \
  calltoarms:latest
```

### Using Environment Files

For convenience, you can create a `.env` file with all your environment variables and use it when building the image:

```bash
docker build --env-file .env -t calltoarms:latest .
```

And when running the container:

```bash
docker run -p 3000:3000 --env-file .env calltoarms:latest
```
