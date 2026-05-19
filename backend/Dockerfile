FROM node:20-bullseye-slim AS build
WORKDIR /app
ENV NODE_ENV=development
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bullseye-slim
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g tsx@4.7.0 prisma@5.10.0
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "-r", "module-alias/register", "dist/index.js"]
