package com.smartrental.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries")
public class Inquiry {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "property_id", nullable = false)
    private String propertyId;

    @Column(name = "property_title", nullable = false)
    private String propertyTitle;

    @Column(name = "property_image")
    private String propertyImage;

    @Column(name = "property_location")
    private String propertyLocation;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "tenant_name", nullable = false)
    private String tenantName;

    @Column(name = "tenant_email", nullable = false)
    private String tenantEmail;

    @Column(name = "landlord_id", nullable = false)
    private String landlordId;

    @Column(name = "landlord_name")
    private String landlordName;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(nullable = false)
    private String status = "UNREAD"; // UNREAD, READ, REPLIED

    @Column(columnDefinition = "TEXT")
    private String reply;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Inquiry() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPropertyId() { return propertyId; }
    public void setPropertyId(String propertyId) { this.propertyId = propertyId; }

    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }

    public String getPropertyImage() { return propertyImage; }
    public void setPropertyImage(String propertyImage) { this.propertyImage = propertyImage; }

    public String getPropertyLocation() { return propertyLocation; }
    public void setPropertyLocation(String propertyLocation) { this.propertyLocation = propertyLocation; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }

    public String getTenantEmail() { return tenantEmail; }
    public void setTenantEmail(String tenantEmail) { this.tenantEmail = tenantEmail; }

    public String getLandlordId() { return landlordId; }
    public void setLandlordId(String landlordId) { this.landlordId = landlordId; }

    public String getLandlordName() { return landlordName; }
    public void setLandlordName(String landlordName) { this.landlordName = landlordName; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public LocalDateTime getRepliedAt() { return repliedAt; }
    public void setRepliedAt(LocalDateTime repliedAt) { this.repliedAt = repliedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
