package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {

    private String _id;
    private String name;
    private Double amount;
    private String expense_date;
    private String expense_category;
    private String payment;
    private String comment;
    private String owner;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
