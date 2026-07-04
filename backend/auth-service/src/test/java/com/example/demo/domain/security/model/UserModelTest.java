package com.example.demo.domain.security.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class UserModelTest {

    @Test
    void construtorSimplificado_armazenaCamposCorretamente() {
        UserModel user = new UserModel("senha", 1, Role.ADMIN);
        assertEquals("senha", user.getPassword());
        assertEquals(1, user.getId());
        assertEquals(Role.ADMIN, user.getRole());
    }

    @Test
    void construtorCompleto_armazenaCamposCorretamente() {
        Instant nascimento = Instant.parse("1990-01-01T00:00:00Z");
        UserModel user = new UserModel(2, "Fulano", "12345678900", "senha123", "fulano@example.com", "999999999", nascimento);

        assertEquals(2, user.getId());
        assertEquals("fulano@example.com", user.getUsername());
        assertEquals("senha123", user.getPassword());
    }

    @Test
    void construtorVazio_naoLancaExcecao() {
        UserModel user = new UserModel();
        assertNotNull(user);
    }

    @Test
    void getAuthorities_retornaListaVazia() {
        UserModel user = new UserModel("senha", 1, Role.USER);
        assertTrue(user.getAuthorities().isEmpty());
    }

    @Test
    void setRole_atualizaValorCorretamente() {
        UserModel user = new UserModel("senha", 1, Role.USER);
        user.setRole(Role.ADMIN);
        assertEquals(Role.ADMIN, user.getRole());
    }

    @Test
    void isAccountNonExpired_retornaTrue() {
        UserModel user = new UserModel("senha", 1, Role.USER);
        assertTrue(user.isAccountNonExpired());
    }

    @Test
    void isAccountNonLocked_retornaTrue() {
        UserModel user = new UserModel("senha", 1, Role.USER);
        assertTrue(user.isAccountNonLocked());
    }

    @Test
    void isCredentialsNonExpired_retornaTrue() {
        UserModel user = new UserModel("senha", 1, Role.USER);
        assertTrue(user.isCredentialsNonExpired());
    }

    @Test
    void isEnabled_retornaTrue() {
        UserModel user = new UserModel("senha", 1, Role.USER);
        assertTrue(user.isEnabled());
    }
}
