# Runtime image — the JAR is built on the host (mvn package, deps already
# cached) and copied in, instead of compiling inside the container. Maven
# Central is unreliably slow on this dev machine and long in-container
# downloads drop the build connection. Build the jar first:
#   mvn clean package -DskipTests
FROM eclipse-temurin:21-jre
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
