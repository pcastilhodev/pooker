package com.example.demo.Domain.Security.Auth;

import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;

public class AuthenticationResponse {
    private String token;

    public AuthenticationResponse(String token) {
        this.token = token;
    }
    public AuthenticationResponse() {}

    public static OAuth2Authorization.Builder builder() {
        return null;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
