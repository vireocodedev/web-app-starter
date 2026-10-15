FROM eclipse-temurin:21-jdk-alpine@sha256:0bfc69a4758a86710e5c474032d28400a8bd00874766f9e8b1642ac2fd293159 AS build
WORKDIR /workspace
COPY gradlew build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon --console=plain bootJar

FROM eclipse-temurin:21-jre-alpine@sha256:51ab5e3302e7141ce665ca3ea85e8b5cd648eafbc3c0c90dd79d6537684e4555
ARG SOURCE_SHA
ARG SOURCE_URL
RUN printf '%s' "$SOURCE_SHA" | grep -Eq '^[0-9a-f]{40}$' \
    && addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app app
LABEL org.opencontainers.image.revision="$SOURCE_SHA" \
      org.opencontainers.image.source="$SOURCE_URL"
WORKDIR /app
COPY --from=build --chmod=0444 /workspace/build/libs/*.jar /app/app.jar
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/api/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
