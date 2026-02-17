package com.pcbxpress.erp.common.web;

import com.pcbxpress.erp.modules.logistics.exception.DispatchException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.NoSuchElementException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RestExceptionHandler {

        @ExceptionHandler(DispatchException.ValidationException.class)
        public ResponseEntity<ApiResponse> handleValidationException(DispatchException.ValidationException ex,
                        HttpServletRequest request) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.of(ex.getMessage(), request.getRequestURI()));
        }

        @ExceptionHandler(DispatchException.class)
        public ResponseEntity<ApiResponse> handleDispatchException(DispatchException ex,
                        HttpServletRequest request) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.of(ex.getMessage(), request.getRequestURI()));
        }

        @ExceptionHandler(NoSuchElementException.class)
        public ResponseEntity<ApiResponse> handleNotFound(NoSuchElementException ex, HttpServletRequest request) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ApiResponse.of(ex.getMessage(), request.getRequestURI()));
        }

        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ApiResponse> handleResponseStatus(ResponseStatusException ex,
                        HttpServletRequest request) {
                HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
                String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
                return ResponseEntity.status(status)
                                .headers(HttpHeaders.readOnlyHttpHeaders(
                                                ex.getResponseHeaders() != null ? ex.getResponseHeaders()
                                                                : HttpHeaders.EMPTY))
                                .body(ApiResponse.of(message, request.getRequestURI()));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse> handleGeneric(Exception ex, HttpServletRequest request) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.of(ex.getMessage(), request.getRequestURI()));
        }
}
