package com.autocare.mechanicservice.service;

import com.autocare.mechanicservice.dto.*;
import com.autocare.mechanicservice.entity.AvailabilityStatus;
import com.autocare.mechanicservice.entity.Mechanic;
import com.autocare.mechanicservice.exception.DuplicateEmailException;
import com.autocare.mechanicservice.exception.MechanicNotFoundException;
import com.autocare.mechanicservice.exception.MechanicNotOwnedException;
import com.autocare.mechanicservice.repository.MechanicRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MechanicService {

    private final MechanicRepository mechanicRepository;

    public MechanicService(MechanicRepository mechanicRepository) {
        this.mechanicRepository = mechanicRepository;
    }

    public MechanicResponse createMechanic(Long userId, MechanicRequest request) {
        if (mechanicRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(
                    "A mechanic with email '" + request.getEmail() + "' already exists");
        }

        Mechanic mechanic = new Mechanic(
                userId,
                request.getName(),
                normalizePhone(request.getPhone()),
                request.getEmail(),
                request.getSkills(),
                request.getServiceArea()
        );
        mechanic.setLatitude(request.getLatitude());
        mechanic.setLongitude(request.getLongitude());

        mechanic = mechanicRepository.save(mechanic);
        return toResponse(mechanic);
    }

    public List<MechanicResponse> getAllMechanics(
            Boolean available, String skill, String area) {

        // If no filters, return all
        if (available == null && skill == null && area == null) {
            return mechanicRepository.findAll()
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // Determine the availability status filter
        AvailabilityStatus status = null;
        if (Boolean.TRUE.equals(available)) {
            status = AvailabilityStatus.AVAILABLE;
        }

        List<Mechanic> mechanics;

        if (skill != null && status != null && area != null) {
            mechanics = mechanicRepository.findBySkillAndAvailabilityStatusAndServiceArea(skill, status, area);
        } else if (skill != null && status != null) {
            mechanics = mechanicRepository.findBySkillAndAvailabilityStatus(skill, status);
        } else if (skill != null && area != null) {
            mechanics = mechanicRepository.findBySkillAndServiceArea(skill, area);
        } else if (status != null && area != null) {
            mechanics = mechanicRepository.findByAvailabilityStatusAndServiceArea(status, area);
        } else if (status != null) {
            mechanics = mechanicRepository.findByAvailabilityStatus(status);
        } else if (skill != null) {
            mechanics = mechanicRepository.findBySkill(skill);
        } else if (area != null) {
            mechanics = mechanicRepository.findByServiceArea(area);
        } else {
            mechanics = mechanicRepository.findAll();
        }

        return mechanics.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public MechanicResponse getMechanicById(Long id) {
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new MechanicNotFoundException("Mechanic not found with id: " + id));
        return toResponse(mechanic);
    }

    public MechanicResponse getMechanicByUserId(Long userId) {
        Mechanic mechanic = mechanicRepository.findByUserId(userId)
                .orElseThrow(() -> new MechanicNotFoundException(
                        "No mechanic profile linked to user id: " + userId));
        return toResponse(mechanic);
    }

    public MechanicResponse updateMechanic(Long id, UpdateMechanicRequest request) {
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new MechanicNotFoundException("Mechanic not found with id: " + id));

        if (request.getName() != null) {
            mechanic.setName(request.getName());
        }
        if (request.getPhone() != null) {
            mechanic.setPhone(normalizePhone(request.getPhone()));
        }
        if (request.getEmail() != null) {
            // Check if the new email is already taken by another mechanic
            if (!request.getEmail().equals(mechanic.getEmail())
                    && mechanicRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateEmailException(
                        "A mechanic with email '" + request.getEmail() + "' already exists");
            }
            mechanic.setEmail(request.getEmail());
        }
        if (request.getSkills() != null) {
            mechanic.setSkills(request.getSkills());
        }
        if (request.getServiceArea() != null) {
            mechanic.setServiceArea(request.getServiceArea());
        }
        if (request.getLatitude() != null) {
            mechanic.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            mechanic.setLongitude(request.getLongitude());
        }

        mechanic = mechanicRepository.save(mechanic);
        return toResponse(mechanic);
    }

    public MechanicResponse updateAvailability(Long id, Long userId, AvailabilityUpdateRequest request) {
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new MechanicNotFoundException("Mechanic not found with id: " + id));

        if (mechanic.getUserId() != null && !mechanic.getUserId().equals(userId)) {
            throw new MechanicNotOwnedException(
                    "This mechanic profile does not belong to you");
        }

        mechanic.setAvailabilityStatus(request.getAvailabilityStatus());
        mechanic = mechanicRepository.save(mechanic);
        return toResponse(mechanic);
    }

    public MechanicResponse updateRating(Long id, RatingUpdateRequest request) {
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new MechanicNotFoundException("Mechanic not found with id: " + id));

        // Recalculate average rating
        double oldTotal = mechanic.getAverageRating() * mechanic.getTotalJobsCompleted();
        double newTotal = oldTotal + request.getNewRating();
        int newJobCount = mechanic.getTotalJobsCompleted() + 1;
        double newAverage = newTotal / newJobCount;

        mechanic.setAverageRating(Math.round(newAverage * 100.0) / 100.0);
        mechanic.setTotalJobsCompleted(newJobCount);
        mechanic = mechanicRepository.save(mechanic);
        return toResponse(mechanic);
    }

    /**
     * Strips any +91 prefix / separators so stored numbers are always a clean
     * 10-digit Indian mobile format (e.g. "+91 98765 43210" → "9876543210").
     */
    private static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return phone;
        }
        String digits = phone.replaceAll("\\D", "");
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    private MechanicResponse toResponse(Mechanic mechanic) {
        return new MechanicResponse(
                mechanic.getId(),
                mechanic.getUserId(),
                mechanic.getName(),
                mechanic.getPhone(),
                mechanic.getEmail(),
                mechanic.getSkills(),
                mechanic.getServiceArea(),
                mechanic.getLatitude(),
                mechanic.getLongitude(),
                mechanic.getAvailabilityStatus(),
                mechanic.getAverageRating(),
                mechanic.getTotalJobsCompleted()
        );
    }
}
