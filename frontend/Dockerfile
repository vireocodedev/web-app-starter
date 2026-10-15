FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS build
WORKDIR /workspace
COPY package.json package-lock.json .nvmrc ./
RUN package_manager=$(node -p 'require("./package.json").packageManager') \
    && printf '%s' "$package_manager" | grep -Eq '^npm@[0-9]+\.[0-9]+\.[0-9]+$' \
    && npm install --global "$package_manager" \
    && npm ci
COPY . .
ENV VITE_API_BASE_URL=/api \
    VITE_API_WITH_CREDENTIALS=true \
    VITE_API_MODE=http \
    VITE_APP_ENV=production
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:782bb89768cc87b7f95c18b95baa1af250e5d451f26794f59363540161147c01
USER 0
ARG SOURCE_SHA
ARG SOURCE_URL
RUN printf '%s' "$SOURCE_SHA" | grep -Eq '^[0-9a-f]{40}$'
LABEL org.opencontainers.image.revision="$SOURCE_SHA" \
      org.opencontainers.image.source="$SOURCE_URL"
COPY --from=build /workspace/dist /usr/share/nginx/html
COPY --chmod=0444 nginx.conf /etc/nginx/nginx.conf
RUN find /usr/share/nginx/html -type d -exec chmod 0755 {} + \
    && find /usr/share/nginx/html -type f -exec chmod 0444 {} +
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
