package com.example.demo.domain.security.auth;

import com.example.demo.domain.security.model.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthenticationRequestTest {

    @Test
    void construtor_armazenaUserIdCorretamente() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.USER, "senha");
        assertEquals(1, request.getUserId());
    }

    @Test
    void construtor_armazenaRoleCorretamente() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.ADMIN, "senha");
        assertEquals(Role.ADMIN, request.getRole());
    }

    @Test
    void construtor_armazenaPasswordCorretamente() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.USER, "senha123");
        assertEquals("senha123", request.getPassword());
    }

    @Test
    void setUserId_atualizaValorCorretamente() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.USER, "senha");
        request.setUserId(42);
        assertEquals(42, request.getUserId());
    }

    @Test
    void setRole_atualizaValorCorretamente() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.USER, "senha");
        request.setRole(Role.ADMIN);
        assertEquals(Role.ADMIN, request.getRole());
    }

    @Test
    void setPassword_atualizaValorCorretamente() {
        AuthenticationRequest request = new AuthenticationRequest(1, Role.USER, "senha");
        request.setPassword("novaSenha");
        assertEquals("novaSenha", request.getPassword());
    }
}
