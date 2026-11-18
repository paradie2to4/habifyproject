package com.smartrental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartRentalApplication {

    public static void main(String[] args) {
        // Store and serialise all timestamps in UTC; the website shows them in the visitor's time zone
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("UTC"));
        SpringApplication.run(SmartRentalApplication.class, args);
    }
}
