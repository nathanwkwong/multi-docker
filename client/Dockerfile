FROM node:alpine
WORKDIR '/app'
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx
EXPOSE 80
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=0 /app/build /usr/share/nginx/html

# req -> EB: {nginx1(:80) routing to port 3000(nginx2 + pro react) and 5000(express)}
# nginx2 can be replaced: to nginx1 or other service