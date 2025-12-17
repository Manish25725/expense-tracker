package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String username;
    private String email;
    private String name;
    private LocalDateTime userFirstSignUp;
    private LocalDateTime lastLoginDate;
    private Integer expenseLogged;
    private List<String> categories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
