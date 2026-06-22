# syntax=docker/dockerfile:1

# --- Build stage: install deps + produce the static Vite bundle ---
FROM node:22-alpine AS build
WORKDIR /app

# Install from the lockfile (cached layer) before copying source.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The app calls the API via the same origin (/api), which nginx proxies to the
# backend — so the build-time default is a relative path, not a host:port.
ENV VITE_API_URL=/api
RUN npm run build

# --- Runtime stage: nginx serving the static bundle + /api proxy ---
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
