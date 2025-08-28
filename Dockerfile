# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Иногда Prisma на Alpine требует эти либы (musl совместимость)
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

# ВАЖНО: prisma до generate
COPY prisma ./prisma
RUN npx prisma generate

# Остальной код
COPY . .

# Сборка
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app

# Для Prisma runtime (движки), чаще всего хватает openssl + libc6-compat
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Копируем собранный dist и нужные ресурсы
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# SSR шаблоны и статика НУЖНЫ в рантайме
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/static ./static
COPY --from=builder /app/prisma ./prisma

CMD ["node", "dist/main.js"]