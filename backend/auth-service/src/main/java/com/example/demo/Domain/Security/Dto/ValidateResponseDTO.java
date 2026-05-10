package com.example.demo.Domain.Security.Dto;

public class ValidateResponseDTO {
    private int status;
    private String username;
    private Object claim;

    public ValidateResponseDTO(int status, String username, Object claim) {
        this.status = status;
        this.username = username;
        this.claim = claim;
    }

    // Getters e setters
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Object getClaim() { return claim; }
    public void setClaim(Object claim) { this.claim = claim; }
}