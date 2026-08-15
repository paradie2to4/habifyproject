# Habify API — Spring Boot 3 / Java 21
# Render: set Root Directory = backend, Dockerfile Path = Dockerfile
# (or use the repo-root Dockerfile with docker context = .)

# ---- Build ----
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies when pom.xml is unchanged
COPY pom.xml .
RUN mvn -B -q dependency:go-offline -DskipTests

COPY src ./src
RUN mvn -B -q -DskipTests package \
    && cp target/smart-rental-backend-*.jar /app/application.jar

# ---- Runtime ----
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --no-create-home app \
    && apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/application.jar ./application.jar

USER app

# Render injects PORT; Spring maps it via server.port=${SERVER_PORT:${PORT:8080}}
EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8080}/actuator/health" || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar application.jar"]
