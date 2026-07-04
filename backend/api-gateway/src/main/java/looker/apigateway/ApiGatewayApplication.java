package looker.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the API Gateway Spring Boot application.
 */
@SpringBootApplication
public class ApiGatewayApplication {

  /**
   * Starts the Spring Boot application.
   *
   * @param args command-line arguments
   */
  public static void main(String[] args) {
    SpringApplication.run(ApiGatewayApplication.class, args);
  }
}
