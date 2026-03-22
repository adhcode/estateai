FROM node:22-slim

# Install canvas dependencies and basic fonts
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fontconfig \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Update font cache
RUN fc-cache -fv

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies and rebuild canvas with proper bindings
RUN npm install --legacy-peer-deps && \
    npm rebuild canvas --build-from-source

# Copy rest of backend
COPY backend/ ./

# Rebuild font cache
RUN fc-cache -fv

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
