package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Photo stored in the database when Cloudinary isn't configured. Images are resized in the
 * browser before upload (≈150–400 KB), so this is fine for a small site; use Cloudinary at scale.
 */
@Entity
@Table(name = "uploaded_images")
@Getter
@Setter
@NoArgsConstructor
public class UploadedImage {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "owner_id", nullable = false, length = 50)
    private String ownerId;

    @Column(name = "content_type", nullable = false, length = 40)
    private String contentType;

    @Column(name = "size_bytes")
    private Integer sizeBytes;

    /** bytea on PostgreSQL, varbinary on H2 (avoids Postgres large-object handling) */
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
