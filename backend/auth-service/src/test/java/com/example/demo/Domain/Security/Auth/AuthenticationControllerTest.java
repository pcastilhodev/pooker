package com.example.demo.Domain.Security.Auth;

import com.example.demo.Domain.Security.Config.JwtService;
import com.example.demo.Domain.Security.Model.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationControllerTest {

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthenticationController authenticationController;

    // ── POST /v1/api/authenticate ─────────────────────────────────────────────

    @Test
    void authenticate_retornaStatus200() {
        when(authenticationService.authenticate(any())).thenReturn(new AuthenticationResponse("token.jwt"));

        ResponseEntity<AuthenticationResponse> result = authenticationController.register(
                new AuthenticationRequest(1, Role.USER, "senha"));

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void authenticate_retornaTokenNoBody() {
        when(authenticationService.authenticate(any())).thenReturn(new AuthenticationResponse("meu.token.jwt"));

        ResponseEntity<AuthenticationResponse> result = authenticationController.register(
                new AuthenticationRequest(1, Role.USER, "senha"));

        assertNotNull(result.getBody());
        assertEquals("meu.token.jwt", result.getBody().getToken());
    }

    @Test
    void authenticate_repassaRequestParaService() {
        AuthenticationRequest request = new AuthenticationRequest(42, Role.ADMIN, "adminpass");
        when(authenticationService.authenticate(request)).thenReturn(new AuthenticationResponse("token"));

        authenticationController.register(request);

        verify(authenticationService, times(1)).authenticate(request);
    }

    @Test
    void authenticate_tokenDoServiceEhRetornadoSemAlteracao() {
        String tokenOriginal = "cabecalho.payload.assinatura";
        when(authenticationService.authenticate(any())).thenReturn(new AuthenticationResponse(tokenOriginal));

        ResponseEntity<AuthenticationResponse> result = authenticationController.register(
                new AuthenticationRequest(3, Role.USER, "qualquerSenha"));

        assertEquals(tokenOriginal, result.getBody().getToken());
    }

    // ── GET /v1/api/debug/headers ─────────────────────────────────────────────

    @Test
    void showHeaders_retornaStatus200() {
        Map<String, String> headers = Map.of("X-User-Id", "1", "X-User-Role", "ADMIN");

        ResponseEntity<Map<String, String>> result = authenticationController.showHeaders(headers);

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void showHeaders_retornaOsMesmosHeadersRecebidos() {
        Map<String, String> headers = Map.of("X-User-Id", "99", "X-User-Role", "USER");

        ResponseEntity<Map<String, String>> result = authenticationController.showHeaders(headers);

        assertEquals(headers, result.getBody());
    }
}
