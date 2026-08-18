package com.autocare.bookingservice.repository;

import com.autocare.bookingservice.entity.MechanicWallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MechanicWalletRepository extends JpaRepository<MechanicWallet, Long> {

    Optional<MechanicWallet> findByMechanicId(Long mechanicId);

    boolean existsByMechanicId(Long mechanicId);
}
