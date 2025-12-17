package com.expensetracker.controller;

import com.expensetracker.dto.*;
import com.expensetracker.security.CurrentUser;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getAllExpenses(
            @CurrentUser String userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer limit,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortType) {
        
        List<ExpenseResponse> expenses = expenseService.getAllExpenses(
                userId, page, limit, category, startDate, endDate, sortBy, sortType);
        
        return ResponseEntity.ok(ApiResponse.success(expenses, "Expenses fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponse>> createExpense(
            @CurrentUser String userId,
            @Valid @RequestBody ExpenseRequest request) {
        
        ExpenseResponse expense = expenseService.createExpense(userId, request);
        return ResponseEntity.status(201)
                .body(ApiResponse.success(200, expense, "Expense created successfully"));
    }

    @GetMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getExpenseById(
            @CurrentUser String userId,
            @PathVariable String expenseId) {
        
        ExpenseResponse expense = expenseService.getExpenseById(userId, expenseId);
        return ResponseEntity.ok(ApiResponse.success(expense, "Expense fetched successfully"));
    }

    @PatchMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> updateExpense(
            @CurrentUser String userId,
            @PathVariable String expenseId,
            @RequestBody ExpenseRequest request) {
        
        ExpenseResponse expense = expenseService.updateExpense(userId, expenseId, request);
        return ResponseEntity.ok(ApiResponse.success(expense, "Expense updated successfully"));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<Object>> deleteExpense(
            @CurrentUser String userId,
            @PathVariable String expenseId) {
        
        expenseService.deleteExpense(userId, expenseId);
        return ResponseEntity.ok(ApiResponse.success(null, "Expense deleted successfully"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ExpenseStatsResponse>> getExpenseStats(
            @CurrentUser String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        ExpenseStatsResponse stats = expenseService.getExpenseStats(userId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(stats, "Expense statistics fetched successfully"));
    }

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> importExpenses(
            @CurrentUser String userId,
            @RequestBody ImportExpensesRequest request) {
        
        int count = expenseService.importExpenses(userId, request);
        return ResponseEntity.status(201)
                .body(ApiResponse.success(200, Map.of("count", count), "Expenses imported successfully"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<List<ExpenseResponse>>> getDashboardExpenses(
            @CurrentUser String userId,
            @RequestParam(required = false) String timeFilter) {
        
        List<ExpenseResponse> expenses = expenseService.getDashboardExpenses(userId, timeFilter);
        return ResponseEntity.ok(ApiResponse.success(expenses, "Dashboard expenses retrieved successfully"));
    }
}
