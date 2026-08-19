package com.autocare.sparepartsservice.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, ObjectMapper objectMapper) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/parts/**").permitAll()
                .requestMatchers("/api/parts/**").authenticated()
                // Orders: customers place/track their own; admins drive delivery.
                // The internal status endpoint is service-to-service (no user
                // context available server-side) and only exposes order status.
                .requestMatchers("/api/orders/internal/**").permitAll()
                .requestMatchers("/api/orders/**").authenticated()
                // DIY guide management is ADMIN-only
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/recommendations/**").authenticated()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                // No / invalid JWT → 401
                .authenticationEntryPoint((request, response, authException) ->
                        writeJson(response, HttpStatus.UNAUTHORIZED,
                                "Unauthorized - valid token required"))
                // Valid JWT but insufficient role → 403
                .accessDeniedHandler((request, response, accessDeniedException) ->
                        writeJson(response, HttpStatus.FORBIDDEN,
                                "Forbidden - insufficient permissions"))
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void writeJson(jakarta.servlet.http.HttpServletResponse response,
                           HttpStatus status,
                           String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of("error", message));
    }
}
