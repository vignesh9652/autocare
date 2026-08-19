package com.autocare.sparepartsservice.repository;

import com.autocare.sparepartsservice.entity.DIYStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiyStepRepository extends JpaRepository<DIYStep, Long> {

    List<DIYStep> findByDiyGuideIdOrderByStepNumberAsc(Long diyGuideId);

    void deleteByDiyGuideId(Long diyGuideId);
}
