FROM maven:3.8-openjdk-17 AS build
WORKDIR /app

COPY pom.xml .
COPY .mvn/ .mvn/

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/backend-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]