package com.autocare.userservice.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP service for password reset flows.
 * Production would send the OTP by email/SMS; here we store it in memory
 * (with expiry) and expose it in the response for demo/development.
 */
@Service
public class OtpService {

    private static final Duration TTL = Duration.ofMinutes(10);
    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();

    public record OtpEntry(String code, Instant expiresAt) {}

    public String generateOtp(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        store.put(email.toLowerCase(), new OtpEntry(code, Instant.now().plus(TTL)));
        return code;
    }

    public boolean verify(String email, String code) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (entry.expiresAt().isBefore(Instant.now())) {
            store.remove(email.toLowerCase());
            return false;
        }
        if (!entry.code().equals(code)) return false;
        store.remove(email.toLowerCase());
        return true;
    }
}
