FROM node:20-alpine

WORKDIR /app/apps/frontend

COPY apps/frontend/package.json /app/apps/frontend/package.json
RUN npm install

COPY apps/frontend /app/apps/frontend

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
