package com.pcbxpress.erp.modules.auth.jwt;

import com.pcbxpress.erp.modules.auth.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${security.jwt.secret}")
    private String secretKey;

    @Value("${security.jwt.access-token.expiration-minutes:120}")
    private long accessTokenExpirationMinutes;

    @Value("${security.jwt.refresh-token.expiration-days:7}")
    private long refreshTokenExpirationDays;

    public String generateAccessToken(User user) {
        return buildToken(user, accessTokenExpirationMinutes, ChronoUnit.MINUTES);
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, refreshTokenExpirationDays, ChronoUnit.DAYS);
    }

    public boolean isTokenValid(String token, User user) {
        String username = extractUsername(token);
        return username.equals(user.getUsername()) && !isTokenExpired(token);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (ExpiredJwtException | UnsupportedJwtException | MalformedJwtException | IllegalArgumentException e) {
            throw e;
        }
    }

    private String buildToken(User user, long amountToAdd, ChronoUnit unit) {
        Instant now = Instant.now();
        Instant expiration = now.plus(amountToAdd, unit);

        return Jwts
            .builder()
            .setSubject(user.getUsername())
            .claim("uid", user.getId().toString())
            .claim("role", user.getRole().name())
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(expiration))
            .signWith(getSignInKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

