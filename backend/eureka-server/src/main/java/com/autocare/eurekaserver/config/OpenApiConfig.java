package com.autocare.eurekaserver.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI eurekaServerOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AutoCare Eureka Server")
                        .description("Service discovery server for the AutoCare microservices platform")
                        .version("1.0.0"));
    }
}
