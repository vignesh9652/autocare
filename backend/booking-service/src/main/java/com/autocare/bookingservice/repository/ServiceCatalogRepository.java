package com.autocare.bookingservice.repository;

import com.autocare.bookingservice.entity.ServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, Long> {

    List<ServiceCatalog> findByActiveTrueOrderByServiceNameAsc();

    List<ServiceCatalog> findAllByOrderByServiceNameAsc();

    Optional<ServiceCatalog> findByServiceNameIgnoreCase(String serviceName);

    List<ServiceCatalog> findByServiceNameIgnoreCaseIn(Collection<String> serviceNames);
}
