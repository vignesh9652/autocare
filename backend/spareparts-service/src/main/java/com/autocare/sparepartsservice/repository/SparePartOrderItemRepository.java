package com.autocare.sparepartsservice.repository;

import com.autocare.sparepartsservice.entity.SparePartOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SparePartOrderItemRepository extends JpaRepository<SparePartOrderItem, Long> {

    List<SparePartOrderItem> findByOrderId(Long orderId);
}
