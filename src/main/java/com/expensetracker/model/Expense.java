package com.expensetracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "expenses")
@CompoundIndexes({
    @CompoundIndex(name = "owner_date_idx", def = "{'owner': 1, 'expenseDate': -1}"),
    @CompoundIndex(name = "owner_category_idx", def = "{'owner': 1, 'category': 1}")
})
public class Expense {

    @Id
    private String id;

    private String name;

    private Double amount;

    @Builder.Default
    private LocalDateTime expenseDate = LocalDateTime.now();

    private String category;

    private String paymentType;

    private String comment;

    private String owner;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
