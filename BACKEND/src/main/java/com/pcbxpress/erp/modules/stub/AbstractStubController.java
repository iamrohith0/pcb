package com.pcbxpress.erp.modules.stub;

import com.pcbxpress.erp.common.web.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

public abstract class AbstractStubController {

    @GetMapping("/**")
    public ResponseEntity<ApiResponse> handleGet(HttpServletRequest request) {
        return ok(request, "GET");
    }

    @PostMapping("/**")
    public ResponseEntity<ApiResponse> handlePost(HttpServletRequest request) {
        return accepted(request, "POST");
    }

    @PutMapping("/**")
    public ResponseEntity<ApiResponse> handlePut(HttpServletRequest request) {
        return accepted(request, "PUT");
    }

    @PatchMapping("/**")
    public ResponseEntity<ApiResponse> handlePatch(HttpServletRequest request) {
        return accepted(request, "PATCH");
    }

    @DeleteMapping("/**")
    public ResponseEntity<ApiResponse> handleDelete(HttpServletRequest request) {
        return accepted(request, "DELETE");
    }

    private ResponseEntity<ApiResponse> ok(HttpServletRequest request, String method) {
        String path = request.getRequestURI();
        String message = "Stub " + method + " endpoint. Implement business logic for " + path;
        return ResponseEntity.ok(ApiResponse.of(message, path));
    }

    private ResponseEntity<ApiResponse> accepted(HttpServletRequest request, String method) {
        String path = request.getRequestURI();
        String message = "Stub " + method + " endpoint. Payload accepted for " + path;
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.of(message, path));
    }
}
