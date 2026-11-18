package com.smartrental.controller;

import com.smartrental.entity.Lease;
import com.smartrental.entity.MaintenanceTicket;
import com.smartrental.entity.RentPayment;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.TenancyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Leases, rent payments and repair requests. Every list is scoped to the caller:
 * landlords see their own portfolio, tenants see the homes they rent.
 */
@RestController
@RequestMapping("/api")
public class TenancyController {

    private final TenancyService tenancy;

    public TenancyController(TenancyService tenancy) {
        this.tenancy = tenancy;
    }

    @GetMapping("/leases")
    public ResponseEntity<List<Lease>> leases() {
        return ResponseEntity.ok(tenancy.leasesFor(CurrentUser.get()));
    }

    @PostMapping("/leases")
    public ResponseEntity<Lease> createLease(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenancy.createLease(body, CurrentUser.get()));
    }

    @PatchMapping("/leases/{id}")
    public ResponseEntity<Lease> updateLease(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(tenancy.updateLease(id, body, CurrentUser.get()));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<RentPayment>> payments() {
        return ResponseEntity.ok(tenancy.paymentsFor(CurrentUser.get()));
    }

    @PostMapping("/payments")
    public ResponseEntity<RentPayment> recordPayment(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenancy.recordPayment(body, CurrentUser.get()));
    }

    @PostMapping("/payments/{id}/confirm")
    public ResponseEntity<RentPayment> confirmPayment(@PathVariable String id) {
        return ResponseEntity.ok(tenancy.confirmPayment(id, CurrentUser.get()));
    }

    @GetMapping("/maintenance")
    public ResponseEntity<List<MaintenanceTicket>> tickets() {
        return ResponseEntity.ok(tenancy.ticketsFor(CurrentUser.get()));
    }

    @PostMapping("/maintenance")
    public ResponseEntity<MaintenanceTicket> createTicket(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenancy.createTicket(body, CurrentUser.get()));
    }

    @PatchMapping("/maintenance/{id}")
    public ResponseEntity<MaintenanceTicket> updateTicket(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(tenancy.updateTicket(id, body, CurrentUser.get()));
    }
}
