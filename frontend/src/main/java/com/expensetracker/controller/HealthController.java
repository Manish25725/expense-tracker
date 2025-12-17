package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> health = Map.of(
            "status", "ok",
            "timestamp", System.currentTimeMillis(),
            "service", "expense-tracker-api"
        );
        return ResponseEntity.ok(ApiResponse.success(health, "Service is healthy"));
    }
}
