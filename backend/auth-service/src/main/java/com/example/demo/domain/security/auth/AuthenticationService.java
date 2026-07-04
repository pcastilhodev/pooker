package com.example.demo.domain.security.auth;


import com.example.demo.domain.security.config.JwtService;
import com.example.demo.domain.security.model.UserModel;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.CrossOrigin;

@Service
@CrossOrigin(allowCredentials = "*", origins = "http://localhost:4200")
public class AuthenticationService {

    private final JwtService jwtService;

    public AuthenticationService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        UserModel user = new UserModel(request.getPassword(), request.getUserId(), request.getRole());
        return new AuthenticationResponse(jwtService.generateToken(user));
    }
}
