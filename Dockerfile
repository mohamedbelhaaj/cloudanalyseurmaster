# ---- Build Angular & Run Dev Server ----
FROM node:22

# Créer un dossier de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install -g @angular/cli
RUN npm install

# Copier tout le projet Angular
COPY . .

# Exposer le port Angular par défaut
EXPOSE 4200

# Lancer ng serve en mode développement, accessible depuis l’extérieur
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
