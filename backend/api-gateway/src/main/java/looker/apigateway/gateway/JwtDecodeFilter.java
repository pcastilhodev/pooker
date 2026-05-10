package looker.apigateway.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;

import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtDecodeFilter implements WebFilter, Ordered {

    private static final String secretKey = "0e1110b29e5cab1d172a006d08b8c7c1c4225c039e213dc14ce1cf1675d3e9f3";
    private static final String defaultUsers = "/user/api/v1/users"; 

    private static final List<String> openPaths = List.of(
            "/auth/v1/api/authenticate",
            "/user/api/v1/users/login",
            defaultUsers.concat("/"),
            defaultUsers,
            "/movie/v1/filmes"
    );

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().toString();
        System.out.println("JwtDecodeFilter: Path recebido: " + path);

        if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        if (openPaths.stream().anyMatch(path::equals) || openPaths.stream().anyMatch(path::startsWith)) {
            System.out.println("JwtDecodeFilter: Liberando rota pública: " + path);
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody();
                ServerWebExchange mutatedExchange = exchange.mutate()
                        .request(builder -> builder
                                .header("X-User-Id", claims.getSubject())
                                .header("X-User-Role", claims.get("role", String.class))
                        ).build();
                
                System.out.println("Authorization Header: " + authHeader);
                System.out.println("Claims extraídos: " + claims);
                System.out.println("JwtDecodeFilter: Rota protegida acessada: " + path);
                System.out.println("JwtDecodeFilter: Token extraído: " + token);
                System.out.println("JwtDecodeFilter: X-User-Id: " + claims.getSubject());
                System.out.println("JwtDecodeFilter: X-User-Role: " + claims.get("role", String.class));


                return chain.filter(mutatedExchange);
            } catch (Exception e) {
                System.out.println("JwtDecodeFilter: Erro ao processar token: " + e.getMessage());
                exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        }

        exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }
}
