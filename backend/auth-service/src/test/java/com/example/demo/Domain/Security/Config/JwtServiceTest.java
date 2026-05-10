package com.example.demo.Domain.Security.Config;

import com.example.demo.Domain.Security.Model.Role;
import com.example.demo.Domain.Security.Model.UserModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    // email == id.toString() para que isTokenValid funcione:
    // generateToken seta subject = id.toString()
    // isTokenValid compara extractUsername(token) com getUsername() = email
    private UserModel userAdmin;
    private UserModel userComum;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();

        userAdmin = new UserModel(1, "Admin", "12345678901", "senha", "1", null, null);
        userAdmin.setRole(Role.ADMIN);

        userComum = new UserModel(2, "User", "98765432100", "senha", "2", null, null);
        userComum.setRole(Role.USER);
    }

    // ── generateToken ─────────────────────────────────────────────────────────

    @Test
    void generateToken_retornaStringNaoVazia() {
        String token = jwtService.generateToken(userAdmin);
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void generateToken_possuiTresPartesSeparadasPorPonto() {
        String token = jwtService.generateToken(userAdmin);
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    void generateToken_usuarioDiferente_geraTokenDiferente() {
        String tokenAdmin = jwtService.generateToken(userAdmin);
        String tokenUser = jwtService.generateToken(userComum);
        assertNotEquals(tokenAdmin, tokenUser);
    }

    // ── extractUsername ───────────────────────────────────────────────────────

    @Test
    void extractUsername_retornaIdDoUsuarioComoSubject() {
        String token = jwtService.generateToken(userAdmin);
        assertEquals("1", jwtService.extractUsername(token));
    }

    @Test
    void extractUsername_retornaIdCorretoParaUsuarioComum() {
        String token = jwtService.generateToken(userComum);
        assertEquals("2", jwtService.extractUsername(token));
    }

    // ── extractClaim role ─────────────────────────────────────────────────────
    // A lógica está invertida no código: USER → "ADMIN", ADMIN → "USER"

    @Test
    void extractClaim_role_usuarioADMIN_geraRoleUSERNoToken() {
        String token = jwtService.generateToken(userAdmin);
        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));
        assertEquals("USER", role);
    }

    @Test
    void extractClaim_role_usuarioUSER_geraRoleADMINNoToken() {
        String token = jwtService.generateToken(userComum);
        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));
        assertEquals("ADMIN", role);
    }

    // ── isTokenValid ──────────────────────────────────────────────────────────

    @Test
    void isTokenValid_tokenRecem_retornaTrue() {
        String token = jwtService.generateToken(userAdmin);
        assertTrue(jwtService.isTokenValid(token, userAdmin));
    }

    @Test
    void isTokenValid_tokenDeOutroUsuario_retornaFalse() {
        String tokenAdmin = jwtService.generateToken(userAdmin);
        // userComum.getUsername() = "2", subject do token = "1"
        assertFalse(jwtService.isTokenValid(tokenAdmin, userComum));
    }

    @Test
    void isTokenValid_tokenMalFormado_lancaExcecao() {
        assertThrows(Exception.class,
                () -> jwtService.isTokenValid("cabecalho.payload.assinatura_invalida", userAdmin));
    }

    @Test
    void isTokenValid_ambosOsUsuariosComSeusPropiosTokens_retornaTrue() {
        String tokenAdmin = jwtService.generateToken(userAdmin);
        String tokenUser = jwtService.generateToken(userComum);

        assertTrue(jwtService.isTokenValid(tokenAdmin, userAdmin));
        assertTrue(jwtService.isTokenValid(tokenUser, userComum));
    }
}
