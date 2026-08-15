package com.smartrental.controller;

import com.smartrental.dto.AffordabilityCalculationDto;
import com.smartrental.service.AffordabilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tools")
@CrossOrigin(origins = "*")
public class AffordabilityController {

    @Autowired
    private AffordabilityService affordabilityService;

    @GetMapping("/affordability")
    public ResponseEntity<AffordabilityCalculationDto> computeAffordability(
            @RequestParam double monthlyIncome,
            @RequestParam double targetRent
    ) {
        return ResponseEntity.ok(affordabilityService.calculateAffordability(monthlyIncome, targetRent));
    }
}
