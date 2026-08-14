package com.autocare.bookingservice.controller;

import com.autocare.bookingservice.dto.CommissionConfigRequest;
import com.autocare.bookingservice.dto.CommissionConfigResponse;
import com.autocare.bookingservice.dto.ServiceRequest;
import com.autocare.bookingservice.dto.ServiceResponse;
import com.autocare.bookingservice.service.ServiceCatalogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ServiceCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ServiceCatalogService serviceCatalogService;

    private UsernamePasswordAuthenticationToken auth(String role) {
        return new UsernamePasswordAuthenticationToken(1L, null, Collections.singletonList(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role)));
    }

    private ServiceResponse sampleService() {
        return new ServiceResponse(1L, "Battery Replacement", "On-site battery swap",
                new BigDecimal("999.00"), true, LocalDateTime.now(), LocalDateTime.now());
    }

    // ─── CUSTOMER VIEW ──────────────────────────────────────────────────

    @Test
    void getActiveServices_ShouldReturnActiveList() throws Exception {
        when(serviceCatalogService.getActiveServices()).thenReturn(List.of(sampleService()));

        mockMvc.perform(get("/api/services").with(authentication(auth("CUSTOMER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].serviceName").value("Battery Replacement"))
                .andExpect(jsonPath("$[0].basePrice").value(999.0));
    }

    @Test
    void getActiveServices_WithoutAuth_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/services"))
                .andExpect(status().isUnauthorized());
    }

    // ─── ADMIN ──────────────────────────────────────────────────────────

    @Test
    void updateService_AsAdmin_ShouldUpdatePrice() throws Exception {
        when(serviceCatalogService.updateService(any(Long.class), any(ServiceRequest.class)))
                .thenReturn(sampleService());

        ServiceRequest request = new ServiceRequest();
        request.setServiceName("Battery Replacement");
        request.setBasePrice(new BigDecimal("1099.00"));
        request.setActive(true);

        mockMvc.perform(put("/api/services/admin/1")
                        .with(authentication(auth("ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void updateService_WithNegativePrice_ShouldReturn400() throws Exception {
        ServiceRequest request = new ServiceRequest();
        request.setServiceName("Battery Replacement");
        request.setBasePrice(new BigDecimal("-5.00"));

        mockMvc.perform(put("/api/services/admin/1")
                        .with(authentication(auth("ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"));
    }

    @Test
    void updateService_AsCustomer_ShouldReturn403() throws Exception {
        ServiceRequest request = new ServiceRequest();
        request.setServiceName("X");
        request.setBasePrice(new BigDecimal("100.00"));

        mockMvc.perform(put("/api/services/admin/1")
                        .with(authentication(auth("CUSTOMER")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ─── COMMISSION CONFIG ──────────────────────────────────────────────

    @Test
    void getCommissionConfig_AsAdmin_ShouldReturnPercentage() throws Exception {
        when(serviceCatalogService.getCommissionConfig())
                .thenReturn(new CommissionConfigResponse(new BigDecimal("15.00")));

        mockMvc.perform(get("/api/services/admin/config").with(authentication(auth("ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platformCommissionPercentage").value(15.0));
    }

    @Test
    void updateCommissionConfig_AsAdmin_ShouldUpdate() throws Exception {
        when(serviceCatalogService.updateCommissionConfig(any(CommissionConfigRequest.class)))
                .thenReturn(new CommissionConfigResponse(new BigDecimal("20.00")));

        CommissionConfigRequest request = new CommissionConfigRequest();
        request.setPlatformCommissionPercentage(new BigDecimal("20.00"));

        mockMvc.perform(put("/api/services/admin/config")
                        .with(authentication(auth("ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platformCommissionPercentage").value(20.0));
    }
}
