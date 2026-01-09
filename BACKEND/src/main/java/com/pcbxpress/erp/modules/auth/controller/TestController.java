package com.pcbxpress.erp.modules.auth.controller;

import com.pcbxpress.erp.modules.auth.model.User;
import com.pcbxpress.erp.modules.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/user/{username}")
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }
}