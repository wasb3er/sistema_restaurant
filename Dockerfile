#Imagen base
FROM python:3.11-slim

#Instalar dependencias del sistema y utilidades de red
RUN apt-get update && apt-get install -y \
    iputils-ping \
    curl \
    wget \
    dnsutils \
    postgresql-client \
    netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

#Directorio de trabajo dentro del contenedor
WORKDIR /app

#dependencias
COPY requirements.txt .

#Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

#Hacer copia de todo el proyecto
COPY . .

#Exponer puerto
EXPOSE 8000

#Comando por defecto al iniciar el contenedor
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
