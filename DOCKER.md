# Guía de Docker para crac-mcp

## Construir la imagen

```bash
docker build -t crac-mcp:latest .
```

## Ejecutar el contenedor

### Opción 1: Docker run

```bash
docker run -d \
  --name crac-mcp \
  -p 8081:8081 \
  -e NODE_ENV=production \
  crac-mcp:latest
```

### Opción 2: Docker Compose (recomendado)

```bash
docker-compose up -d
```

Para ver los logs:

```bash
docker-compose logs -f
```

Para detener:

```bash
docker-compose down
```

## Verificar que funciona

```bash
curl -X POST "http://localhost:8081/mcp?debug=false" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

## Publicar la imagen

### Docker Hub

```bash
# Login
docker login

# Tag la imagen
docker tag crac-mcp:latest tu-usuario/crac-mcp:latest

# Push
docker push tu-usuario/crac-mcp:latest
```

### GitHub Container Registry

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u tu-usuario --password-stdin

# Tag
docker tag crac-mcp:latest ghcr.io/tu-usuario/crac-mcp:latest

# Push
docker push ghcr.io/tu-usuario/crac-mcp:latest
```

## Desplegar en plataformas

### Railway

1. Conecta tu repo de GitHub
2. Railway detectará el Dockerfile automáticamente
3. Configura el puerto: 8081

### Render

1. Crea un nuevo "Web Service"
2. Conecta tu repo
3. Dockerfile detectado automáticamente
4. Puerto: 8081

### Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (crea fly.toml)
fly launch

# Deploy
fly deploy
```

### Vercel (con Docker)

Vercel soporta Dockerfiles directamente en proyectos.

## Variables de entorno

Puedes pasar variables de entorno al contenedor:

```bash
docker run -d \
  --name crac-mcp \
  -p 8081:8081 \
  -e NODE_ENV=production \
  -e PORT=8081 \
  crac-mcp:latest
```

## Troubleshooting

### Ver logs del contenedor

```bash
docker logs crac-mcp
# o con docker-compose
docker-compose logs -f
```

### Entrar al contenedor

```bash
docker exec -it crac-mcp sh
```

### Reconstruir la imagen

```bash
docker build --no-cache -t crac-mcp:latest .
```
