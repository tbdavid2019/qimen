FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Taipei

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

USER node

EXPOSE 3000
CMD [ "node", "app.js" ]
