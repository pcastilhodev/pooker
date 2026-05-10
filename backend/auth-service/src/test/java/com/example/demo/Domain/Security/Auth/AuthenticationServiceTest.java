package com.example.demo.Domain.Security.Auth;

import com.example.demo.Domain.Security.Config.JwtService;
import com.example.demo.Domain.Security.Model.Role;
import com.example.demo.Domain.Security.Model.UserModel;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthenticationService authenticationService;

    // ── authenticate ──────────────────────────────────────────────────────────

    @Test
    void authenticate_retornaResponseNaoNula() {
        when(jwtService.generateToken(any(UserModel.class))).thenReturn("mock.jwt.token");

        AuthenticationResponse response = authenticationService.authenticate(
                new AuthenticationRequest(1, Role.USER, "senha123"));

        assertNotNull(response);
    }

    @Test
    void authenticate_retornaTokenGeradoPeloJwtService() {
        when(jwtService.generateToken(any(UserModel.class))).thenReturn("mock.jwt.token");

        AuthenticationResponse response = authenticationService.authenticate(
                new AuthenticationRequest(1, Role.USER, "senha123"));

        assertEquals("mock.jwt.token", response.getToken());
    }

    @Test
    void authenticate_chamaJwtServiceExatamenteUmaVez() {
        when(jwtService.generateToken(any(UserModel.class))).thenReturn("qualquer.token");

        authenticationService.authenticate(new AuthenticationRequest(2, Role.ADMIN, "outraSenha"));

        verify(jwtService, times(1)).generateToken(any(UserModel.class));
    }

    @Test
    void authenticate_tokenRetornadoEhExatamenteODoService() {
        String tokenEsperado = "header.payload.signature";
        when(jwtService.generateToken(any(UserModel.class))).thenReturn(tokenEsperado);

        AuthenticationResponse response = authenticationService.authenticate(
                new AuthenticationRequest(5, Role.USER, "minhasenha"));

        assertEquals(tokenEsperado, response.getToken());
    }

    @Test
    void authenticate_comDiferentesUsuarios_repassaTokenCorreto() {
        when(jwtService.generateToken(any(UserModel.class)))
                .thenReturn("token-usuario-1")
                .thenReturn("token-usuario-2");

        AuthenticationResponse resp1 = authenticationService.authenticate(
                new AuthenticationRequest(1, Role.USER, "senha1"));
        AuthenticationResponse resp2 = authenticationService.authenticate(
                new AuthenticationRequest(2, Role.ADMIN, "senha2"));

        assertEquals("token-usuario-1", resp1.getToken());
        assertEquals("token-usuario-2", resp2.getToken());
    }
}
