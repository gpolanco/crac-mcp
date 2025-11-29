# Multi-stage build para optimizar el tamaño de la imagen
FROM node:20-slim AS builder

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN pnpm install --frozen-lockfile

# Copiar código fuente y configuración
COPY . .

# Construir el servidor MCP (compila TypeScript)
RUN pnpm run build

# Stage de producción
FROM node:20-slim AS production

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo archivos necesarios para producción
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Copiar el build desde el stage anterior
COPY --from=builder /app/dist ./dist

# Exponer el puerto (Railway asigna dinámicamente, pero 3000 es el default)
ENV PORT=3000
EXPOSE 3000

# Variables de entorno opcionales
ENV NODE_ENV=production

# Comando para ejecutar el servidor
CMD ["node", "dist/server.js"]

