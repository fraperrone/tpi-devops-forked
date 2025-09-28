FROM python:3.11-slim
WORKDIR /app

# Install system deps for pymysql and bash
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
	 build-essential \
	 gcc \
	 libssl-dev \
	 libffi-dev \
	 python3-dev \
	 bash \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
