package com.smartrental.repository;

import com.smartrental.entity.UploadedImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UploadedImageRepository extends JpaRepository<UploadedImage, String> {
}
