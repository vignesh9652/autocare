package com.autocare.bookingservice.config;

import com.autocare.bookingservice.entity.PlatformConfig;
import com.autocare.bookingservice.entity.ServiceCatalog;
import com.autocare.bookingservice.repository.PlatformConfigRepository;
import com.autocare.bookingservice.repository.ServiceCatalogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the platform-controlled service catalogue and the default commission
 * percentage on first boot. Only inserts when the tables are empty, so
 * existing data is never touched.
 */
@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    public CommandLineRunner seedPlatformData(ServiceCatalogRepository serviceCatalogRepository,
                                              PlatformConfigRepository platformConfigRepository) {
        return args -> {
            if (serviceCatalogRepository.count() == 0) {
                List<ServiceCatalog> services = List.of(
                        new ServiceCatalog("General Service", "Oil change, filters, 60-point check", new BigDecimal("1499.00"), true),
                        new ServiceCatalog("Brake Repair", "Pads, discs & brake fluid inspection", new BigDecimal("2499.00"), true),
                        new ServiceCatalog("Engine Diagnostics", "Computerised engine health scan", new BigDecimal("1299.00"), true),
                        new ServiceCatalog("AC Service", "Gas top-up, cooling coil cleaning", new BigDecimal("1899.00"), true),
                        new ServiceCatalog("Battery Replacement", "On-site battery testing & swap", new BigDecimal("999.00"), true),
                        new ServiceCatalog("Tyre Care", "Rotation, balancing & pressure check", new BigDecimal("1099.00"), true),
                        new ServiceCatalog("Detailing & Wash", "Deep interior & exterior detailing", new BigDecimal("1999.00"), true),
                        new ServiceCatalog("Insurance Claim Support", "Assistance with claim paperwork", new BigDecimal("499.00"), true)
                );
                serviceCatalogRepository.saveAll(services);
                log.info("🌱 Seeded {} platform services", services.size());
            }

            if (platformConfigRepository
                    .findByConfigKey(PlatformConfig.KEY_COMMISSION_PERCENTAGE)
                    .isEmpty()) {
                platformConfigRepository.save(new PlatformConfig(
                        PlatformConfig.KEY_COMMISSION_PERCENTAGE, "15.00"));
                log.info("🌱 Seeded default platform commission: 15.00%");
            }
        };
    }
}
