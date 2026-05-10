package com.example.demo.Domain.Security.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


    public record CreateUserDTO(@Size(min = 4) @NotNull String name, String password, @Email(message = "o email deve ser valido") String email) {
}
