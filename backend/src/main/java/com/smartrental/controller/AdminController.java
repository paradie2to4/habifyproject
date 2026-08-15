package com.smartrental.controller;

import com.smartrental.entity.Property;
import com.smartrental.entity.PropertyReport;
import com.smartrental.entity.User;
import com.smartrental.repository.PropertyReportRepository;
import com.smartrental.repository.UserRepository;
import com.smartrental.service.PropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyReportRepository reportRepository;

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        List<Property> allProps = propertyService.getAllPropertiesForAdmin();
        List<User> allUsers = userRepository.findAll();
        List<PropertyReport> pendingReports = reportRepository.findByStatusOrderByCreatedAtDesc("PENDING");

        long activeListings = allProps.stream().filter(p -> Boolean.TRUE.equals(p.getIsAvailable())).count();
        long totalTenants = allUsers.stream().filter(u -> "TENANT".equalsIgnoreCase(u.getRole())).count();
        long totalLandlords = allUsers.stream().filter(u -> "LANDLORD".equalsIgnoreCase(u.getRole())).count();
        double avgMonthlyRent = allProps.stream().mapToDouble(Property::getMonthlyRent).average().orElse(0.0);

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalProperties", allProps.size());
        metrics.put("activeListings", activeListings);
        metrics.put("totalUsers", allUsers.size());
        metrics.put("totalTenants", totalTenants);
        metrics.put("totalLandlords", totalLandlords);
        metrics.put("pendingReportsCount", pendingReports.size());
        metrics.put("averageRentRwf", Math.round(avgMonthlyRent));

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{id}/toggle-status")
    public ResponseEntity<User> toggleUserStatus(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reports")
    public ResponseEntity<List<PropertyReport>> getReports() {
        return ResponseEntity.ok(reportRepository.findAll());
    }

    @PatchMapping("/reports/{id}/status")
    public ResponseEntity<PropertyReport> updateReportStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusBody
    ) {
        return reportRepository.findById(id).map(rep -> {
            rep.setStatus(statusBody.get("status"));
            return ResponseEntity.ok(reportRepository.save(rep));
        }).orElse(ResponseEntity.notFound().build());
    }
}
