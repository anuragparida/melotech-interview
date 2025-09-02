# Dockerfile
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY frontend/ .

# Build the application with environment variables
# These will be passed from Coolify during build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Environment variables are now properly configured

RUN pnpm build --mode production

# Stage 2: Build Backend
FROM python:3.11-slim as backend-build
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Production stage: Nginx + Python
FROM python:3.11-slim
WORKDIR /app

# Install nginx and other dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Add backend environment variables
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG MAILGUN_API_KEY
ARG MAILGUN_DOMAIN
ARG MAILGUN_FROM_EMAIL
ARG WEBHOOK_SECRET

ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV MAILGUN_API_KEY=$MAILGUN_API_KEY
ENV MAILGUN_DOMAIN=$MAILGUN_DOMAIN
ENV MAILGUN_FROM_EMAIL=$MAILGUN_FROM_EMAIL
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET

# Copy backend from build stage
COPY --from=backend-build /app /app/backend

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Create nginx config with API proxy
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    root /usr/share/nginx/html;\
    index index.html;\
    \
    # Handle client-side routing\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
    \
    # API proxy to backend\
    location /api/ {\
        proxy_pass http://localhost:8000/;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
    \
    # WebSocket proxy\
    location /ws/ {\
        proxy_pass http://localhost:8000/ws/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
}' > /etc/nginx/conf.d/default.conf

# Create startup script to run both services
RUN echo '#!/bin/bash\n\
# Start nginx in background\n\
nginx -g "daemon off;" &\n\
\n\
# Start Python backend\n\
cd /app/backend\n\
uvicorn main:app --host 0.0.0.0 --port 8000\n\
' > /start.sh && chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
