package com.autocare.sparepartsservice.repository;

import com.autocare.sparepartsservice.entity.DiyStatus;
import com.autocare.sparepartsservice.entity.DIYGuide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiyGuideRepository extends JpaRepository<DIYGuide, Long> {

    Optional<DIYGuide> findBySparePartId(Long sparePartId);

    Optional<DIYGuide> findBySparePartIdAndStatus(Long sparePartId, DiyStatus status);

    List<DIYGuide> findAllByOrderByUpdatedAtDesc();
}
