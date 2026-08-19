package com.autocare.mechanicservice.service;

import com.autocare.mechanicservice.dto.*;
import com.autocare.mechanicservice.entity.AvailabilityStatus;
import com.autocare.mechanicservice.entity.Mechanic;
import com.autocare.mechanicservice.exception.DuplicateEmailException;
import com.autocare.mechanicservice.exception.MechanicNotFoundException;
import com.autocare.mechanicservice.exception.MechanicNotOwnedException;
import com.autocare.mechanicservice.repository.MechanicRepository;
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
class MechanicServiceTest {

    @Mock
    private MechanicRepository mechanicRepository;

    private MechanicService mechanicService;

    private MechanicRequest request;
    private Mechanic mechanic;
    private final Long userId = 1L;
    private final Long otherUserId = 2L;
    private final Long mechanicId = 100L;

    @BeforeEach
    void setUp() {
        mechanicService = new MechanicService(mechanicRepository);

        request = new MechanicRequest();
        request.setName("John Mechanic");
        request.setPhone("9876543210");
        request.setEmail("mechanic@test.com");
        request.setSkills(List.of("ENGINE", "BRAKES"));
        request.setServiceArea("560001");

        mechanic = new Mechanic(userId, "John Mechanic", "9876543210",
                "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560001");
        mechanic.setId(mechanicId);
        mechanic.setCreatedAt(LocalDateTime.now());
        mechanic.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
        mechanic.setAverageRating(0.0);
        mechanic.setTotalJobsCompleted(0);
    }

    // ─── CREATE ─────────────────────────────────────────────────────────

    @Test
    void createMechanic_ShouldReturnMechanicResponse() {
        when(mechanicRepository.existsByEmail("mechanic@test.com")).thenReturn(false);
        when(mechanicRepository.save(any(Mechanic.class))).thenReturn(mechanic);

        MechanicResponse response = mechanicService.createMechanic(userId, request);

        assertNotNull(response);
        assertEquals(mechanicId, response.getId());
        assertEquals("John Mechanic", response.getName());
        assertEquals("9876543210", response.getPhone());
        assertEquals("mechanic@test.com", response.getEmail());
        assertEquals(List.of("ENGINE", "BRAKES"), response.getSkills());
        assertEquals("560001", response.getServiceArea());
        assertEquals(AvailabilityStatus.AVAILABLE, response.getAvailabilityStatus());
        assertEquals(0.0, response.getAverageRating());
        assertEquals(0, response.getTotalJobsCompleted());

        verify(mechanicRepository).existsByEmail("mechanic@test.com");
        verify(mechanicRepository).save(any(Mechanic.class));
    }

    @Test
    void createMechanic_WithDuplicateEmail_ShouldThrow() {
        when(mechanicRepository.existsByEmail("mechanic@test.com")).thenReturn(true);

        assertThrows(DuplicateEmailException.class,
                () -> mechanicService.createMechanic(userId, request));

        verify(mechanicRepository, never()).save(any());
    }

    // ─── LIST ALL WITH FILTERS ──────────────────────────────────────────

    @Test
    void getAllMechanics_WithNoFilters_ShouldReturnAll() {
        Mechanic mechanic2 = new Mechanic(userId, "Jane Mechanic", "9123456789",
                "jane@test.com", List.of("ELECTRICAL"), "560002");
        mechanic2.setId(101L);
        mechanic2.setCreatedAt(LocalDateTime.now());

        when(mechanicRepository.findAll()).thenReturn(List.of(mechanic, mechanic2));

        List<MechanicResponse> responses = mechanicService.getAllMechanics(null, null, null);

        assertEquals(2, responses.size());
        assertEquals("John Mechanic", responses.get(0).getName());
        assertEquals("Jane Mechanic", responses.get(1).getName());

        verify(mechanicRepository).findAll();
    }

    @Test
    void getAllMechanics_WithAvailableFilter_ShouldReturnAvailableOnly() {
        when(mechanicRepository.findByAvailabilityStatus(AvailabilityStatus.AVAILABLE))
                .thenReturn(List.of(mechanic));

        List<MechanicResponse> responses = mechanicService.getAllMechanics(true, null, null);

        assertEquals(1, responses.size());
        assertEquals("John Mechanic", responses.get(0).getName());

        verify(mechanicRepository).findByAvailabilityStatus(AvailabilityStatus.AVAILABLE);
    }

    @Test
    void getAllMechanics_WithSkillFilter_ShouldReturnMatching() {
        when(mechanicRepository.findBySkill("ENGINE")).thenReturn(List.of(mechanic));

        List<MechanicResponse> responses = mechanicService.getAllMechanics(null, "ENGINE", null);

        assertEquals(1, responses.size());
        assertEquals("John Mechanic", responses.get(0).getName());

        verify(mechanicRepository).findBySkill("ENGINE");
    }

    @Test
    void getAllMechanics_WithAreaFilter_ShouldReturnMatching() {
        when(mechanicRepository.findByServiceArea("560001")).thenReturn(List.of(mechanic));

        List<MechanicResponse> responses = mechanicService.getAllMechanics(null, null, "560001");

        assertEquals(1, responses.size());
        assertEquals("John Mechanic", responses.get(0).getName());

        verify(mechanicRepository).findByServiceArea("560001");
    }

    @Test
    void getAllMechanics_WithSkillAndArea_ShouldReturnMatching() {
        when(mechanicRepository.findBySkillAndServiceArea("ENGINE", "560001"))
                .thenReturn(List.of(mechanic));

        List<MechanicResponse> responses = mechanicService.getAllMechanics(null, "ENGINE", "560001");

        assertEquals(1, responses.size());

        verify(mechanicRepository).findBySkillAndServiceArea("ENGINE", "560001");
    }

    @Test
    void getAllMechanics_WithAllFilters_ShouldReturnMatching() {
        when(mechanicRepository.findBySkillAndAvailabilityStatusAndServiceArea(
                "ENGINE", AvailabilityStatus.AVAILABLE, "560001"))
                .thenReturn(List.of(mechanic));

        List<MechanicResponse> responses = mechanicService.getAllMechanics(true, "ENGINE", "560001");

        assertEquals(1, responses.size());

        verify(mechanicRepository).findBySkillAndAvailabilityStatusAndServiceArea(
                "ENGINE", AvailabilityStatus.AVAILABLE, "560001");
    }

    @Test
    void getAllMechanics_WithNoResults_ShouldReturnEmptyList() {
        when(mechanicRepository.findAll()).thenReturn(List.of());

        List<MechanicResponse> responses = mechanicService.getAllMechanics(null, null, null);

        assertTrue(responses.isEmpty());
    }

    // ─── GET BY ID ──────────────────────────────────────────────────────

    @Test
    void getMechanicById_ShouldReturnMechanic() {
        when(mechanicRepository.findById(mechanicId)).thenReturn(Optional.of(mechanic));

        MechanicResponse response = mechanicService.getMechanicById(mechanicId);

        assertNotNull(response);
        assertEquals(mechanicId, response.getId());
        assertEquals("John Mechanic", response.getName());
    }

    @Test
    void getMechanicById_WithNonExistentId_ShouldThrow() {
        when(mechanicRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(MechanicNotFoundException.class,
                () -> mechanicService.getMechanicById(999L));
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────

    @Test
    void updateMechanic_ShouldReturnUpdatedMechanic() {
        UpdateMechanicRequest updateRequest = new UpdateMechanicRequest();
        updateRequest.setName("John Updated");
        updateRequest.setPhone("9000000000");
        updateRequest.setServiceArea("560002");

        when(mechanicRepository.findById(mechanicId)).thenReturn(Optional.of(mechanic));

        Mechanic updatedMechanic = new Mechanic(userId, "John Updated", "9000000000",
                "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560002");
        updatedMechanic.setId(mechanicId);
        updatedMechanic.setCreatedAt(mechanic.getCreatedAt());
        when(mechanicRepository.save(any(Mechanic.class))).thenReturn(updatedMechanic);

        MechanicResponse response = mechanicService.updateMechanic(mechanicId, updateRequest);

        assertEquals("John Updated", response.getName());
        assertEquals("9000000000", response.getPhone());
        assertEquals("560002", response.getServiceArea());
        assertEquals("mechanic@test.com", response.getEmail()); // unchanged

        verify(mechanicRepository, never()).existsByEmail(any());
    }

    @Test
    void updateMechanic_WithNewEmail_ShouldCheckDuplicate() {
        UpdateMechanicRequest updateRequest = new UpdateMechanicRequest();
        updateRequest.setEmail("newemail@test.com");

        when(mechanicRepository.findById(mechanicId)).thenReturn(Optional.of(mechanic));
        when(mechanicRepository.existsByEmail("newemail@test.com")).thenReturn(true);

        assertThrows(DuplicateEmailException.class,
                () -> mechanicService.updateMechanic(mechanicId, updateRequest));

        verify(mechanicRepository, never()).save(any());
    }

    @Test
    void updateMechanic_WithNonExistentId_ShouldThrow() {
        when(mechanicRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateMechanicRequest updateRequest = new UpdateMechanicRequest();
        updateRequest.setName("Ghost");

        assertThrows(MechanicNotFoundException.class,
                () -> mechanicService.updateMechanic(999L, updateRequest));
    }

    // ─── UPDATE AVAILABILITY ────────────────────────────────────────────

    @Test
    void updateAvailability_ShouldReturnUpdatedMechanic() {
        AvailabilityUpdateRequest availRequest = new AvailabilityUpdateRequest();
        availRequest.setAvailabilityStatus(AvailabilityStatus.BUSY);

        when(mechanicRepository.findById(mechanicId)).thenReturn(Optional.of(mechanic));

        Mechanic busyMechanic = new Mechanic(userId, "John Mechanic", "9876543210",
                "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560001");
        busyMechanic.setId(mechanicId);
        busyMechanic.setCreatedAt(mechanic.getCreatedAt());
        busyMechanic.setAvailabilityStatus(AvailabilityStatus.BUSY);
        when(mechanicRepository.save(any(Mechanic.class))).thenReturn(busyMechanic);

        MechanicResponse response = mechanicService.updateAvailability(mechanicId, userId, availRequest);

        assertEquals(AvailabilityStatus.BUSY, response.getAvailabilityStatus());

        verify(mechanicRepository).save(any(Mechanic.class));
    }

    @Test
    void updateAvailability_WithWrongOwner_ShouldThrow() {
        AvailabilityUpdateRequest availRequest = new AvailabilityUpdateRequest();
        availRequest.setAvailabilityStatus(AvailabilityStatus.BUSY);

        when(mechanicRepository.findById(mechanicId)).thenReturn(Optional.of(mechanic));

        assertThrows(MechanicNotOwnedException.class,
                () -> mechanicService.updateAvailability(mechanicId, otherUserId, availRequest));

        verify(mechanicRepository, never()).save(any());
    }

    @Test
    void updateAvailability_WithNullUserId_ShouldAllowAny() {
        // Admin-created mechanic has userId = null
        Mechanic adminMechanic = new Mechanic(null, "Admin Mech", "9999999999",
                "adminmech@test.com", List.of("AC"), "100000");
        adminMechanic.setId(200L);

        AvailabilityUpdateRequest availRequest = new AvailabilityUpdateRequest();
        availRequest.setAvailabilityStatus(AvailabilityStatus.OFFLINE);

        when(mechanicRepository.findById(200L)).thenReturn(Optional.of(adminMechanic));

        Mechanic updated = new Mechanic(null, "Admin Mech", "9999999999",
                "adminmech@test.com", List.of("AC"), "100000");
        updated.setId(200L);
        updated.setAvailabilityStatus(AvailabilityStatus.OFFLINE);
        when(mechanicRepository.save(any(Mechanic.class))).thenReturn(updated);

        MechanicResponse response = mechanicService.updateAvailability(200L, 99L, availRequest);

        assertEquals(AvailabilityStatus.OFFLINE, response.getAvailabilityStatus());

        verify(mechanicRepository).save(any(Mechanic.class));
    }

    @Test
    void updateAvailability_WithNonExistentId_ShouldThrow() {
        AvailabilityUpdateRequest availRequest = new AvailabilityUpdateRequest();
        availRequest.setAvailabilityStatus(AvailabilityStatus.BUSY);

        when(mechanicRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(MechanicNotFoundException.class,
                () -> mechanicService.updateAvailability(999L, userId, availRequest));
    }

    // ─── UPDATE RATING ──────────────────────────────────────────────────

    @Test
    void updateRating_ShouldRecalculateAverageAndIncrementJobs() {
        // Start with 3 jobs at 4.0 average → total = 12.0
        mechanic.setAverageRating(4.0);
        mechanic.setTotalJobsCompleted(3);

        RatingUpdateRequest ratingRequest = new RatingUpdateRequest();
        ratingRequest.setNewRating(5.0);

        when(mechanicRepository.findById(mechanicId)).thenReturn(Optional.of(mechanic));

        // After: total = 12.0 + 5.0 = 17.0, jobs = 4, avg = 17.0 / 4 = 4.25
        Mechanic ratedMechanic = new Mechanic(userId, "John Mechanic", "9876543210",
                "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560001");
        ratedMechanic.setId(mechanicId);
        ratedMechanic.setAverageRating(4.25);
        ratedMechanic.setTotalJobsCompleted(4);
        when(mechanicRepository.save(any(Mechanic.class))).thenReturn(ratedMechanic);

        MechanicResponse response = mechanicService.updateRating(mechanicId, ratingRequest);

        assertEquals(4.25, response.getAverageRating(), 0.001);
        assertEquals(4, response.getTotalJobsCompleted());
    }

    @Test
    void updateRating_FirstJob_ShouldSetRating() {
        // First job: avg = 0.0, jobs = 0
        RatingUpdateRequest ratingRequest = new RatingUpdateRequest();
        ratingRequest.setNewRating(4.5);

        when(mechanicRepository.findById(mechanicId)).thenReturn(Optional.of(mechanic));

        // After: total = 0.0 * 0 + 4.5 = 4.5, jobs = 1, avg = 4.5 / 1 = 4.5
        Mechanic ratedMechanic = new Mechanic(userId, "John Mechanic", "9876543210",
                "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560001");
        ratedMechanic.setId(mechanicId);
        ratedMechanic.setAverageRating(4.5);
        ratedMechanic.setTotalJobsCompleted(1);
        when(mechanicRepository.save(any(Mechanic.class))).thenReturn(ratedMechanic);

        MechanicResponse response = mechanicService.updateRating(mechanicId, ratingRequest);

        assertEquals(4.5, response.getAverageRating(), 0.001);
        assertEquals(1, response.getTotalJobsCompleted());
    }

    @Test
    void updateRating_WithNonExistentId_ShouldThrow() {
        RatingUpdateRequest ratingRequest = new RatingUpdateRequest();
        ratingRequest.setNewRating(4.0);

        when(mechanicRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(MechanicNotFoundException.class,
                () -> mechanicService.updateRating(999L, ratingRequest));
    }
}
