package com.autocare.sparepartsservice.service;

import com.autocare.sparepartsservice.dto.SparePartRequest;
import com.autocare.sparepartsservice.dto.SparePartResponse;
import com.autocare.sparepartsservice.entity.SparePart;
import com.autocare.sparepartsservice.exception.SparePartNotFoundException;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SparePartService {

    private final SparePartRepository sparePartRepository;

    public SparePartService(SparePartRepository sparePartRepository) {
        this.sparePartRepository = sparePartRepository;
    }

    public SparePartResponse createPart(SparePartRequest request) {
        SparePart part = new SparePart(
                request.getName(),
                request.getDescription(),
                request.getCompatibleVehicleModels(),
                request.getPrice(),
                request.getStockQuantity(),
                request.getCategory().toUpperCase()
        );
        part.setTutorialVideoUrl(request.getTutorialVideoUrl());
        part.setInstallationSteps(request.getInstallationSteps());

        part = sparePartRepository.save(part);
        return toResponse(part);
    }

    public List<SparePartResponse> getAllParts(String category, String search) {
        List<SparePart> parts;

        if (category != null && search != null) {
            parts = sparePartRepository.findByCategoryAndSearch(category.toUpperCase(), search);
        } else if (category != null) {
            parts = sparePartRepository.findByCategory(category.toUpperCase());
        } else if (search != null) {
            parts = sparePartRepository.findByNameContainingIgnoreCase(search);
        } else {
            parts = sparePartRepository.findAll();
        }

        return parts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SparePartResponse getPartById(Long id) {
        SparePart part = findSparePart(id);
        return toResponse(part);
    }

    private SparePart findSparePart(Long id) {
        return sparePartRepository.findById(id)
                .orElseThrow(() -> new SparePartNotFoundException(
                        "Spare part not found with id: " + id));
    }

    private SparePartResponse toResponse(SparePart part) {
        return new SparePartResponse(
                part.getId(),
                part.getName(),
                part.getDescription(),
                part.getCompatibleVehicleModels(),
                part.getPrice(),
                part.getStockQuantity(),
                part.getCategory(),
                part.getTutorialVideoUrl(),
                part.getInstallationSteps(),
                part.getCreatedAt()
        );
    }
}
