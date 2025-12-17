package com.expensetracker.controller;

import com.expensetracker.dto.*;
import com.expensetracker.security.CurrentUser;
import com.expensetracker.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        
        AuthResponse authResponse = userService.register(request);
        addTokenCookies(response, authResponse.getAccessToken(), authResponse.getRefreshToken());
        
        return ResponseEntity.status(201)
                .body(ApiResponse.success(200, authResponse, "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody LoginRequest request,
            HttpServletResponse response) {
        
        AuthResponse authResponse = userService.login(request);
        addTokenCookies(response, authResponse.getAccessToken(), authResponse.getRefreshToken());
        
        return ResponseEntity.ok(ApiResponse.success(authResponse, "User logged in successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logout(
            @CurrentUser String userId,
            HttpServletResponse response) {
        
        userService.logout(userId);
        clearTokenCookies(response);
        
        return ResponseEntity.ok(ApiResponse.success(null, "User logged out"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @CookieValue(value = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletResponse response) {
        
        String refreshToken = cookieRefreshToken != null ? cookieRefreshToken : 
                             (request != null ? request.getRefreshToken() : null);
        
        AuthResponse authResponse = userService.refreshToken(refreshToken);
        addTokenCookies(response, authResponse.getAccessToken(), authResponse.getRefreshToken());
        
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Access token refreshed"));
    }

    @GetMapping("/current-user")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@CurrentUser String userId) {
        UserResponse user = userService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(user, "User fetched successfully"));
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<ApiResponse<Object>> deleteAccount(
            @CurrentUser String userId,
            HttpServletResponse response) {
        
        userService.deleteAccount(userId);
        clearTokenCookies(response);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Account deleted successfully"));
    }

    @GetMapping("/app-version")
    public ResponseEntity<ApiResponse<VersionResponse>> getAppVersion() {
        VersionResponse version = new VersionResponse("v1.1.0");
        return ResponseEntity.ok(ApiResponse.success(version, "App version fetched successfully"));
    }

    @PatchMapping("/update-categories")
    public ResponseEntity<ApiResponse<UserResponse>> updateCategories(
            @CurrentUser String userId,
            @RequestBody UpdateCategoriesRequest request) {
        
        UserResponse user = userService.updateCategories(userId, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Categories updated successfully"));
    }

    @PatchMapping("/update-profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @CurrentUser String userId,
            @RequestBody UpdateProfileRequest request) {
        
        UserResponse user = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Profile updated successfully"));
    }

    private void addTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        Cookie accessCookie = new Cookie("accessToken", accessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(86400); // 1 day
        
        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(604800); // 7 days
        
        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);
    }

    private void clearTokenCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("accessToken", null);
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        
        Cookie refreshCookie = new Cookie("refreshToken", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        
        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);
    }

    // Helper class for version response
    public record VersionResponse(String version) {}
    
    // Helper class for refresh token request
    public record RefreshTokenRequest(String refreshToken) {}
}
