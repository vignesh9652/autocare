package com.autocare.sparepartsservice.repository;

import com.autocare.sparepartsservice.entity.SparePartOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SparePartOrderRepository extends JpaRepository<SparePartOrder, Long> {

    List<SparePartOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<SparePartOrder> findAllByOrderByCreatedAtDesc();
}
