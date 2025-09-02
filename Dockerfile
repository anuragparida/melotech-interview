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

# Build the application (skip type checking for now)
# Environment variables will be injected at build time by Coolify
RUN pnpm build --mode production

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Create nginx config with environment variable injection
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
    location /env.js {\
        add_header Content-Type application/javascript;\
        return 200 "window.__SUPABASE_URL__ = \"$VITE_SUPABASE_URL\"; window.__SUPABASE_ANON_KEY__ = \"$VITE_SUPABASE_ANON_KEY\";";\
    }\
}' > /etc/nginx/conf.d/default.conf

# Create startup script to inject env vars
RUN echo '#!/bin/sh\n\
# Create env.js file with environment variables\n\
echo "window.__SUPABASE_URL__ = \"$VITE_SUPABASE_URL\"; window.__SUPABASE_ANON_KEY__ = \"$VITE_SUPABASE_ANON_KEY\";" > /usr/share/nginx/html/env.js\n\
# Start nginx\n\
nginx -g "daemon off;"\n\
' > /start.sh && chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
