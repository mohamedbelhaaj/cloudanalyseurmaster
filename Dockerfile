# 1️⃣ Image Python officielle
FROM python:3.11-slim

# 2️⃣ Définir le répertoire de travail
WORKDIR /app

# 3️⃣ Installer les dépendances système pour Django et psycopg2 si besoin
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 4️⃣ Copier requirements et installer les packages Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5️⃣ Copier le code du projet
COPY . .

# 6️⃣ Exposer le port
EXPOSE 8000

# 7️⃣ Commande pour collectstatic et lancer Gunicorn
CMD ["sh", "-c", "python manage.py collectstatic --noinput && gunicorn virus_analyzer.wsgi:application --bind 0.0.0.0:8000"]
