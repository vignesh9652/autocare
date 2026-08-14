package com.autocare.bookingservice.service;

import com.autocare.bookingservice.dto.CommissionConfigRequest;
import com.autocare.bookingservice.dto.CommissionConfigResponse;
import com.autocare.bookingservice.dto.ServiceRequest;
import com.autocare.bookingservice.dto.ServiceResponse;
import com.autocare.bookingservice.entity.PlatformConfig;
import com.autocare.bookingservice.entity.ServiceCatalog;
import com.autocare.bookingservice.exception.ServiceNotFoundException;
import com.autocare.bookingservice.repository.PlatformConfigRepository;
import com.autocare.bookingservice.repository.ServiceCatalogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Platform service catalogue + commission configuration.
 *
 * <p>Prices are controlled by AutoCare: customers only ever see active
 * services ({@link #getActiveServices()}), while the admin CRUD endpoints
 * ({@code /api/services/admin/**}) are the only way to change them.</p>
 */
@Service
public class ServiceCatalogService {

    private final ServiceCatalogRepository serviceCatalogRepository;
    private final PlatformConfigRepository platformConfigRepository;

    public ServiceCatalogService(ServiceCatalogRepository serviceCatalogRepository,
                                 PlatformConfigRepository platformConfigRepository) {
        this.serviceCatalogRepository = serviceCatalogRepository;
        this.platformConfigRepository = platformConfigRepository;
    }

    // ─── Customer-facing ───────────────────────────────────────────────────

    public List<ServiceResponse> getActiveServices() {
        return serviceCatalogRepository.findByActiveTrueOrderByServiceNameAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Resolves the platform-controlled estimate for a booking's service names
     * (e.g. "General Service + Brake Repair").
     *
     * <p>Prices are authoritative: every requested service — including ones a
     * customer typed in manually — must exist in the catalogue and be active,
     * otherwise an {@link IllegalArgumentException} is thrown naming the
     * offending service(s). The client can never supply its own price; the
     * estimate is always the sum of the catalogue base prices.</p>
     */
    @Transactional(readOnly = true)
    public BigDecimal resolveEstimatedAmount(String serviceType) {
        if (serviceType == null || serviceType.isBlank()) {
            throw new IllegalArgumentException("No services specified for the booking");
        }
        List<String> names = java.util.Arrays.stream(serviceType.split("\\+"))
                .map(this::normalizeName)
                .filter(n -> !n.isEmpty())
                .toList();
        if (names.isEmpty()) {
            throw new IllegalArgumentException("No services specified for the booking");
        }
        Map<String, ServiceCatalog> catalog = serviceCatalogRepository
                .findByServiceNameIgnoreCaseIn(names)
                .stream()
                .collect(Collectors.toMap(
                        s -> normalizeName(s.getServiceName()),
                        s -> s
                ));
        List<String> unavailable = names.stream()
                .filter(n -> {
                    ServiceCatalog svc = catalog.get(n);
                    return svc == null || !svc.isActive();
                })
                .toList();
        if (!unavailable.isEmpty()) {
            throw new IllegalArgumentException(
                    "These services are not available in our catalogue: "
                            + String.join(", ", unavailable)
                            + " — please pick from the listed services");
        }
        return names.stream()
                .map(n -> catalog.get(n).getBasePrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Lowercases, trims and collapses internal whitespace for name matching. */
    private String normalizeName(String name) {
        return name.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ServiceResponse> getAllServices() {
        return serviceCatalogRepository.findAllByOrderByServiceNameAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceResponse createService(ServiceRequest request) {
        serviceCatalogRepository.findByServiceNameIgnoreCase(request.getServiceName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "A service named \"" + existing.getServiceName() + "\" already exists");
                });
        ServiceCatalog service = new ServiceCatalog(
                request.getServiceName().trim(),
                request.getDescription(),
                request.getBasePrice(),
                request.getActive() == null || request.getActive()
        );
        return toResponse(serviceCatalogRepository.save(service));
    }

    @Transactional
    public ServiceResponse updateService(Long id, ServiceRequest request) {
        ServiceCatalog service = serviceCatalogRepository.findById(id)
                .orElseThrow(() -> new ServiceNotFoundException("Service not found with id: " + id));
        service.setServiceName(request.getServiceName().trim());
        service.setDescription(request.getDescription());
        service.setBasePrice(request.getBasePrice());
        if (request.getActive() != null) {
            service.setActive(request.getActive());
        }
        return toResponse(serviceCatalogRepository.save(service));
    }

    // ─── Commission configuration ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public CommissionConfigResponse getCommissionConfig() {
        return new CommissionConfigResponse(currentCommissionPercentage());
    }

    @Transactional
    public CommissionConfigResponse updateCommissionConfig(CommissionConfigRequest request) {
        String key = PlatformConfig.KEY_COMMISSION_PERCENTAGE;
        PlatformConfig config = platformConfigRepository.findByConfigKey(key)
                .orElseGet(() -> new PlatformConfig(key, null));
        config.setConfigValue(request.getPlatformCommissionPercentage()
                .setScale(2, RoundingMode.HALF_UP).toPlainString());
        platformConfigRepository.save(config);
        return new CommissionConfigResponse(currentCommissionPercentage());
    }

    /**
     * Current platform commission percentage (defaults to 15 when not
     * configured). Used for the commission = finalAmount × % / 100 split.
     */
    @Transactional(readOnly = true)
    public BigDecimal currentCommissionPercentage() {
        return platformConfigRepository
                .findByConfigKey(PlatformConfig.KEY_COMMISSION_PERCENTAGE)
                .map(c -> {
                    try {
                        return new BigDecimal(c.getConfigValue());
                    } catch (NumberFormatException e) {
                        return new BigDecimal("15.00");
                    }
                })
                .orElse(new BigDecimal("15.00"));
    }

    private ServiceResponse toResponse(ServiceCatalog service) {
        return new ServiceResponse(
                service.getId(),
                service.getServiceName(),
                service.getDescription(),
                service.getBasePrice(),
                service.isActive(),
                service.getCreatedAt(),
                service.getUpdatedAt()
        );
    }
}
