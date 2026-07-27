package com.autocare.vehicleservice.service;

import com.autocare.vehicleservice.dto.VehicleRequest;
import com.autocare.vehicleservice.dto.VehicleResponse;
import com.autocare.vehicleservice.entity.Vehicle;
import com.autocare.vehicleservice.exception.DuplicateRegistrationException;
import com.autocare.vehicleservice.exception.VehicleNotFoundException;
import com.autocare.vehicleservice.exception.VehicleNotOwnedException;
import com.autocare.vehicleservice.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public VehicleResponse createVehicle(Long userId, VehicleRequest request) {
        if (vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new DuplicateRegistrationException(
                    "A vehicle with registration number '" + request.getRegistrationNumber() + "' already exists");
        }

        Vehicle vehicle = new Vehicle(
                userId,
                request.getMake(),
                request.getModel(),
                request.getYear(),
                request.getRegistrationNumber(),
                request.getVehicleType()
        );

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    public List<VehicleResponse> getUserVehicles(Long userId) {
        return vehicleRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public VehicleResponse getVehicleById(Long id, Long userId) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with id: " + id));

        if (!vehicle.getUserId().equals(userId)) {
            throw new VehicleNotOwnedException("This vehicle does not belong to you");
        }

        return toResponse(vehicle);
    }

    public VehicleResponse updateVehicle(Long id, Long userId, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with id: " + id));

        if (!vehicle.getUserId().equals(userId)) {
            throw new VehicleNotOwnedException("This vehicle does not belong to you");
        }

        // If registration number is changing, check for duplicates
        if (!vehicle.getRegistrationNumber().equals(request.getRegistrationNumber())
                && vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new DuplicateRegistrationException(
                    "A vehicle with registration number '" + request.getRegistrationNumber() + "' already exists");
        }

        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setRegistrationNumber(request.getRegistrationNumber());
        vehicle.setVehicleType(request.getVehicleType());

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    public void deleteVehicle(Long id, Long userId) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with id: " + id));

        if (!vehicle.getUserId().equals(userId)) {
            throw new VehicleNotOwnedException("This vehicle does not belong to you");
        }

        vehicleRepository.delete(vehicle);
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getYear(),
                vehicle.getRegistrationNumber(),
                vehicle.getVehicleType(),
                vehicle.getCreatedAt()
        );
    }
}
