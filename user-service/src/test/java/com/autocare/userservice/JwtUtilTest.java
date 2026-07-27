package com.autocare.userservice;

import com.autocare.userservice.entity.Role;
import com.autocare.userservice.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    private static final String TEST_SECRET = "5a3f8c92b1e6d4a7f0c9e8b2d1a4f6c7e0d9b8a2f3c4e5d6a7b8c9d0e1f2a3b4";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(TEST_SECRET, 86400000L);
    }

    @Test
    void generateToken_ShouldReturnValidToken() {
        String token = jwtUtil.generateToken(1L, "test@example.com", Role.CUSTOMER);

        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3, "JWT should have 3 parts");
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        String token = jwtUtil.generateToken(1L, "test@example.com", Role.CUSTOMER);

        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnFalse() {
        assertFalse(jwtUtil.validateToken("invalid.token.here"));
        assertFalse(jwtUtil.validateToken(""));
        assertFalse(jwtUtil.validateToken(null));
    }

    @Test
    void getUserIdFromToken_ShouldReturnCorrectUserId() {
        String token = jwtUtil.generateToken(42L, "test@example.com", Role.CUSTOMER);

        Long userId = jwtUtil.getUserIdFromToken(token);

        assertEquals(42L, userId);
    }

    @Test
    void getEmailFromToken_ShouldReturnCorrectEmail() {
        String token = jwtUtil.generateToken(1L, "test@example.com", Role.CUSTOMER);

        String email = jwtUtil.getEmailFromToken(token);

        assertEquals("test@example.com", email);
    }

    @Test
    void getRoleFromToken_ShouldReturnCorrectRole() {
        String token = jwtUtil.generateToken(1L, "test@example.com", Role.MECHANIC);

        String role = jwtUtil.getRoleFromToken(token);

        assertEquals("MECHANIC", role);
    }

    @Test
    void parseToken_ShouldExtractAllClaims() {
        String token = jwtUtil.generateToken(99L, "user@domain.com", Role.ADMIN);

        var claims = jwtUtil.parseToken(token);

        assertEquals("99", claims.getSubject());
        assertEquals("user@domain.com", claims.get("email"));
        assertEquals("ADMIN", claims.get("role"));
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
    }
}
