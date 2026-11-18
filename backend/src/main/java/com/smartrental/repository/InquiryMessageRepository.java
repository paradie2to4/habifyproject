package com.smartrental.repository;

import com.smartrental.entity.InquiryMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InquiryMessageRepository extends JpaRepository<InquiryMessage, String> {
    List<InquiryMessage> findByInquiryIdOrderByCreatedAtAsc(String inquiryId);

    Optional<InquiryMessage> findFirstByInquiryIdOrderByCreatedAtDesc(String inquiryId);

    long countByInquiryIdAndSenderIdNotAndReadAtIsNull(String inquiryId, String senderId);

    boolean existsByInquiryId(String inquiryId);

    /** Read receipts: mark everything the other person sent as read. */
    @Modifying
    @Query("UPDATE InquiryMessage m SET m.readAt = :now WHERE m.inquiryId = :inquiryId AND m.senderId <> :readerId AND m.readAt IS NULL")
    int markReadFor(@Param("inquiryId") String inquiryId, @Param("readerId") String readerId, @Param("now") LocalDateTime now);
}
