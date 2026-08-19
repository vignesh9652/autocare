package com.autocare.sparepartsservice.repository;

import com.autocare.sparepartsservice.entity.SparePart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    List<SparePart> findByCategory(String category);

    @Query("SELECT s FROM SparePart s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<SparePart> findByNameContainingIgnoreCase(@Param("search") String search);

    @Query("SELECT s FROM SparePart s WHERE (:category IS NULL OR s.category = :category) " +
           "AND (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<SparePart> findByCategoryAndSearch(@Param("category") String category,
                                            @Param("search") String search);
}
