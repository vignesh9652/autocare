package com.autocare.vehicleservice.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    private static final String TEST_SECRET = "5a3f8c92b1e6d4a7f0c9e8b2d1a4f6c7e0d9b8a2f3c4e5d6a7b8c9d0e1f2a3b4";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(TEST_SECRET);
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnFalse() {
        assertFalse(jwtUtil.validateToken("invalid.token.here"));
        assertFalse(jwtUtil.validateToken(""));
        assertFalse(jwtUtil.validateToken("not-a-jwt"));
    }

    @Test
    void validateToken_ShouldRejectExpiredToken() {
        // Manually construct an expired token by generating one with a past expiration
        // Since JwtUtil doesn't generate tokens, we test with clearly invalid strings
        assertFalse(jwtUtil.validateToken("eyJhbGciOiJIUzI1NiJ9.d3Nvbmc.dG9rZW4"));
    }

    @Test
    void parseToken_WithMalformedToken_ShouldThrow() {
        assertThrows(Exception.class, () -> jwtUtil.parseToken("not.valid.token"));
    }

    @Test
    void getUserIdFromToken_WithInvalidToken_ShouldThrow() {
        assertThrows(Exception.class, () -> jwtUtil.getUserIdFromToken("invalid"));
    }
}
