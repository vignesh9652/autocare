package com.autocare.sparepartsservice.service;

import com.autocare.sparepartsservice.dto.SparePartRequest;
import com.autocare.sparepartsservice.dto.SparePartResponse;
import com.autocare.sparepartsservice.entity.SparePart;
import com.autocare.sparepartsservice.exception.SparePartNotFoundException;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SparePartServiceTest {

    @Mock
    private SparePartRepository sparePartRepository;

    private SparePartService sparePartService;

    private SparePartRequest request;
    private SparePart part;
    private SparePart part2;
    private final Long partId = 100L;
    private final Long partId2 = 101L;

    @BeforeEach
    void setUp() {
        sparePartService = new SparePartService(sparePartRepository);

        request = new SparePartRequest();
        request.setName("Brake Pad Set");
        request.setDescription("High-quality ceramic brake pads");
        request.setCompatibleVehicleModels(List.of("Toyota Camry 2020-2023", "Honda Accord 2021-2023"));
        request.setPrice(new BigDecimal("89.99"));
        request.setStockQuantity(50);
        request.setCategory("BRAKES");
        request.setTutorialVideoUrl("https://youtube.com/watch?v=example");
        request.setInstallationSteps("1. Remove old pads\n2. Install new pads\n3. Test brakes");

        part = new SparePart("Brake Pad Set", "High-quality ceramic brake pads",
                List.of("Toyota Camry 2020-2023", "Honda Accord 2021-2023"),
                new BigDecimal("89.99"), 50, "BRAKES");
        part.setId(partId);
        part.setTutorialVideoUrl("https://youtube.com/watch?v=example");
        part.setInstallationSteps("1. Remove old pads\n2. Install new pads\n3. Test brakes");
        part.setCreatedAt(LocalDateTime.now());

        part2 = new SparePart("Oil Filter", "Premium oil filter for engine protection",
                List.of("Toyota Camry", "Honda Civic"),
                new BigDecimal("15.99"), 200, "ENGINE");
        part2.setId(partId2);
        part2.setCreatedAt(LocalDateTime.now());
    }

    // ─── CREATE ───────────────────────────────────────────────────────────

    @Test
    void createPart_ShouldReturnSparePartResponse() {
        when(sparePartRepository.save(any(SparePart.class))).thenReturn(part);

        SparePartResponse response = sparePartService.createPart(request);

        assertNotNull(response);
        assertEquals(partId, response.getId());
        assertEquals("Brake Pad Set", response.getName());
        assertEquals("High-quality ceramic brake pads", response.getDescription());
        assertEquals(List.of("Toyota Camry 2020-2023", "Honda Accord 2021-2023"),
                response.getCompatibleVehicleModels());
        assertEquals(new BigDecimal("89.99"), response.getPrice());
        assertEquals(50, response.getStockQuantity());
        assertEquals("BRAKES", response.getCategory());
        assertEquals("https://youtube.com/watch?v=example", response.getTutorialVideoUrl());
        assertEquals("1. Remove old pads\n2. Install new pads\n3. Test brakes",
                response.getInstallationSteps());
        assertNotNull(response.getCreatedAt());

        verify(sparePartRepository).save(any(SparePart.class));
    }

    @Test
    void createPart_ShouldUppercaseCategory() {
        request.setCategory("brakes");
        when(sparePartRepository.save(any(SparePart.class))).thenReturn(part);

        SparePartResponse response = sparePartService.createPart(request);

        assertEquals("BRAKES", response.getCategory());
    }

    @Test
    void createPart_WithOptionalFieldsNull_ShouldNotThrow() {
        request.setTutorialVideoUrl(null);
        request.setInstallationSteps(null);
        request.setDescription(null);
        request.setCompatibleVehicleModels(null);

        SparePart minimalPart = new SparePart("Simple Part", null, null,
                new BigDecimal("10.00"), 5, "ENGINE");
        minimalPart.setId(200L);
        minimalPart.setCreatedAt(LocalDateTime.now());

        when(sparePartRepository.save(any(SparePart.class))).thenReturn(minimalPart);

        SparePartResponse response = sparePartService.createPart(request);

        assertNotNull(response);
        assertEquals("Simple Part", response.getName());
        assertEquals("ENGINE", response.getCategory());
        assertNull(response.getTutorialVideoUrl());
        assertNull(response.getInstallationSteps());
    }

    // ─── LIST WITH FILTERS ───────────────────────────────────────────────

    @Test
    void getAllParts_WithNoFilters_ShouldReturnAll() {
        when(sparePartRepository.findAll()).thenReturn(List.of(part, part2));

        List<SparePartResponse> responses = sparePartService.getAllParts(null, null);

        assertEquals(2, responses.size());
        assertEquals("Brake Pad Set", responses.get(0).getName());
        assertEquals("Oil Filter", responses.get(1).getName());

        verify(sparePartRepository).findAll();
    }

    @Test
    void getAllParts_WithCategoryFilter_ShouldReturnMatching() {
        when(sparePartRepository.findByCategory("BRAKES")).thenReturn(List.of(part));

        List<SparePartResponse> responses = sparePartService.getAllParts("BRAKES", null);

        assertEquals(1, responses.size());
        assertEquals("Brake Pad Set", responses.get(0).getName());
        assertEquals("BRAKES", responses.get(0).getCategory());

        verify(sparePartRepository).findByCategory("BRAKES");
    }

    @Test
    void getAllParts_WithCategoryFilter_ShouldUppercase() {
        when(sparePartRepository.findByCategory("BRAKES")).thenReturn(List.of(part));

        sparePartService.getAllParts("brakes", null);

        verify(sparePartRepository).findByCategory("BRAKES");
    }

    @Test
    void getAllParts_WithSearchFilter_ShouldReturnMatching() {
        when(sparePartRepository.findByNameContainingIgnoreCase("brake"))
                .thenReturn(List.of(part));

        List<SparePartResponse> responses = sparePartService.getAllParts(null, "brake");

        assertEquals(1, responses.size());
        assertEquals("Brake Pad Set", responses.get(0).getName());

        verify(sparePartRepository).findByNameContainingIgnoreCase("brake");
    }

    @Test
    void getAllParts_WithCategoryAndSearch_ShouldReturnMatching() {
        when(sparePartRepository.findByCategoryAndSearch("BRAKES", "pad"))
                .thenReturn(List.of(part));

        List<SparePartResponse> responses = sparePartService.getAllParts("BRAKES", "pad");

        assertEquals(1, responses.size());
        assertEquals("Brake Pad Set", responses.get(0).getName());

        verify(sparePartRepository).findByCategoryAndSearch("BRAKES", "pad");
    }

    @Test
    void getAllParts_WithNoResults_ShouldReturnEmptyList() {
        when(sparePartRepository.findAll()).thenReturn(List.of());

        List<SparePartResponse> responses = sparePartService.getAllParts(null, null);

        assertTrue(responses.isEmpty());
    }

    // ─── GET BY ID ────────────────────────────────────────────────────────

    @Test
    void getPartById_ShouldReturnSparePart() {
        when(sparePartRepository.findById(partId)).thenReturn(Optional.of(part));

        SparePartResponse response = sparePartService.getPartById(partId);

        assertNotNull(response);
        assertEquals(partId, response.getId());
        assertEquals("Brake Pad Set", response.getName());
        assertEquals(new BigDecimal("89.99"), response.getPrice());
        assertNotNull(response.getInstallationSteps());
        assertNotNull(response.getTutorialVideoUrl());
    }

    @Test
    void getPartById_WithNonExistentId_ShouldThrow() {
        when(sparePartRepository.findById(999L)).thenReturn(Optional.empty());

        SparePartNotFoundException ex = assertThrows(SparePartNotFoundException.class,
                () -> sparePartService.getPartById(999L));
        assertTrue(ex.getMessage().contains("999"));
    }
}
