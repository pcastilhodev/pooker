package com.example.demo.Domain.Security.Dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CreateUserDTOTest {

    @Test
    void record_exponeOsCamposPassadosNoConstrutor() {
        CreateUserDTO dto = new CreateUserDTO("Fulano", "senha123", "fulano@teste.com");

        assertEquals("Fulano", dto.name());
        assertEquals("senha123", dto.password());
        assertEquals("fulano@teste.com", dto.email());
    }
}
