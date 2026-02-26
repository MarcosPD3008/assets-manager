# ============================================
# NestJS API - Multi-stage Dockerfile
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Build de la aplicación API
RUN npx nx build api --configuration=production

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar solo los archivos necesarios
COPY --from=builder /app/dist/src/apps/api ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Cambiar al usuario no-root
USER nestjs

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main.js"]
