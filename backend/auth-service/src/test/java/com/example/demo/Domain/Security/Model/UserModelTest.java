package com.example.demo.Domain.Security.Model;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class UserModelTest {

    @Test
    void construtorCompleto_preencheOsCamposBasicos() {
        Instant nascimento = Instant.parse("1990-01-01T00:00:00Z");
        UserModel user = new UserModel(1, "Fulano", "12345678900", "senha123", "fulano@teste.com", "62999999999", nascimento);

        assertEquals(1, user.getId());
        assertEquals("fulano@teste.com", user.getUsername());
        assertEquals("senha123", user.getPassword());
    }

    @Test
    void construtorSimples_preencheSenhaIdERole() {
        UserModel user = new UserModel("senha", 2, Role.ADMIN);

        assertEquals("senha", user.getPassword());
        assertEquals(2, user.getId());
        assertEquals(Role.ADMIN, user.getRole());
    }

    @Test
    void setRole_atualizaARole() {
        UserModel user = new UserModel();
        user.setRole(Role.USER);

        assertEquals(Role.USER, user.getRole());
    }

    @Test
    void getAuthorities_retornaListaVazia() {
        UserModel user = new UserModel();

        assertTrue(user.getAuthorities().isEmpty());
    }

    @Test
    void flagsDeConta_seguemODefaultDoUserDetails() {
        UserModel user = new UserModel();

        assertTrue(user.isAccountNonExpired());
        assertTrue(user.isAccountNonLocked());
        assertTrue(user.isCredentialsNonExpired());
        assertTrue(user.isEnabled());
    }
}
