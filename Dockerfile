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

# Create simple nginx config
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
