package com.example.demo.domain.security.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ValidateRequestDTOTest {

    @Test
    void construtor_armazenaTokenCorretamente() {
        ValidateRequestDTO dto = new ValidateRequestDTO("meu.token.jwt");
        assertEquals("meu.token.jwt", dto.token());
    }

    @Test
    void construtor_aceitaTokenNulo() {
        ValidateRequestDTO dto = new ValidateRequestDTO(null);
        assertNull(dto.token());
    }

    @Test
    void equals_doisRecordsComMesmoToken_saoIguais() {
        ValidateRequestDTO dto1 = new ValidateRequestDTO("abc.def.ghi");
        ValidateRequestDTO dto2 = new ValidateRequestDTO("abc.def.ghi");
        assertEquals(dto1, dto2);
        assertEquals(dto1.hashCode(), dto2.hashCode());
    }

    @Test
    void equals_recordsComTokensDiferentes_naoSaoIguais() {
        ValidateRequestDTO dto1 = new ValidateRequestDTO("token1");
        ValidateRequestDTO dto2 = new ValidateRequestDTO("token2");
        assertNotEquals(dto1, dto2);
    }

    @Test
    void toString_contemNomeDoRecord() {
        ValidateRequestDTO dto = new ValidateRequestDTO("abc.def.ghi");
        assertTrue(dto.toString().contains("ValidateRequestDTO"));
    }
}
