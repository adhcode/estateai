FROM node:22-slim

# Install canvas dependencies and fonts for Debian
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-dejavu-core \
    fonts-noto \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Create fontconfig directory and config
RUN mkdir -p /etc/fonts /tmp/fontconfig && \
    echo '<?xml version="1.0"?>\n\
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n\
<fontconfig>\n\
  <dir>/usr/share/fonts</dir>\n\
  <dir>/app/assets/fonts</dir>\n\
  <cachedir>/tmp/fontconfig</cachedir>\n\
</fontconfig>' > /etc/fonts/fonts.conf && \
    chmod -R 777 /tmp/fontconfig

# Set fontconfig environment variables
ENV FONTCONFIG_PATH=/etc/fonts
ENV FONTCONFIG_FILE=/etc/fonts/fonts.conf

# Update font cache
RUN fc-cache -f -v

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies and rebuild canvas with proper bindings
RUN npm install --legacy-peer-deps && \
    npm rebuild canvas --build-from-source

# Copy rest of backend (including bundled fonts and startup script)
COPY backend/ ./

# Rebuild font cache with bundled fonts
RUN fc-cache -f -v

# Verify fonts are present and list available fonts
RUN ls -la assets/fonts/ && echo "Fonts copied successfully" || echo "Warning: No fonts directory found"
RUN fc-list | grep -i dejavu || echo "Warning: DejaVu fonts not found in font cache"

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
