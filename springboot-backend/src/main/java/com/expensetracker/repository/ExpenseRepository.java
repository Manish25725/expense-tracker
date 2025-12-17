package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends MongoRepository<Expense, String> {

    Page<Expense> findByOwner(String owner, Pageable pageable);

    List<Expense> findByOwner(String owner);

    Optional<Expense> findByIdAndOwner(String id, String owner);

    Page<Expense> findByOwnerAndCategory(String owner, String category, Pageable pageable);

    Page<Expense> findByOwnerAndExpenseDateBetween(String owner, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<Expense> findByOwnerAndCategoryAndExpenseDateBetween(String owner, String category, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    List<Expense> findByOwnerAndExpenseDateAfter(String owner, LocalDateTime date);

    long countByOwner(String owner);

    void deleteByIdAndOwner(String id, String owner);

    @Query("{ 'owner': ?0, 'expenseDate': { $gte: ?1, $lte: ?2 } }")
    List<Expense> findByOwnerAndDateRange(String owner, LocalDateTime startDate, LocalDateTime endDate);
}
