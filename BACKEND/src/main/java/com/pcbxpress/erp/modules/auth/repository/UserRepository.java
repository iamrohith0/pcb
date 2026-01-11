package com.pcbxpress.erp.modules.auth.repository;

import com.pcbxpress.erp.modules.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM AuthUser u WHERE u.username = :identifier OR u.email = :identifier")
    Optional<User> findByUsernameOrEmail(@Param("identifier") String identifier);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM AuthUser u WHERE u.username = :username AND u.id != :userId")
    boolean existsByUsernameExceptId(@Param("username") String username, @Param("userId") Long userId);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM AuthUser u WHERE u.email = :email AND u.id != :userId")
    boolean existsByEmailExceptId(@Param("email") String email, @Param("userId") Long userId);

    @Query("SELECT u FROM AuthUser u WHERE u.passwordResetToken = :token AND u.passwordResetExpires > CURRENT_TIMESTAMP")
    Optional<User> findByPasswordResetToken(@Param("token") String token);

    @Query("SELECT u FROM AuthUser u WHERE u.emailVerificationToken = :token")
    Optional<User> findByEmailVerificationToken(@Param("token") String token);
}