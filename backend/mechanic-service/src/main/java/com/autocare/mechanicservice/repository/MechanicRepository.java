package com.autocare.mechanicservice.repository;

import com.autocare.mechanicservice.entity.AvailabilityStatus;
import com.autocare.mechanicservice.entity.Mechanic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MechanicRepository extends JpaRepository<Mechanic, Long> {

    Optional<Mechanic> findByUserId(Long userId);

    List<Mechanic> findByAvailabilityStatus(AvailabilityStatus availabilityStatus);

    List<Mechanic> findByServiceArea(String serviceArea);

    List<Mechanic> findByAvailabilityStatusAndServiceArea(
            AvailabilityStatus availabilityStatus, String serviceArea);

    @Query("SELECT m FROM Mechanic m JOIN m.skills s WHERE s = :skill")
    List<Mechanic> findBySkill(@Param("skill") String skill);

    @Query("SELECT m FROM Mechanic m JOIN m.skills s WHERE s = :skill AND m.availabilityStatus = :status")
    List<Mechanic> findBySkillAndAvailabilityStatus(
            @Param("skill") String skill,
            @Param("status") AvailabilityStatus status);

    @Query("SELECT m FROM Mechanic m JOIN m.skills s WHERE s = :skill AND m.serviceArea = :area")
    List<Mechanic> findBySkillAndServiceArea(
            @Param("skill") String skill,
            @Param("area") String area);

    @Query("SELECT m FROM Mechanic m JOIN m.skills s WHERE s = :skill AND m.availabilityStatus = :status AND m.serviceArea = :area")
    List<Mechanic> findBySkillAndAvailabilityStatusAndServiceArea(
            @Param("skill") String skill,
            @Param("status") AvailabilityStatus status,
            @Param("area") String area);

    boolean existsByEmail(String email);
}
