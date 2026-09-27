# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json .npmrc ./

RUN npm install --no-audit --no-fund


FROM node:24-bookworm-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are embedded into the browser bundle at build time.
# Pass them with docker build --build-arg ... in production.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_AR_TARGET_URL
ARG NEXT_PUBLIC_AR_TARGET_IMAGE_URL
ARG NEXT_PUBLIC_AR_TARGET_INDEX=0
ARG NEXT_PUBLIC_AR_OVERLAY_VIDEO_URL
ARG NEXT_PUBLIC_AR_OVERLAY_ASPECT_RATIO=1.8116

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_AR_TARGET_URL=$NEXT_PUBLIC_AR_TARGET_URL
ENV NEXT_PUBLIC_AR_TARGET_IMAGE_URL=$NEXT_PUBLIC_AR_TARGET_IMAGE_URL
ENV NEXT_PUBLIC_AR_TARGET_INDEX=$NEXT_PUBLIC_AR_TARGET_INDEX
ENV NEXT_PUBLIC_AR_OVERLAY_VIDEO_URL=$NEXT_PUBLIC_AR_OVERLAY_VIDEO_URL
ENV NEXT_PUBLIC_AR_OVERLAY_ASPECT_RATIO=$NEXT_PUBLIC_AR_OVERLAY_ASPECT_RATIO

RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund


FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.npmrc ./.npmrc
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 8080

CMD ["npm", "start"]
