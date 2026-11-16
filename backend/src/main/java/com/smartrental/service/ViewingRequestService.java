package com.smartrental.service;

import com.smartrental.entity.ViewingRequest;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.ViewingRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ViewingRequestService {

    public static final Set<String> STATUSES = Set.of("PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED");

    private final ViewingRequestRepository requestRepository;

    public ViewingRequestService(ViewingRequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    public List<ViewingRequest> getRequestsByTenant(String tenantId) {
        return requestRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<ViewingRequest> getRequestsByLandlord(String landlordId) {
        return requestRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId);
    }

    public List<ViewingRequest> getAllRequestsForAdmin() {
        return requestRepository.findAll();
    }

    public ViewingRequest findById(String id) {
        return requestRepository.findById(id).orElseThrow(() -> ApiException.notFound("Viewing request"));
    }

    public ViewingRequest createViewingRequest(ViewingRequest req) {
        if (req.getId() == null || req.getId().trim().isEmpty()) {
            req.setId("req-" + UUID.randomUUID().toString().substring(0, 8));
        }
        req.setStatus("PENDING");
        req.setLandlordNote(null);
        req.setCreatedAt(LocalDateTime.now());
        req.setUpdatedAt(LocalDateTime.now());
        return requestRepository.save(req);
    }

    /** Accepts the legacy "CONFIRMED" value as an alias for APPROVED. */
    public static String normalizeStatus(String status) {
        String s = status == null ? "" : status.trim().toUpperCase();
        if ("CONFIRMED".equals(s)) s = "APPROVED";
        if (!STATUSES.contains(s)) throw ApiException.badRequest("Unknown viewing status: " + status);
        return s;
    }

    public ViewingRequest updateStatus(String id, String status, String landlordNote) {
        ViewingRequest r = findById(id);
        r.setStatus(normalizeStatus(status));
        if (landlordNote != null && !landlordNote.isBlank()) r.setLandlordNote(landlordNote.trim());
        r.setUpdatedAt(LocalDateTime.now());
        return requestRepository.save(r);
    }

    public ViewingRequest updateStatus(String id, String status) {
        return updateStatus(id, status, null);
    }
}
