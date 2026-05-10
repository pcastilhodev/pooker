package looker.apigateway.gateway;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class JwtDecodeFilterTest {

    private static final String SECRET = "0e1110b29e5cab1d172a006d08b8c7c1c4225c039e213dc14ce1cf1675d3e9f3";

    private JwtDecodeFilter filter;
    private WebFilterChain passThroughChain;

    @BeforeEach
    void setUp() {
        filter = new JwtDecodeFilter();
        passThroughChain = exchange -> Mono.empty();
    }

    private String criarToken(String subject, String role) {
        return Jwts.builder()
                .setSubject(subject)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }

    // ── rotas públicas ────────────────────────────────────────────────────────

    @Test
    void rotaPublica_authenticate_passaSemVerificarToken() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/auth/v1/api/authenticate").build());

        filter.filter(exchange, passThroughChain).block();

        assertNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void rotaPublica_login_passaSemVerificarToken() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/user/api/v1/users/login").build());

        filter.filter(exchange, passThroughChain).block();

        assertNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void rotaPublica_filmes_passaSemVerificarToken() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/movie/v1/filmes").build());

        filter.filter(exchange, passThroughChain).block();

        assertNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void rotaPublica_cadastroUsuario_passaSemVerificarToken() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/user/api/v1/users/").build());

        filter.filter(exchange, passThroughChain).block();

        assertNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void requisicaoOptions_semprePassaSemVerificar() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.options("/qualquer/rota").build());

        filter.filter(exchange, passThroughChain).block();

        assertNull(exchange.getResponse().getStatusCode());
    }

    // ── rota protegida sem token ──────────────────────────────────────────────

    @Test
    void rotaProtegida_semAuthHeader_retorna401() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/rota/protegida").build());

        filter.filter(exchange, passThroughChain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void rotaProtegida_tokenInvalido_retorna401() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/rota/protegida")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer token.invalido.aqui")
                        .build());

        filter.filter(exchange, passThroughChain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void rotaProtegida_tokenExpirado_retorna401() {
        String tokenExpirado = Jwts.builder()
                .setSubject("1")
                .claim("role", "USER")
                .setIssuedAt(new Date(System.currentTimeMillis() - 10_000))
                .setExpiration(new Date(System.currentTimeMillis() - 1_000))
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/rota/protegida")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenExpirado)
                        .build());

        filter.filter(exchange, passThroughChain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    // ── rota protegida com token válido ───────────────────────────────────────

    @Test
    void tokenValido_adicionaHeaderXUserId() {
        String token = criarToken("42", "ADMIN");
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/rota/protegida")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .build());

        AtomicReference<ServerWebExchange> capturedExchange = new AtomicReference<>();
        WebFilterChain capturingChain = ex -> {
            capturedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, capturingChain).block();

        assertNotNull(capturedExchange.get());
        assertEquals("42", capturedExchange.get().getRequest().getHeaders().getFirst("X-User-Id"));
    }

    @Test
    void tokenValido_adicionaHeaderXUserRole() {
        String token = criarToken("42", "ADMIN");
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/rota/protegida")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .build());

        AtomicReference<ServerWebExchange> capturedExchange = new AtomicReference<>();
        WebFilterChain capturingChain = ex -> {
            capturedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, capturingChain).block();

        assertEquals("ADMIN", capturedExchange.get().getRequest().getHeaders().getFirst("X-User-Role"));
    }

    @Test
    void tokenValido_naoRetorna401() {
        String token = criarToken("10", "USER");
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/rota/protegida")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .build());

        filter.filter(exchange, passThroughChain).block();

        assertNotEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    // ── comportamento do filtro ───────────────────────────────────────────────

    @Test
    void getOrder_retornaHighestPrecedence() {
        assertEquals(Ordered.HIGHEST_PRECEDENCE, filter.getOrder());
    }
}
