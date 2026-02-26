# ============================================
# Angular Web - Multi-stage Dockerfile
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

# Build de la aplicación Angular
RUN npx nx build web --configuration=production

# Stage 2: Production con Nginx
FROM nginx:alpine AS production

# Copiar configuración personalizada de nginx
COPY src/apps/web/nginx.conf /etc/nginx/nginx.conf

# Copiar los archivos build de Angular
COPY --from=builder /app/dist/src/apps/web/browser /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Nginx ya corre como proceso principal
CMD ["nginx", "-g", "daemon off;"]
