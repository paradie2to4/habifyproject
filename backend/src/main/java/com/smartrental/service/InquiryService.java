package com.smartrental.service;

import com.smartrental.entity.Inquiry;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.InquiryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class InquiryService {

    private static final Set<String> STATUSES = Set.of("UNREAD", "READ", "REPLIED");

    private final InquiryRepository inquiryRepository;

    public InquiryService(InquiryRepository inquiryRepository) {
        this.inquiryRepository = inquiryRepository;
    }

    public List<Inquiry> getInquiriesByTenant(String tenantId) {
        return inquiryRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<Inquiry> getInquiriesByLandlord(String landlordId) {
        return inquiryRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId);
    }

    public List<Inquiry> getAllInquiriesForAdmin() {
        return inquiryRepository.findAll();
    }

    public Inquiry findById(String id) {
        return inquiryRepository.findById(id).orElseThrow(() -> ApiException.notFound("Inquiry"));
    }

    public Inquiry createInquiry(Inquiry inq) {
        if (inq.getId() == null || inq.getId().trim().isEmpty()) {
            inq.setId("inq-" + UUID.randomUUID().toString().substring(0, 8));
        }
        inq.setStatus("UNREAD");
        inq.setReply(null);
        inq.setRepliedAt(null);
        inq.setCreatedAt(LocalDateTime.now());
        return inquiryRepository.save(inq);
    }

    public Inquiry updateStatus(String id, String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!STATUSES.contains(normalized)) throw ApiException.badRequest("Unknown inquiry status: " + status);
        Inquiry inquiry = findById(id);
        inquiry.setStatus(normalized);
        return inquiryRepository.save(inquiry);
    }

    public Inquiry reply(String id, String reply) {
        Inquiry inquiry = findById(id);
        inquiry.setReply(reply);
        inquiry.setRepliedAt(LocalDateTime.now());
        inquiry.setStatus("REPLIED");
        return inquiryRepository.save(inquiry);
    }
}
