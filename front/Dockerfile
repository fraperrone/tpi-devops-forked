FROM nginx:alpine
LABEL maintainer="tpi-devops"

# Remove default nginx static files and copy app
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
