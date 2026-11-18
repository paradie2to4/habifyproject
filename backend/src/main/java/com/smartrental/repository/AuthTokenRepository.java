package com.smartrental.repository;

import com.smartrental.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
    Optional<AuthToken> findByTokenHash(String tokenHash);

    List<AuthToken> findByUserIdAndTypeAndUsedAtIsNull(String userId, String type);
}
