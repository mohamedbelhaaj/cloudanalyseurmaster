# Étape 1 : Construire l'application Angular
FROM node:18 AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste de l'application
COPY . .

# Construire l'application en mode production
RUN npm run build --prod

# Étape 2 : Servir l'application avec Nginx
FROM nginx:alpine

# Copier les fichiers construits dans le dossier 'dist' de l'application
COPY --from=build /app/dist/threat-analysis-app /usr/share/nginx/html

# Exposer le port sur lequel l'application sera servie
EXPOSE 4200

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
