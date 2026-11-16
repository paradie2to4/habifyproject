package com.smartrental.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartrental.exception.GlobalExceptionHandler;
import com.smartrental.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, ObjectMapper objectMapper) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/actuator/health/**", "/actuator/info", "/h2-console/**", "/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/properties/**", "/api/tools/**").permitAll()
                // Role-gated
                .requestMatchers("/api/admin/**", "/actuator/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/properties/**").hasAnyRole("LANDLORD", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/properties/**").hasAnyRole("LANDLORD", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/properties/**").hasAnyRole("LANDLORD", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/properties/**").hasAnyRole("LANDLORD", "ADMIN")
                // Everything else needs a valid token; ownership is checked in controllers
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> writeError(res, HttpStatus.UNAUTHORIZED,
                        "Authentication required — please sign in", req.getRequestURI()))
                .accessDeniedHandler((req, res, e) -> writeError(res, HttpStatus.FORBIDDEN,
                        "You do not have permission to perform this action", req.getRequestURI()))
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }

    /** Keep the JWT filter out of the plain servlet chain; it runs only inside Spring Security. */
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    private void writeError(jakarta.servlet.http.HttpServletResponse res, HttpStatus status, String message, String path)
            throws java.io.IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(res.getOutputStream(), GlobalExceptionHandler.body(status, message, path));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        CorsConfiguration configuration = new CorsConfiguration();
        // Patterns allow Vercel preview URLs when you add https://*.vercel.app
        configuration.setAllowedOriginPatterns(origins.isEmpty() ? List.of("http://localhost:3000") : origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
