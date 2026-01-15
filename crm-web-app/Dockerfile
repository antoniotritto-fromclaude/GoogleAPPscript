FROM node:20-alpine

# Installa dipendenze per compilare better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Installa dipendenze
RUN npm install --production

# Copia il resto dell'app
COPY . .

# Crea directory data se non esiste
RUN mkdir -p data

# Espone la porta
EXPOSE 3000

# Variabili ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Avvia l'app (inizializza DB se necessario e avvia server)
CMD ["sh", "-c", "npm run seed 2>/dev/null || true && npm start"]
