FROM node:22-bookworm

# Install canvas dependencies and basic fonts
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy rest of backend
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
