FROM node:22-alpine AS base
WORKDIR /app
ARG PRISMA_SCHEMA=prisma/schema.prisma
ENV PRISMA_SCHEMA=${PRISMA_SCHEMA}

COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmjs.org --no-audit --no-fund
COPY . .
RUN npx prisma generate --schema "$PRISMA_SCHEMA" && npm run build

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p public/uploads && npx prisma db push --schema \"$PRISMA_SCHEMA\" && npm run db:seed && npx next start -H 0.0.0.0 -p 3000"]
