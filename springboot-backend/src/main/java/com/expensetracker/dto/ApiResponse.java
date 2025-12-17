package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private int statusCode;
    private T data;
    private String message;
    private boolean success;

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .statusCode(200)
                .data(data)
                .message(message)
                .success(true)
                .build();
    }

    public static <T> ApiResponse<T> success(int statusCode, T data, String message) {
        return ApiResponse.<T>builder()
                .statusCode(statusCode)
                .data(data)
                .message(message)
                .success(true)
                .build();
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return ApiResponse.<T>builder()
                .statusCode(statusCode)
                .data(null)
                .message(message)
                .success(false)
                .build();
    }
}
