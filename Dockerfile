# Use the official Node.js 18 image as the base image
FROM node:18 AS base

# Install dependencies only when needed
FROM base AS deps
# Install system dependencies
RUN apt-get update && apt-get install -y \
    libc6-dev \
    openssl \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Copy Prisma schema before installing dependencies
COPY prisma ./prisma

# Install dependencies (this will skip the postinstall hook that needs the schema)
RUN npm ci --ignore-scripts

# Now run prisma generate separately
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://neondb_owner:npg_s0i7MxjcIhCd@ep-late-dust-a17jlpvf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
ENV SMTP_HOST="smtp.gmail.com"
ENV SMTP_PORT="587"
ENV SMTP_SECURE="false"
ENV SMTP_USER="devloperabuhuraira@gmail.com"
ENV SMTP_PASS="uwosiveywevwrfdl"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV CLOUDINARY_CLOUD_NAME="dz0azrpke"
ENV CLOUDINARY_API_KEY="461621934977911"
ENV CLOUDINARY_API_SECRET="Yb_OCqvfW-CRwFUecDcT5qREsl0"
ENV RESEND_API_KEY="re_ACPKBocu_JwYQ8M3FNAFGPVrupbHSFpZb"
ENV JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
ENV NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"
ENV NODE_ENV=production
ENV EMAIL_FROM="onboarding@resend.dev"
ENV RESEND_BASE_URL="https://api.resend.com" 
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl"

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Install curl for health checks and OpenSSL for Prisma
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy package.json for runtime dependencies
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
