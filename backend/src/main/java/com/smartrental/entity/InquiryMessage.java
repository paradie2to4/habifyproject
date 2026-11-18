package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One message in a tenant ↔ landlord conversation (the Inquiry is the thread). */
@Entity
@Table(name = "inquiry_messages", indexes = @Index(name = "idx_msg_inquiry", columnList = "inquiry_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
public class InquiryMessage {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "inquiry_id", nullable = false, length = 50)
    private String inquiryId;

    @Column(name = "sender_id", nullable = false, length = 50)
    private String senderId;

    @Column(name = "sender_name")
    private String senderName;

    /** TENANT or LANDLORD */
    @Column(name = "sender_role", length = 20)
    private String senderRole;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** When the other participant opened the thread after this message arrived. */
    @Column(name = "read_at")
    private LocalDateTime readAt;
}
