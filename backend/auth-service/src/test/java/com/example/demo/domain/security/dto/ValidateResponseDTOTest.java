package com.example.demo.domain.security.dto;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ValidateResponseDTOTest {

    @Test
    void construtor_armazenaStatusCorretamente() {
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@example.com", "algumClaim");
        assertEquals(200, dto.getStatus());
    }

    @Test
    void construtor_armazenaUsernameCorretamente() {
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@example.com", "algumClaim");
        assertEquals("usuario@example.com", dto.getUsername());
    }

    @Test
    void construtor_armazenaClaimCorretamente() {
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@example.com", "algumClaim");
        assertEquals("algumClaim", dto.getClaim());
    }

    @Test
    void setStatus_atualizaValorCorretamente() {
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@example.com", "algumClaim");
        dto.setStatus(401);
        assertEquals(401, dto.getStatus());
    }

    @Test
    void setUsername_atualizaValorCorretamente() {
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@example.com", "algumClaim");
        dto.setUsername("outro@example.com");
        assertEquals("outro@example.com", dto.getUsername());
    }

    @Test
    void setClaim_atualizaValorCorretamente() {
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@example.com", "algumClaim");
        dto.setClaim("novoClaim");
        assertEquals("novoClaim", dto.getClaim());
    }

    @Test
    void construtor_aceitaClaimNulo() {
        ValidateResponseDTO dto = new ValidateResponseDTO(404, "usuario@example.com", null);
        assertNull(dto.getClaim());
    }

    @Test
    void construtor_aceitaClaimDeQualquerTipoObjeto() {
        Map<String, String> claim = Map.of("role", "ADMIN");
        ValidateResponseDTO dto = new ValidateResponseDTO(200, "usuario@example.com", claim);
        assertEquals(claim, dto.getClaim());
    }
}
