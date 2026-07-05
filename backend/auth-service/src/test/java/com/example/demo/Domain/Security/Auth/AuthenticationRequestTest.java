package com.example.demo.Domain.Security.Auth;

import com.example.demo.Domain.Security.Model.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthenticationRequestTest {

    @Test
    void construtor_preencheTodosOsCampos() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.USER, "senha123");

        assertEquals(1, request.getUserId());
        assertEquals(Role.USER, request.getRole());
        assertEquals("senha123", request.getPassword());
    }

    @Test
    void setters_atualizamOsCampos() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.USER, "senha123");

        request.setUserId(2);
        request.setRole(Role.ADMIN);
        request.setPassword("novaSenha");

        assertEquals(2, request.getUserId());
        assertEquals(Role.ADMIN, request.getRole());
        assertEquals("novaSenha", request.getPassword());
    }
}
