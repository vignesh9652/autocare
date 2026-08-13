package com.autocare.bookingservice.service;

import com.autocare.bookingservice.dto.CommissionConfigRequest;
import com.autocare.bookingservice.dto.ServiceRequest;
import com.autocare.bookingservice.dto.ServiceResponse;
import com.autocare.bookingservice.entity.PlatformConfig;
import com.autocare.bookingservice.entity.ServiceCatalog;
import com.autocare.bookingservice.exception.ServiceNotFoundException;
import com.autocare.bookingservice.repository.PlatformConfigRepository;
import com.autocare.bookingservice.repository.ServiceCatalogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceCatalogServiceTest {

    @Mock
    private ServiceCatalogRepository serviceCatalogRepository;

    @Mock
    private PlatformConfigRepository platformConfigRepository;

    private ServiceCatalogService service;

    @BeforeEach
    void setUp() {
        service = new ServiceCatalogService(serviceCatalogRepository, platformConfigRepository);
    }

    private ServiceCatalog service(String name, BigDecimal price, boolean active) {
        return new ServiceCatalog(name, name + " description", price, active);
    }

    // ─── SERVICE PRICE RETRIEVAL ────────────────────────────────────────

    @Test
    void getActiveServices_ShouldReturnOnlyActive() {
        when(serviceCatalogRepository.findByActiveTrueOrderByServiceNameAsc())
                .thenReturn(List.of(
                        service("Battery Replacement", new BigDecimal("999.00"), true),
                        service("Oil Change", new BigDecimal("299.00"), true)));

        List<ServiceResponse> responses = service.getActiveServices();

        assertEquals(2, responses.size());
        assertEquals(0, new BigDecimal("999.00").compareTo(responses.get(0).getBasePrice()));
    }

    // ─── ESTIMATE RESOLUTION ────────────────────────────────────────────

    @Test
    void resolveEstimatedAmount_AllServicesKnown_ShouldSumCataloguePrices() {
        when(serviceCatalogRepository.findByServiceNameIgnoreCaseIn(anyCollection()))
                .thenReturn(List.of(
                        service("Battery Replacement", new BigDecimal("999.00"), true),
                        service("Oil Change", new BigDecimal("299.00"), true)));

        BigDecimal estimate = service.resolveEstimatedAmount(
                "Battery Replacement + Oil Change");

        assertEquals(0, new BigDecimal("1298.00").compareTo(estimate));
    }

    @Test
    void resolveEstimatedAmount_ManuallyTypedService_MatchingCaseAndWhitespace_ShouldUseCataloguePrice() {
        // A customer typing "brake  repair" (lowercase + double space) must
        // still resolve to the catalogue "Brake Repair" at its catalogue price.
        when(serviceCatalogRepository.findByServiceNameIgnoreCaseIn(anyCollection()))
                .thenReturn(List.of(service("Brake Repair", new BigDecimal("2499.00"), true)));

        BigDecimal estimate = service.resolveEstimatedAmount("brake  repair");

        assertEquals(0, new BigDecimal("2499.00").compareTo(estimate));
    }

    @Test
    void resolveEstimatedAmount_UnknownService_ShouldReject() {
        when(serviceCatalogRepository.findByServiceNameIgnoreCaseIn(anyCollection()))
                .thenReturn(List.of(service("Oil Change", new BigDecimal("299.00"), true)));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.resolveEstimatedAmount("Oil Change + Custom Detailing"));

        assertTrue(ex.getMessage().contains("Custom Detailing"));
        // The client-supplied estimate is never trusted for unknown services.
    }

    @Test
    void resolveEstimatedAmount_InactiveService_ShouldReject() {
        when(serviceCatalogRepository.findByServiceNameIgnoreCaseIn(anyCollection()))
                .thenReturn(List.of(
                        service("Oil Change", new BigDecimal("299.00"), false),
                        service("Battery Replacement", new BigDecimal("999.00"), true)));

        assertThrows(IllegalArgumentException.class,
                () -> service.resolveEstimatedAmount("Oil Change + Battery Replacement"));
    }

    @Test
    void resolveEstimatedAmount_BlankServiceType_ShouldReject() {
        assertThrows(IllegalArgumentException.class,
                () -> service.resolveEstimatedAmount("   "));
    }

    // ─── ADMIN PRICE UPDATE ─────────────────────────────────────────────

    @Test
    void updateService_ShouldUpdatePrice() {
        ServiceCatalog existing = service("Battery Replacement", new BigDecimal("999.00"), true);
        existing.setId(5L);
        when(serviceCatalogRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(serviceCatalogRepository.save(any(ServiceCatalog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ServiceRequest request = new ServiceRequest();
        request.setServiceName("Battery Replacement");
        request.setBasePrice(new BigDecimal("1099.00"));
        request.setActive(true);

        ServiceResponse response = service.updateService(5L, request);

        assertEquals(0, new BigDecimal("1099.00").compareTo(response.getBasePrice()));
    }

    @Test
    void updateService_NonExistent_ShouldThrow() {
        when(serviceCatalogRepository.findById(99L)).thenReturn(Optional.empty());

        ServiceRequest request = new ServiceRequest();
        request.setServiceName("X");
        request.setBasePrice(new BigDecimal("100.00"));

        assertThrows(ServiceNotFoundException.class, () -> service.updateService(99L, request));
    }

    @Test
    void createService_DuplicateName_ShouldThrow() {
        when(serviceCatalogRepository.findByServiceNameIgnoreCase("Battery Replacement"))
                .thenReturn(Optional.of(service("Battery Replacement", new BigDecimal("999.00"), true)));

        ServiceRequest request = new ServiceRequest();
        request.setServiceName("Battery Replacement");
        request.setBasePrice(new BigDecimal("999.00"));

        assertThrows(IllegalArgumentException.class, () -> service.createService(request));
        verify(serviceCatalogRepository, never()).save(any());
    }

    // ─── COMMISSION ─────────────────────────────────────────────────────

    @Test
    void currentCommissionPercentage_DefaultsTo15_WhenNotConfigured() {
        when(platformConfigRepository.findByConfigKey(PlatformConfig.KEY_COMMISSION_PERCENTAGE))
                .thenReturn(Optional.empty());

        assertEquals(0, new BigDecimal("15.00").compareTo(service.currentCommissionPercentage()));
    }

    @Test
    void updateCommissionConfig_ShouldPersistValue() {
        when(platformConfigRepository.findByConfigKey(PlatformConfig.KEY_COMMISSION_PERCENTAGE))
                .thenReturn(Optional.empty());
        when(platformConfigRepository.save(any(PlatformConfig.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        // After save the value is re-read for the response
        when(platformConfigRepository.findByConfigKey(PlatformConfig.KEY_COMMISSION_PERCENTAGE))
                .thenReturn(Optional.of(new PlatformConfig(
                        PlatformConfig.KEY_COMMISSION_PERCENTAGE, "20.00")));

        CommissionConfigRequest request = new CommissionConfigRequest();
        request.setPlatformCommissionPercentage(new BigDecimal("20.00"));

        var response = service.updateCommissionConfig(request);

        assertEquals(0, new BigDecimal("20.00").compareTo(response.getPlatformCommissionPercentage()));
    }
}
