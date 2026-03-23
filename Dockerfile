FROM node:22-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2-dev \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fontconfig \
    fonts-dejavu-core \
    file \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV HOME=/tmp
ENV XDG_CACHE_HOME=/tmp/.cache

RUN mkdir -p /tmp/.cache/fontconfig

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install --legacy-peer-deps

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

RUN dpkg -l | grep dejavu || true
RUN ls -l /usr/share/fonts/truetype/dejavu || true
RUN file /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf || true
RUN file /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf || true

EXPOSE 3001

CMD ["npm", "run", "start:prod"]