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

# Accept build arguments (secrets should be passed at runtime via --build-arg)
# These are only used during build and won't be in the final image
ARG DATABASE_URL
ARG SMTP_HOST=smtp.gmail.com
ARG SMTP_PORT=587
ARG SMTP_SECURE=false
ARG SMTP_USER
ARG SMTP_PASS
ARG NEXTAUTH_URL=http://localhost:3000
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG RESEND_API_KEY
ARG JWT_SECRET
ARG NEXTAUTH_SECRET
ARG EMAIL_FROM=onboarding@resend.dev
ARG RESEND_BASE_URL=https://api.resend.com
ARG PRISMA_CLI_BINARY_TARGETS=linux-musl

# Set environment variables for build (only during build stage)
ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}
ENV SMTP_HOST=${SMTP_HOST}
ENV SMTP_PORT=${SMTP_PORT}
ENV SMTP_SECURE=${SMTP_SECURE}
ENV SMTP_USER=${SMTP_USER}
ENV SMTP_PASS=${SMTP_PASS}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
ENV CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
ENV CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV EMAIL_FROM=${EMAIL_FROM}
ENV RESEND_BASE_URL=${RESEND_BASE_URL}
ENV PRISMA_CLI_BINARY_TARGETS=${PRISMA_CLI_BINARY_TARGETS}

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
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
