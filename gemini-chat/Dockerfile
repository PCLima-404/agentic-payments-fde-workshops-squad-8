# gemini-chat/Dockerfile
# Constrói tickets-tools E gemini-chat juntos, porque o segundo executa
# o primeiro como processo filho via stdio (não é chamada de rede).

# ---- Stage 1: build do tickets-tools ----
FROM node:20-bookworm-slim AS tickets-tools-build
WORKDIR /tickets-tools
COPY tickets-tools/package*.json ./
RUN npm install typescript@5.6.3 --save-dev --save-exact && npm ci
COPY tickets-tools/ .
RUN npm install typescript@5.6.3 --save-dev --save-exact
RUN npm run build

# ---- Stage 2: build do gemini-chat (Next.js) ----
FROM node:20-bookworm-slim AS gemini-chat-build
WORKDIR /app
COPY gemini-chat/package*.json ./
RUN npm ci
COPY gemini-chat/ .
RUN npm run build

# ---- Stage 3: imagem final, só com o necessário pra rodar ----
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# Next.js em modo standalone (ver next.config.js abaixo)
COPY --from=gemini-chat-build /app/.next/standalone ./
COPY --from=gemini-chat-build /app/.next/static ./.next/static

# tickets-tools compilado + node_modules (precisa dos próprios, é um
# processo Node separado, spawnado, não importa nada de gemini-chat)
COPY --from=tickets-tools-build /tickets-tools/dist ./tickets-tools/dist
COPY --from=tickets-tools-build /tickets-tools/node_modules ./tickets-tools/node_modules
COPY --from=tickets-tools-build /tickets-tools/package.json ./tickets-tools/package.json

# Caminho absoluto e explícito — evita o cliente MCP ter que adivinhar
# a estrutura relativa de pastas (mesma lógica do MCP_SERVER_PATH que
# usamos no Windows quando o caminho relativo dava problema)
ENV MCP_SERVER_PATH=/app/tickets-tools/dist/src/server.js

EXPOSE 3000
CMD ["node", "server.js"]