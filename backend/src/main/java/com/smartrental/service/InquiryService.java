package com.smartrental.service;

import com.smartrental.entity.Inquiry;
import com.smartrental.repository.InquiryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InquiryService {

    @Autowired
    private InquiryRepository inquiryRepository;

    public List<Inquiry> getInquiriesByTenant(String tenantId) {
        return inquiryRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<Inquiry> getInquiriesByLandlord(String landlordId) {
        return inquiryRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId);
    }

    public List<Inquiry> getAllInquiriesForAdmin() {
        return inquiryRepository.findAll();
    }

    public Inquiry createInquiry(Inquiry inq) {
        if (inq.getId() == null || inq.getId().trim().isEmpty()) {
            inq.setId("inq-" + UUID.randomUUID().toString().substring(0, 8));
        }
        inq.setStatus("UNREAD");
        inq.setCreatedAt(LocalDateTime.now());
        return inquiryRepository.save(inq);
    }

    public Inquiry updateStatus(String id, String status) {
        return inquiryRepository.findById(id).map(i -> {
            i.setStatus(status);
            return inquiryRepository.save(i);
        }).orElseThrow(() -> new RuntimeException("Inquiry not found with id: " + id));
    }
}
