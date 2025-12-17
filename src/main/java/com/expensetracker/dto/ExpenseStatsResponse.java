package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseStatsResponse {

    private List<CategoryStats> categoryStats;
    private OverallStats overallStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStats {
        private String _id;
        private Double totalAmount;
        private Long count;
        private Double avgAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallStats {
        private Long totalExpenses;
        private Double totalAmount;
        private Double avgAmount;
        private Double maxAmount;
        private Double minAmount;
    }
}
