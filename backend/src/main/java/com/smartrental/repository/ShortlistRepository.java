package com.smartrental.repository;

import com.smartrental.entity.Shortlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShortlistRepository extends JpaRepository<Shortlist, String> {
    List<Shortlist> findByOwnerIdOrderByUpdatedAtDesc(String ownerId);

    Optional<Shortlist> findByShareToken(String shareToken);

    long countByOwnerId(String ownerId);
}
