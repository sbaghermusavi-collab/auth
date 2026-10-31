FROM docker.peykasa.ir/eclipse-temurin:21-jdk
ENV SPRING_OUTPUT_ANSI_ENABLED=ALWAYS
WORKDIR /
COPY  ../target/*.jar /app.jar
EXPOSE 4200
CMD java \
   -XX:+UseG1GC \
   -jar app.jar 
