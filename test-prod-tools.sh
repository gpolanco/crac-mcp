#!/bin/bash

# Script para probar las herramientas del MCP Server en Railway
# Uso: ./test-tools-railway.sh

BASE_URL="https://crac-mcp-production.up.railway.app"
MCP_ENDPOINT="${BASE_URL}/mcp"

echo "🧪 Probando MCP Server - crac-mcp (Railway)"
echo "==========================================="
echo ""

# Función para hacer requests MCP
mcp_request() {
  local method=$1
  local params=$2
  local id=$3
  
  curl -s -X POST "${MCP_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":${id},\"method\":\"${method}\",\"params\":${params}}"
}

echo "1️⃣  Health Check"
echo "----------------"
curl -s "${BASE_URL}/health" | python3 -m json.tool
echo ""
echo ""

echo "2️⃣  Inicializar conexión MCP"
echo "----------------------------"
mcp_request "initialize" '{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}' 1 | python3 -m json.tool
echo ""
echo ""

echo "3️⃣  Listar herramientas disponibles"
echo "------------------------------------"
mcp_request "tools/list" "{}" 2 | python3 -m json.tool
echo ""
echo ""

echo "4️⃣  Probar herramienta 'hello'"
echo "-------------------------------"
mcp_request "tools/call" '{"name":"hello","arguments":{"name":"World"}}' 3 | python3 -m json.tool
echo ""
echo ""

echo "5️⃣  Probar herramienta 'get-info' (sin filtro)"
echo "-----------------------------------------------"
mcp_request "tools/call" '{"name":"get-info","arguments":{}}' 4 | python3 -m json.tool
echo ""
echo ""

echo "6️⃣  Probar herramienta 'get-info' (filtro: tools)"
echo "-------------------------------------------------"
mcp_request "tools/call" '{"name":"get-info","arguments":{"section":"tools"}}' 5 | python3 -m json.tool
echo ""
echo ""

echo "7️⃣  Listar recursos disponibles"
echo "--------------------------------"
mcp_request "resources/list" "{}" 6 | python3 -m json.tool
echo ""
echo ""

echo "8️⃣  Listar prompts disponibles"
echo "--------------------------------"
mcp_request "prompts/list" "{}" 7 | python3 -m json.tool
echo ""
echo ""

echo "✅ Pruebas completadas"

