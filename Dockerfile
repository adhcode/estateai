FROM node:22-slim

# Install canvas dependencies and fonts for Debian
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-dejavu-core \
    fonts-noto \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Update font cache
RUN fc-cache -f -v

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies and rebuild canvas
RUN npm install --legacy-peer-deps && \
    npm rebuild canvas

# Copy rest of backend
COPY backend/ ./

# Ensure fonts are copied
RUN ls -la assets/fonts/ || echo "No fonts directory found"

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
