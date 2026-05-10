package com.example.demo.Domain.Security.Auth;


import com.example.demo.Domain.Security.Config.JwtService;
import com.example.demo.Domain.Security.Model.UserModel;
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
