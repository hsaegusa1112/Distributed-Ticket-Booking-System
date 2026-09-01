FROM python:3.13-alpine

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir "fastapi[standard]" pika

COPY main.py ./

EXPOSE 8082

CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8082"]