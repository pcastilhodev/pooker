package looker.apigateway.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Filter that decodes JWT tokens and propagates user identity headers downstream.
 */
@Component
public class JwtDecodeFilter implements WebFilter, Ordered {

  private static final Logger LOG = LoggerFactory.getLogger(JwtDecodeFilter.class);

  private static final String DEFAULT_USERS = "/user/api/v1/users";

  private static final List<String> openPaths = List.of(
      "/auth/v1/api/authenticate",
      "/user/api/v1/users/login",
      DEFAULT_USERS.concat("/"),
      DEFAULT_USERS,
      "/movie/v1/filmes"
  );

  @Value("${jwt.secret}")
  private String secretKey;

  /**
   * Returns the order of this filter.
   *
   * @return the filter order
   */
  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE;
  }

  /**
   * Filters incoming requests, validating JWT tokens for protected routes.
   *
   * @param exchange the current server exchange
   * @param chain the filter chain
   * @return a {@link Mono} representing the completion of the filtering
   */
  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    String path = exchange.getRequest().getPath().toString();
    LOG.debug("JwtDecodeFilter: Path recebido: {}", path);

    if (exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
      return chain.filter(exchange);
    }

    if (openPaths.stream().anyMatch(path::equals)
        || openPaths.stream().anyMatch(path::startsWith)) {
      LOG.debug("JwtDecodeFilter: Liberando rota pública: {}", path);
      return chain.filter(exchange);
    }

    String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      String token = authHeader.substring(7);
      try {
        Claims claims = Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody();
        LOG.debug("Authorization Header: {}", authHeader);
        LOG.debug("Claims extraídos: {}", claims);
        LOG.debug("JwtDecodeFilter: Rota protegida acessada: {}", path);
        LOG.debug("JwtDecodeFilter: Token extraído: {}", token);
        LOG.debug("JwtDecodeFilter: X-User-Id: {}", claims.getSubject());
        LOG.debug("JwtDecodeFilter: X-User-Role: {}",
            claims.get("role", String.class));
        ServerWebExchange mutatedExchange = exchange.mutate()
            .request(builder -> builder
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Role", claims.get("role", String.class))
            ).build();
        return chain.filter(mutatedExchange);
      } catch (Exception e) {
        LOG.warn("JwtDecodeFilter: Erro ao processar token: {}", e.getMessage());
        exchange.getResponse().setStatusCode(
            org.springframework.http.HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
      }
    }

    exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
    return exchange.getResponse().setComplete();
  }
}
