# Usa una imagen de Node.js oficial
FROM node:18-alpine

# Crea el directorio de la app
WORKDIR /app

# Copia solo los archivos necesarios
COPY package*.json ./

# Instala las dependencias
RUN npm install --omit=dev

# Copia el resto del código
COPY . .

# Expone el puerto en el que corre tu backend
EXPOSE 5000

# Comando para iniciar la app
CMD ["npm", "run", "start"]
