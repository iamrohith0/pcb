package com.pcbxpress.erp.modules.auth.dto;

import java.time.ZonedDateTime;

public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private ZonedDateTime expiresAt;
    private AuthUserDto user;

    // Constructors
    public LoginResponse() {}

    public LoginResponse(String accessToken, String refreshToken, Long expiresIn, 
                        ZonedDateTime expiresAt, AuthUserDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.expiresAt = expiresAt;
        this.user = user;
    }

    // Getters and Setters
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public ZonedDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(ZonedDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public AuthUserDto getUser() {
        return user;
    }

    public void setUser(AuthUserDto user) {
        this.user = user;
    }
}