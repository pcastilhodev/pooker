package com.example.demo.Domain.Security.Auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthenticationResponseTest {

    @Test
    void construtorComToken_preencheOToken() {
        AuthenticationResponse response = new AuthenticationResponse("meu.jwt.token");

        assertEquals("meu.jwt.token", response.getToken());
    }

    @Test
    void construtorVazio_permiteSetToken() {
        AuthenticationResponse response = new AuthenticationResponse();
        response.setToken("outro.token");

        assertEquals("outro.token", response.getToken());
    }
}
