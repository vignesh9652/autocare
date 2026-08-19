# Static site — the React app is built on the host (npm run build, deps already
# installed) and copied in, instead of running npm ci inside the container.
# The npm registry is unreliably slow on this dev machine and long in-container
# downloads drop the build connection. Build the dist first:
#   npm ci && npm run build
FROM nginx:1.27-alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
