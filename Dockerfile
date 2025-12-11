FROM python:3.11-slim

# Dependencias necesarias del sistema
RUN apt-get update && apt-get install -y \
    iputils-ping \
    curl \
    wget \
    dnsutils \
    postgresql-client \
    netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

# Directorio del proyecto
WORKDIR /app

# Copiar dependencias
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copiar proyecto completo
COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
