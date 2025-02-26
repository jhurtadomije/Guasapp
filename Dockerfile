# Usa la imagen oficial de Node.js en Alpine para reducir el tamaño
FROM node:18-alpine

# Define el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json primero (optimiza la caché de Docker)
COPY package*.json ./

# Instala dependencias sin incluir devDependencies (para producción)
RUN npm install --omit=dev

# Copia el resto de los archivos del proyecto, excluyendo lo que está en .dockerignore
COPY . .

# Expone el puerto en el que corre tu backend
EXPOSE 5000

# Comando para iniciar el servidor
CMD ["npm", "start"]
