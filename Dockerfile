FROM node:22-bookworm

# Install native deps required by node-canvas + a stable system font family
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fontconfig \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Give fontconfig a writable cache location in container environments
ENV HOME=/tmp
ENV XDG_CACHE_HOME=/tmp/.cache

RUN mkdir -p /tmp/.cache/fontconfig

# Copy package files first for better layer caching
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy app source
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Warm font cache during build only
RUN fc-cache -fv || true

EXPOSE 3001

CMD ["npm", "run", "start:prod"]