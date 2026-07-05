package com.example.demo.Domain.Security.Dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ValidateResponseDTOTest {

    @Test
    void construtor_preencheTodosOsCampos() {
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@teste.com", "claim-qualquer");

        assertEquals(200, dto.getStatus());
        assertEquals("usuario@teste.com", dto.getUsername());
        assertEquals("claim-qualquer", dto.getClaim());
    }

    @Test
    void setters_atualizamOsCampos() {
        ValidateResponseDTO dto = new ValidateResponseDTO(401, "x", null);

        dto.setStatus(200);
        dto.setUsername("outro@teste.com");
        dto.setClaim("nova-claim");

        assertEquals(200, dto.getStatus());
        assertEquals("outro@teste.com", dto.getUsername());
        assertEquals("nova-claim", dto.getClaim());
    }
}
