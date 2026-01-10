package com.pcbxpress.erp.modules.settings.company.controller;

import com.pcbxpress.erp.modules.settings.company.dto.CompanyDto;
import com.pcbxpress.erp.modules.settings.company.dto.CompanyPayload;
import com.pcbxpress.erp.modules.settings.company.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings/company")
public class CompanyController {
    
    private final CompanyService companyService;
    
    @Autowired
    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }
    
    /**
     * Get all companies
     * @return List of all company DTOs
     */
    @GetMapping
    public ResponseEntity<List<CompanyDto>> getAllCompanies() {
        List<CompanyDto> companies = companyService.getAllCompanies();
        return ResponseEntity.ok(companies);
    }
    
    /**
     * Get active company
     * @return Active company DTO
     */
    @GetMapping("/active")
    public ResponseEntity<CompanyDto> getActiveCompany() {
        return companyService.getActiveCompany()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get company by ID
     * @param id the company ID
     * @return Company DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<CompanyDto> getCompanyById(@PathVariable UUID id) {
        return companyService.getCompanyById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new company
     * @param payload the company payload
     * @return Created company DTO
     */
    @PostMapping
    public ResponseEntity<CompanyDto> createCompany(@RequestBody CompanyPayload payload) {
        CompanyDto createdCompany = companyService.createCompany(payload);
        return ResponseEntity.ok(createdCompany);
    }
    
    /**
     * Update company
     * @param id the company ID
     * @param payload the company payload
     * @return Updated company DTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<CompanyDto> updateCompany(@PathVariable UUID id, @RequestBody CompanyPayload payload) {
        CompanyDto updatedCompany = companyService.updateCompany(id, payload);
        return ResponseEntity.ok(updatedCompany);
    }
    
    /**
     * Delete company
     * @param id the company ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable UUID id) {
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Set company as active
     * @param id the company ID
     * @return No content response
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> setActiveCompany(@PathVariable UUID id) {
        companyService.setActiveCompany(id);
        return ResponseEntity.noContent().build();
    }
}