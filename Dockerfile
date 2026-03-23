FROM node:22-bookworm

# Install canvas dependencies and fonts
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fontconfig \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Create proper fontconfig setup
RUN mkdir -p /etc/fonts && \
    echo '<?xml version="1.0"?>' > /etc/fonts/fonts.conf && \
    echo '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">' >> /etc/fonts/fonts.conf && \
    echo '<fontconfig>' >> /etc/fonts/fonts.conf && \
    echo '  <dir>/usr/share/fonts</dir>' >> /etc/fonts/fonts.conf && \
    echo '  <cachedir>/var/cache/fontconfig</cachedir>' >> /etc/fonts/fonts.conf && \
    echo '</fontconfig>' >> /etc/fonts/fonts.conf && \
    mkdir -p /var/cache/fontconfig && \
    chmod -R 777 /var/cache/fontconfig && \
    fc-cache -fv

ENV FONTCONFIG_PATH=/etc/fonts
ENV FONTCONFIG_FILE=/etc/fonts/fonts.conf

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
