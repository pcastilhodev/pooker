package com.example.demo.Domain.Security.Auth;


import com.example.demo.Domain.Security.Config.JwtService;
import com.example.demo.Domain.Security.Dto.CreateUserDTO;
import com.example.demo.Domain.Security.Dto.ValidateRequestDTO;
import com.example.demo.Domain.Security.Dto.ValidateResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/v1/api")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService, JwtService jwtService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(authenticationService.authenticate(request));
    }

    @GetMapping("/debug/headers")
    public ResponseEntity<Map<String, String>> showHeaders(@RequestHeader Map<String, String> headers) {
        return ResponseEntity.ok(headers);
    }
}
