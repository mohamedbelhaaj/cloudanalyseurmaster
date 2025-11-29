# Étape 1 : Construire l'application Angular
FROM node:18-alpine AS build

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste de l'application
COPY . .

# Construire l'application
RUN npm run build --prod || npm run build

# Étape 2 : Servir avec Nginx
FROM nginx:alpine

# Copier les fichiers construits (vérifier le nom du dossier dans dist/)
COPY --from=build /app/dist/threat-analysis-app/browser /usr/share/nginx/html

# Copier la configuration Nginx personnalisée (optionnel)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]