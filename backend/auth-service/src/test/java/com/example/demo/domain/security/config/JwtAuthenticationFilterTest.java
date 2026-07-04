package com.example.demo.domain.security.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private JwtAuthenticationFilter filter;

    @Mock
    private JwtService jwtService;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter();
        ReflectionTestUtils.setField(filter, "jwtService", jwtService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── rotas públicas — filtro passa sem tocar no JWT ─────────────────────────

    @Test
    void rotaAuthenticate_passaSemChamarJwtService() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/v1/api/authenticate");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService);
    }

    @Test
    void rotaRegister_passaSemChamarJwtService() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/v1/api/register");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService);
    }

    // ── sem Authorization header ───────────────────────────────────────────────

    @Test
    void semAuthHeader_passaFiltroSemChamarJwtService() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/alguma/rota");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService);
    }

    @Test
    void semAuthHeader_securityContextPermaneceVazio() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/alguma/rota");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void authHeaderSemPrefixoBearer_passaFiltroSemValidar() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/alguma/rota");
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService);
    }

    // ── com Authorization Bearer — extração do username ────────────────────────

    @Test
    void authHeaderBearer_chamaExtractUsernameNoJwtService() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/alguma/rota");
        request.addHeader("Authorization", "Bearer meu.token.aqui");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername("meu.token.aqui")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(jwtService).extractUsername("meu.token.aqui");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void extractUsernameRetornaNull_naoSetaSecurityContext() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/alguma/rota");
        request.addHeader("Authorization", "Bearer token.sem.usuario");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUsername("token.sem.usuario")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    // ── token valido — autentica e popula o SecurityContext ────────────────────

    @Test
    void tokenValido_autenticaEPopulaSecurityContext() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/alguma/rota");
        request.addHeader("Authorization", "Bearer token.valido");
        MockHttpServletResponse response = new MockHttpServletResponse();

        UserDetailsService userDetailsService = mock(UserDetailsService.class);
        UserDetails userDetails = User.withUsername("usuario@example.com")
                .password("senha")
                .authorities(Collections.emptyList())
                .build();

        ReflectionTestUtils.setField(filter, "userDetailsService", userDetailsService);

        when(jwtService.extractUsername("token.valido")).thenReturn("usuario@example.com");
        when(userDetailsService.loadUserByUsername("usuario@example.com")).thenReturn(userDetails);
        when(jwtService.isTokenValid("token.valido", userDetails)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("usuario@example.com", SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        verify(filterChain).doFilter(request, response);
    }
}
