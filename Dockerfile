FROM node:22-alpine AS base
WORKDIR /app

COPY . .
RUN if [ ! -d node_modules ]; then npm config set registry https://registry.npmmirror.com && npm ci; fi
RUN npx prisma generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p public/uploads && npx prisma db push && npm run db:seed && npx next start -H 0.0.0.0 -p 3000"]
