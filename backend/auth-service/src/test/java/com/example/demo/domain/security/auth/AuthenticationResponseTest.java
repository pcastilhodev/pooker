package com.example.demo.domain.security.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthenticationResponseTest {

    @Test
    void construtorComToken_armazenaTokenCorretamente() {
        AuthenticationResponse response = new AuthenticationResponse("meu.token.jwt");
        assertEquals("meu.token.jwt", response.getToken());
    }

    @Test
    void construtorVazio_tokenNulo() {
        AuthenticationResponse response = new AuthenticationResponse();
        assertNull(response.getToken());
    }

    @Test
    void setToken_atualizaValorCorretamente() {
        AuthenticationResponse response = new AuthenticationResponse();
        response.setToken("outro.token");
        assertEquals("outro.token", response.getToken());
    }

    @Test
    void builder_retornaNulo() {
        assertNull(AuthenticationResponse.builder());
    }
}
