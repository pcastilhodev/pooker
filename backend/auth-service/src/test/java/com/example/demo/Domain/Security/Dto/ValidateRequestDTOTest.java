package com.example.demo.Domain.Security.Dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ValidateRequestDTOTest {

    @Test
    void record_exponeOTokenPassadoNoConstrutor() {
        ValidateRequestDTO dto = new ValidateRequestDTO("meu.jwt.token");

        assertEquals("meu.jwt.token", dto.token());
    }
}
