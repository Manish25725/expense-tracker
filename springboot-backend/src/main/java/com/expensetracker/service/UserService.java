package com.expensetracker.service;

import com.expensetracker.dto.*;
import com.expensetracker.exception.ApiException;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        log.info("Registration request received for username: {}", request.getUsername());

        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getUsername() == null || request.getUsername().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new ApiException(400, "All fields are required");
        }

        // Check if user already exists
        if (userRepository.existsByUsernameOrEmail(
                request.getUsername().toLowerCase(), request.getEmail().toLowerCase())) {
            throw new ApiException(409, "User with email or username already exists");
        }

        // Create new user
        User user = User.builder()
                .name(request.getName())
                .username(request.getUsername().toLowerCase())
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .categories(request.getCategories() != null ? request.getCategories() : new ArrayList<>())
                .userFirstSignUp(LocalDateTime.now())
                .lastLoginDate(LocalDateTime.now())
                .expenseLogged(0)
                .build();

        User savedUser = userRepository.save(user);

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        // Save refresh token
        savedUser.setRefreshToken(refreshToken);
        userRepository.save(savedUser);

        return AuthResponse.builder()
                .user(mapToUserResponse(savedUser))
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login request received for: {}", request.getEmail() != null ? request.getEmail() : request.getUsername());

        if (request.getUsername() == null && request.getEmail() == null) {
            throw new ApiException(400, "Username or email is required");
        }

        // Find user
        User user = userRepository.findByUsernameOrEmail(
                request.getUsername() != null ? request.getUsername().toLowerCase() : "",
                request.getEmail() != null ? request.getEmail().toLowerCase() : ""
        ).orElseThrow(() -> new ApiException(404, "User does not exist"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(401, "Invalid user credentials");
        }

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Update user with refresh token and last login
        user.setRefreshToken(refreshToken);
        user.setLastLoginDate(LocalDateTime.now());
        userRepository.save(user);

        return AuthResponse.builder()
                .user(mapToUserResponse(user))
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public void logout(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        user.setRefreshToken(null);
        userRepository.save(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new ApiException(401, "Unauthorized request");
        }

        String userId = jwtService.extractUserId(refreshToken);
        if (userId == null) {
            throw new ApiException(401, "Invalid refresh token");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "Invalid refresh token"));

        if (!refreshToken.equals(user.getRefreshToken())) {
            throw new ApiException(401, "Refresh token is expired or used");
        }

        // Generate new tokens
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return AuthResponse.builder()
                .user(mapToUserResponse(user))
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    public UserResponse getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        return mapToUserResponse(user);
    }

    public void deleteAccount(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(404, "User not found");
        }
        userRepository.deleteById(userId);
    }

    public UserResponse updateCategories(String userId, UpdateCategoriesRequest request) {
        if (request.getCategories() == null) {
            throw new ApiException(400, "Categories must be an array");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));

        user.setCategories(request.getCategories());
        User savedUser = userRepository.save(user);

        return mapToUserResponse(savedUser);
    }

    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));

        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            // Check if username is taken by another user
            String newUsername = request.getUsername().toLowerCase();
            userRepository.findByUsername(newUsername).ifPresent(existingUser -> {
                if (!existingUser.getId().equals(userId)) {
                    throw new ApiException(409, "Username is already taken");
                }
            });
            user.setUsername(newUsername);
        }

        if (request.getName() != null && !request.getName().isEmpty()) {
            user.setName(request.getName());
        }

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    public void incrementExpenseCount(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        user.setExpenseLogged(user.getExpenseLogged() + 1);
        userRepository.save(user);
    }

    public void decrementExpenseCount(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        user.setExpenseLogged(Math.max(0, user.getExpenseLogged() - 1));
        userRepository.save(user);
    }

    public void incrementExpenseCount(String userId, int count) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "User not found"));
        user.setExpenseLogged(user.getExpenseLogged() + count);
        userRepository.save(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .userFirstSignUp(user.getUserFirstSignUp())
                .lastLoginDate(user.getLastLoginDate())
                .expenseLogged(user.getExpenseLogged())
                .categories(user.getCategories())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
