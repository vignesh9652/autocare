package com.autocare.vehicleservice.service;

import com.autocare.vehicleservice.dto.VehicleRequest;
import com.autocare.vehicleservice.dto.VehicleResponse;
import com.autocare.vehicleservice.entity.Vehicle;
import com.autocare.vehicleservice.entity.VehicleType;
import com.autocare.vehicleservice.exception.DuplicateRegistrationException;
import com.autocare.vehicleservice.exception.VehicleNotFoundException;
import com.autocare.vehicleservice.exception.VehicleNotOwnedException;
import com.autocare.vehicleservice.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    private VehicleService vehicleService;

    private VehicleRequest request;
    private Vehicle vehicle;
    private final Long userId = 1L;
    private final Long otherUserId = 2L;
    private final Long vehicleId = 100L;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleService(vehicleRepository);

        request = new VehicleRequest();
        request.setMake("Toyota");
        request.setModel("Camry");
        request.setYear(2022);
        request.setRegistrationNumber("ABC-1234");
        request.setVehicleType(VehicleType.CAR);

        vehicle = new Vehicle(userId, "Toyota", "Camry", 2022, "ABC-1234", VehicleType.CAR);
        vehicle.setId(vehicleId);
        vehicle.setCreatedAt(LocalDateTime.now());
    }

    // ─── CREATE ───────────────────────────────────────────────────────────

    @Test
    void createVehicle_ShouldReturnVehicleResponse() {
        when(vehicleRepository.existsByRegistrationNumber("ABC-1234")).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);

        VehicleResponse response = vehicleService.createVehicle(userId, request);

        assertNotNull(response);
        assertEquals(vehicleId, response.getId());
        assertEquals("Toyota", response.getMake());
        assertEquals("Camry", response.getModel());
        assertEquals(2022, response.getYear());
        assertEquals("ABC-1234", response.getRegistrationNumber());
        assertEquals(VehicleType.CAR, response.getVehicleType());
        assertNotNull(response.getCreatedAt());

        verify(vehicleRepository).existsByRegistrationNumber("ABC-1234");
        verify(vehicleRepository).save(any(Vehicle.class));
    }

    @Test
    void createVehicle_WithDuplicateRegNumber_ShouldThrow() {
        when(vehicleRepository.existsByRegistrationNumber("ABC-1234")).thenReturn(true);

        assertThrows(DuplicateRegistrationException.class,
                () -> vehicleService.createVehicle(userId, request));

        verify(vehicleRepository, never()).save(any());
    }

    // ─── LIST ─────────────────────────────────────────────────────────────

    @Test
    void getUserVehicles_ShouldReturnList() {
        Vehicle vehicle2 = new Vehicle(userId, "Honda", "Civic", 2023, "XYZ-5678", VehicleType.CAR);
        vehicle2.setId(101L);
        vehicle2.setCreatedAt(LocalDateTime.now());

        when(vehicleRepository.findByUserId(userId)).thenReturn(List.of(vehicle, vehicle2));

        List<VehicleResponse> responses = vehicleService.getUserVehicles(userId);

        assertEquals(2, responses.size());
        assertEquals("Toyota", responses.get(0).getMake());
        assertEquals("Honda", responses.get(1).getMake());
    }

    @Test
    void getUserVehicles_WithNoVehicles_ShouldReturnEmptyList() {
        when(vehicleRepository.findByUserId(userId)).thenReturn(List.of());

        List<VehicleResponse> responses = vehicleService.getUserVehicles(userId);

        assertTrue(responses.isEmpty());
    }

    // ─── GET BY ID ────────────────────────────────────────────────────────

    @Test
    void getVehicleById_ShouldReturnVehicle() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        VehicleResponse response = vehicleService.getVehicleById(vehicleId, userId);

        assertNotNull(response);
        assertEquals(vehicleId, response.getId());
        assertEquals("Toyota", response.getMake());
    }

    @Test
    void getVehicleById_WithWrongOwner_ShouldThrow() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        assertThrows(VehicleNotOwnedException.class,
                () -> vehicleService.getVehicleById(vehicleId, otherUserId));
    }

    @Test
    void getVehicleById_WithNonExistentId_ShouldThrow() {
        when(vehicleRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(VehicleNotFoundException.class,
                () -> vehicleService.getVehicleById(999L, userId));
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────

    @Test
    void updateVehicle_ShouldReturnUpdatedVehicle() {
        VehicleRequest updateRequest = new VehicleRequest();
        updateRequest.setMake("Honda");
        updateRequest.setModel("Accord");
        updateRequest.setYear(2023);
        updateRequest.setRegistrationNumber("ABC-1234"); // Same reg number — no duplicate check
        updateRequest.setVehicleType(VehicleType.CAR);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        Vehicle updatedVehicle = new Vehicle(userId, "Honda", "Accord", 2023, "ABC-1234", VehicleType.CAR);
        updatedVehicle.setId(vehicleId);
        updatedVehicle.setCreatedAt(vehicle.getCreatedAt());
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(updatedVehicle);

        VehicleResponse response = vehicleService.updateVehicle(vehicleId, userId, updateRequest);

        assertEquals("Honda", response.getMake());
        assertEquals("Accord", response.getModel());
        assertEquals(2023, response.getYear());

        verify(vehicleRepository, never()).existsByRegistrationNumber(any());
    }

    @Test
    void updateVehicle_WithNewRegNumber_ShouldCheckDuplicate() {
        VehicleRequest updateRequest = new VehicleRequest();
        updateRequest.setMake("Toyota");
        updateRequest.setModel("Camry");
        updateRequest.setYear(2022);
        updateRequest.setRegistrationNumber("NEW-9999"); // Different reg number
        updateRequest.setVehicleType(VehicleType.CAR);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.existsByRegistrationNumber("NEW-9999")).thenReturn(true);

        assertThrows(DuplicateRegistrationException.class,
                () -> vehicleService.updateVehicle(vehicleId, userId, updateRequest));

        verify(vehicleRepository, never()).save(any());
    }

    @Test
    void updateVehicle_WithWrongOwner_ShouldThrow() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        assertThrows(VehicleNotOwnedException.class,
                () -> vehicleService.updateVehicle(vehicleId, otherUserId, request));
    }

    @Test
    void updateVehicle_WithNonExistentId_ShouldThrow() {
        when(vehicleRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(VehicleNotFoundException.class,
                () -> vehicleService.updateVehicle(999L, userId, request));
    }

    // ─── DELETE ───────────────────────────────────────────────────────────

    @Test
    void deleteVehicle_ShouldDelete() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        vehicleService.deleteVehicle(vehicleId, userId);

        verify(vehicleRepository).delete(vehicle);
    }

    @Test
    void deleteVehicle_WithWrongOwner_ShouldThrow() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        assertThrows(VehicleNotOwnedException.class,
                () -> vehicleService.deleteVehicle(vehicleId, otherUserId));

        verify(vehicleRepository, never()).delete(any());
    }

    @Test
    void deleteVehicle_WithNonExistentId_ShouldThrow() {
        when(vehicleRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(VehicleNotFoundException.class,
                () -> vehicleService.deleteVehicle(999L, userId));
    }
}
