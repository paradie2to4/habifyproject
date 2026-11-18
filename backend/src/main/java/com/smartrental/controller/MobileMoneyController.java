package com.smartrental.controller;

import com.smartrental.entity.RentPayment;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.MobileMoneyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Pay rent with MTN MoMo or Airtel Money: request → approve on phone → poll → receipt. */
@RestController
@RequestMapping("/api/payments/mobile-money")
public class MobileMoneyController {

    private final MobileMoneyService momo;

    public MobileMoneyController(MobileMoneyService momo) {
        this.momo = momo;
    }

    /** Which providers are switched on (so the website only offers what works). */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        CurrentUser.get();
        return ResponseEntity.ok(momo.status());
    }

    @PostMapping
    public ResponseEntity<RentPayment> request(@RequestBody Map<String, Object> body) {
        Double amount = body.get("amount") instanceof Number n ? n.doubleValue() : null;
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(momo.requestPayment(CurrentUser.get(),
                (String) body.get("leaseId"), (String) body.get("provider"), (String) body.get("phone"), amount, (String) body.get("period")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentPayment> check(@PathVariable String id) {
        return ResponseEntity.ok(momo.refresh(CurrentUser.get(), id));
    }

    /** Settle requests whose tenant closed the page before approval came through. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 90_000)
    public void settlePending() {
        try {
            momo.settlePending();
        } catch (Exception ignored) {
            // logged by the service; the next run retries
        }
    }
}
