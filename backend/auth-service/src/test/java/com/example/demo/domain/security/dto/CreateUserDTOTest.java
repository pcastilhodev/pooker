package com.example.demo.domain.security.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CreateUserDTOTest {

    // ── acessores do record ────────────────────────────────────────────────────

    @Test
    void construtor_armazenaNomeCorretamente() {
        CreateUserDTO dto = new CreateUserDTO("Fulano", "senha123", "fulano@example.com");
        assertEquals("Fulano", dto.name());
    }

    @Test
    void construtor_armazenaSenhaCorretamente() {
        CreateUserDTO dto = new CreateUserDTO("Fulano", "senha123", "fulano@example.com");
        assertEquals("senha123", dto.password());
    }

    @Test
    void construtor_armazenaEmailCorretamente() {
        CreateUserDTO dto = new CreateUserDTO("Fulano", "senha123", "fulano@example.com");
        assertEquals("fulano@example.com", dto.email());
    }

    // ── equals / hashCode gerados pelo record ──────────────────────────────────

    @Test
    void equals_doisRecordsComMesmosValores_saoIguais() {
        CreateUserDTO dto1 = new CreateUserDTO("Fulano", "senha123", "fulano@example.com");
        CreateUserDTO dto2 = new CreateUserDTO("Fulano", "senha123", "fulano@example.com");
        assertEquals(dto1, dto2);
        assertEquals(dto1.hashCode(), dto2.hashCode());
    }

    @Test
    void equals_recordsComValoresDiferentes_naoSaoIguais() {
        CreateUserDTO dto1 = new CreateUserDTO("Fulano", "senha123", "fulano@example.com");
        CreateUserDTO dto2 = new CreateUserDTO("Ciclano", "outraSenha", "ciclano@example.com");
        assertNotEquals(dto1, dto2);
    }

    @Test
    void toString_contemNomeDoRecord() {
        CreateUserDTO dto = new CreateUserDTO("Fulano", "senha123", "fulano@example.com");
        assertTrue(dto.toString().contains("CreateUserDTO"));
    }

    // ── valores nulos são aceitos pelo record (validação ocorre via Bean Validation) ──

    @Test
    void construtor_aceitaSenhaNula() {
        CreateUserDTO dto = new CreateUserDTO("Fulano", null, "fulano@example.com");
        assertNull(dto.password());
    }
}
