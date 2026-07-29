package com.autocare.mechanicservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class    MechanicServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MechanicServiceApplication.class, args);
    }
}
