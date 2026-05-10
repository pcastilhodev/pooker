package com.example.demo.Domain.Security.Auth;


import com.example.demo.Domain.Security.Model.Role;

public class AuthenticationRequest {
    private int userId;
    private String password;
    private Role role;

    public AuthenticationRequest(int userId, Role role, String password) {
        this.userId = userId;
        this.role  = role;
        this.password  = password;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }


    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
