package com.expensetracker.service;

import com.expensetracker.dto.*;
import com.expensetracker.exception.ApiException;
import com.expensetracker.model.Expense;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final MongoTemplate mongoTemplate;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEE MMM dd yyyy");

    public ExpenseResponse createExpense(String userId, ExpenseRequest request) {
        log.info("Creating expense for user: {}", userId);

        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getAmount() == null ||
            request.getCategory() == null || request.getCategory().trim().isEmpty() ||
            request.getPaymentType() == null || request.getPaymentType().trim().isEmpty()) {
            throw new ApiException(400, "Name, amount, category, and payment type are required");
        }

        if (request.getAmount() <= 0) {
            throw new ApiException(400, "Amount must be greater than 0");
        }

        Expense expense = Expense.builder()
                .name(request.getName().trim())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDateTime.now())
                .category(request.getCategory().trim())
                .paymentType(request.getPaymentType().trim())
                .comment(request.getComment() != null ? request.getComment().trim() : "")
                .owner(userId)
                .build();

        Expense savedExpense = expenseRepository.save(expense);

        // Update user's expense count
        userService.incrementExpenseCount(userId);

        return mapToExpenseResponse(savedExpense);
    }

    public List<ExpenseResponse> getAllExpenses(String userId, Integer page, Integer limit,
                                                 String category, LocalDateTime startDate, LocalDateTime endDate,
                                                 String sortBy, String sortType) {
        log.info("Getting all expenses for user: {}", userId);

        Sort sort = Sort.by(sortType.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, 
                           sortBy != null ? sortBy : "expenseDate");
        Pageable pageable = PageRequest.of(page - 1, limit, sort);

        Page<Expense> expenses;

        if (category != null && !category.isEmpty() && startDate != null && endDate != null) {
            expenses = expenseRepository.findByOwnerAndCategoryAndExpenseDateBetween(userId, category, startDate, endDate, pageable);
        } else if (category != null && !category.isEmpty()) {
            expenses = expenseRepository.findByOwnerAndCategory(userId, category, pageable);
        } else if (startDate != null && endDate != null) {
            expenses = expenseRepository.findByOwnerAndExpenseDateBetween(userId, startDate, endDate, pageable);
        } else {
            expenses = expenseRepository.findByOwner(userId, pageable);
        }

        return expenses.getContent().stream()
                .map(this::mapToExpenseResponse)
                .collect(Collectors.toList());
    }

    public ExpenseResponse getExpenseById(String userId, String expenseId) {
        Expense expense = expenseRepository.findByIdAndOwner(expenseId, userId)
                .orElseThrow(() -> new ApiException(404, "Expense not found"));

        return mapToExpenseResponse(expense);
    }

    public ExpenseResponse updateExpense(String userId, String expenseId, ExpenseRequest request) {
        Expense expense = expenseRepository.findByIdAndOwner(expenseId, userId)
                .orElseThrow(() -> new ApiException(404, "Expense not found"));

        if (request.getName() != null) {
            expense.setName(request.getName().trim());
        }
        if (request.getAmount() != null) {
            if (request.getAmount() <= 0) {
                throw new ApiException(400, "Amount must be greater than 0");
            }
            expense.setAmount(request.getAmount());
        }
        if (request.getExpenseDate() != null) {
            expense.setExpenseDate(request.getExpenseDate());
        }
        if (request.getCategory() != null) {
            expense.setCategory(request.getCategory().trim());
        }
        if (request.getPaymentType() != null) {
            expense.setPaymentType(request.getPaymentType().trim());
        }
        if (request.getComment() != null) {
            expense.setComment(request.getComment().trim());
        }

        Expense updatedExpense = expenseRepository.save(expense);
        return mapToExpenseResponse(updatedExpense);
    }

    public void deleteExpense(String userId, String expenseId) {
        Expense expense = expenseRepository.findByIdAndOwner(expenseId, userId)
                .orElseThrow(() -> new ApiException(404, "Expense not found"));

        expenseRepository.delete(expense);
        userService.decrementExpenseCount(userId);
    }

    public ExpenseStatsResponse getExpenseStats(String userId, LocalDateTime startDate, LocalDateTime endDate) {
        Criteria criteria = Criteria.where("owner").is(userId);
        
        if (startDate != null && endDate != null) {
            criteria = criteria.and("expenseDate").gte(startDate).lte(endDate);
        } else if (startDate != null) {
            criteria = criteria.and("expenseDate").gte(startDate);
        } else if (endDate != null) {
            criteria = criteria.and("expenseDate").lte(endDate);
        }

        // Category stats aggregation
        Aggregation categoryAggregation = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group("category")
                        .sum("amount").as("totalAmount")
                        .count().as("count")
                        .avg("amount").as("avgAmount"),
                Aggregation.sort(Sort.Direction.DESC, "totalAmount")
        );

        AggregationResults<Map> categoryResults = mongoTemplate.aggregate(
                categoryAggregation, "expenses", Map.class);

        List<ExpenseStatsResponse.CategoryStats> categoryStats = categoryResults.getMappedResults()
                .stream()
                .map(map -> ExpenseStatsResponse.CategoryStats.builder()
                        ._id((String) map.get("_id"))
                        .totalAmount(((Number) map.get("totalAmount")).doubleValue())
                        .count(((Number) map.get("count")).longValue())
                        .avgAmount(((Number) map.get("avgAmount")).doubleValue())
                        .build())
                .collect(Collectors.toList());

        // Overall stats aggregation
        Aggregation overallAggregation = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group()
                        .count().as("totalExpenses")
                        .sum("amount").as("totalAmount")
                        .avg("amount").as("avgAmount")
                        .max("amount").as("maxAmount")
                        .min("amount").as("minAmount")
        );

        AggregationResults<Map> overallResults = mongoTemplate.aggregate(
                overallAggregation, "expenses", Map.class);

        ExpenseStatsResponse.OverallStats overallStats = ExpenseStatsResponse.OverallStats.builder().build();
        if (!overallResults.getMappedResults().isEmpty()) {
            Map result = overallResults.getMappedResults().get(0);
            overallStats = ExpenseStatsResponse.OverallStats.builder()
                    .totalExpenses(((Number) result.get("totalExpenses")).longValue())
                    .totalAmount(((Number) result.get("totalAmount")).doubleValue())
                    .avgAmount(((Number) result.get("avgAmount")).doubleValue())
                    .maxAmount(((Number) result.get("maxAmount")).doubleValue())
                    .minAmount(((Number) result.get("minAmount")).doubleValue())
                    .build();
        }

        return ExpenseStatsResponse.builder()
                .categoryStats(categoryStats)
                .overallStats(overallStats)
                .build();
    }

    public int importExpenses(String userId, ImportExpensesRequest request) {
        if (request.getExpenses() == null || request.getExpenses().isEmpty()) {
            throw new ApiException(400, "Expenses array is required");
        }

        List<Expense> expensesToSave = new ArrayList<>();

        for (ExpenseRequest expenseRequest : request.getExpenses()) {
            if (expenseRequest.getName() == null || expenseRequest.getAmount() == null ||
                expenseRequest.getCategory() == null || expenseRequest.getPaymentType() == null) {
                throw new ApiException(400, "Each expense must have name, amount, category, and payment type");
            }

            if (expenseRequest.getAmount() <= 0) {
                throw new ApiException(400, "Amount must be greater than 0");
            }

            Expense expense = Expense.builder()
                    .name(expenseRequest.getName().trim())
                    .amount(expenseRequest.getAmount())
                    .expenseDate(expenseRequest.getExpenseDate() != null ? expenseRequest.getExpenseDate() : LocalDateTime.now())
                    .category(expenseRequest.getCategory().trim())
                    .paymentType(expenseRequest.getPaymentType().trim())
                    .comment(expenseRequest.getComment() != null ? expenseRequest.getComment().trim() : "")
                    .owner(userId)
                    .build();

            expensesToSave.add(expense);
        }

        List<Expense> savedExpenses = expenseRepository.saveAll(expensesToSave);
        userService.incrementExpenseCount(userId, savedExpenses.size());

        return savedExpenses.size();
    }

    public List<ExpenseResponse> getDashboardExpenses(String userId, String timeFilter) {
        List<Expense> expenses;

        if (timeFilter == null || timeFilter.equals("all")) {
            expenses = expenseRepository.findByOwner(userId);
        } else {
            LocalDateTime filterDate;
            LocalDateTime now = LocalDateTime.now();

            switch (timeFilter) {
                case "week":
                    filterDate = now.minusDays(7);
                    break;
                case "month":
                    filterDate = now.minusDays(30);
                    break;
                case "year":
                    filterDate = now.minusDays(365);
                    break;
                default:
                    expenses = expenseRepository.findByOwner(userId);
                    return expenses.stream().map(this::mapToExpenseResponse).collect(Collectors.toList());
            }

            expenses = expenseRepository.findByOwnerAndExpenseDateAfter(userId, filterDate);
        }

        return expenses.stream()
                .map(this::mapToExpenseResponse)
                .collect(Collectors.toList());
    }

    private ExpenseResponse mapToExpenseResponse(Expense expense) {
        return ExpenseResponse.builder()
                ._id(expense.getId())
                .name(expense.getName())
                .amount(expense.getAmount())
                .expense_date(expense.getExpenseDate().format(DATE_FORMATTER))
                .expense_category(expense.getCategory())
                .payment(expense.getPaymentType())
                .comment(expense.getComment())
                .owner(expense.getOwner())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
