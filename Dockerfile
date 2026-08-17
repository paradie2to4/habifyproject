# Habify API — build from monorepo root (Render Docker Context = .)
# Prefer Root Directory = backend when possible; this file is a fallback.

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline -DskipTests

COPY backend/src ./src
RUN mvn -B -q -DskipTests package \
    && cp target/smart-rental-backend-*.jar /app/application.jar

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --no-create-home app \
    && apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/application.jar ./application.jar

USER app
EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar application.jar"]
