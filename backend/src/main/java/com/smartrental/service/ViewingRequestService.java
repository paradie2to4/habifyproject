package com.smartrental.service;

import com.smartrental.entity.ViewingRequest;
import com.smartrental.repository.ViewingRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ViewingRequestService {

    @Autowired
    private ViewingRequestRepository requestRepository;

    public List<ViewingRequest> getRequestsByTenant(String tenantId) {
        return requestRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<ViewingRequest> getRequestsByLandlord(String landlordId) {
        return requestRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId);
    }

    public List<ViewingRequest> getAllRequestsForAdmin() {
        return requestRepository.findAll();
    }

    public ViewingRequest createViewingRequest(ViewingRequest req) {
        if (req.getId() == null || req.getId().trim().isEmpty()) {
            req.setId("req-" + UUID.randomUUID().toString().substring(0, 8));
        }
        req.setStatus("PENDING");
        req.setCreatedAt(LocalDateTime.now());
        return requestRepository.save(req);
    }

    public ViewingRequest updateStatus(String id, String status) {
        return requestRepository.findById(id).map(r -> {
            r.setStatus(status);
            return requestRepository.save(r);
        }).orElseThrow(() -> new RuntimeException("Viewing request not found with id: " + id));
    }
}
