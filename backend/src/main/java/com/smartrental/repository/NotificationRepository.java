package com.smartrental.repository;

import com.smartrental.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable page);

    long countByUserIdAndReadAtIsNull(String userId);

    boolean existsByUserIdAndDedupeKey(String userId, String dedupeKey);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.userId = :userId AND n.readAt IS NULL")
    int markAllRead(@Param("userId") String userId, @Param("now") LocalDateTime now);
}
