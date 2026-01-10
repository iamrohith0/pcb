package com.pcbxpress.erp.modules.settings.company.service;

import com.pcbxpress.erp.modules.settings.company.dto.CompanyDto;
import com.pcbxpress.erp.modules.settings.company.dto.CompanyPayload;
import com.pcbxpress.erp.modules.settings.company.model.Company;
import com.pcbxpress.erp.modules.settings.company.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CompanyService {
    
    private final CompanyRepository companyRepository;
    
    @Autowired
    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }
    
    /**
     * Get all companies
     * @return List of all company DTOs
     */
    @Transactional(readOnly = true)
    public List<CompanyDto> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get active company
     * @return Optional of active company DTO
     */
    @Transactional(readOnly = true)
    public Optional<CompanyDto> getActiveCompany() {
        return companyRepository.findActiveCompany()
                .map(this::convertToDto);
    }
    
    /**
     * Get company by ID
     * @param id the company ID
     * @return Optional of company DTO
     */
    @Transactional(readOnly = true)
    public Optional<CompanyDto> getCompanyById(UUID id) {
        return companyRepository.findById(id)
                .map(this::convertToDto);
    }
    
    /**
     * Create new company
     * @param payload the company payload
     * @return Created company DTO
     */
    @Transactional
    public CompanyDto createCompany(CompanyPayload payload) {
        validateCompanyPayload(payload, null);
        
        Company company = new Company(payload.getCompanyName(), payload.getLegalName());
        updateCompanyFromPayload(company, payload);
        
        Company savedCompany = companyRepository.save(company);
        return convertToDto(savedCompany);
    }
    
    /**
     * Update company
     * @param id the company ID
     * @param payload the company payload
     * @return Updated company DTO
     */
    @Transactional
    public CompanyDto updateCompany(UUID id, CompanyPayload payload) {
        Company existingCompany = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        
        validateCompanyPayload(payload, id);
        updateCompanyFromPayload(existingCompany, payload);
        
        Company updatedCompany = companyRepository.save(existingCompany);
        return convertToDto(updatedCompany);
    }
    
    /**
     * Delete company
     * @param id the company ID
     */
    @Transactional
    public void deleteCompany(UUID id) {
        if (!companyRepository.existsById(id)) {
            throw new RuntimeException("Company not found with id: " + id);
        }
        companyRepository.deleteById(id);
    }
    
    /**
     * Set company as active
     * @param id the company ID
     */
    @Transactional
    public void setActiveCompany(UUID id) {
        // Deactivate all companies first
        companyRepository.findAll().forEach(company -> {
            company.setIsActive(false);
            companyRepository.save(company);
        });
        
        // Activate the specified company
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        company.setIsActive(true);
        companyRepository.save(company);
    }
    
    /**
     * Validate company payload
     * @param payload the company payload
     * @param excludeId the company ID to exclude from validation
     */
    private void validateCompanyPayload(CompanyPayload payload, UUID excludeId) {
        if (payload.getCompanyName() != null && 
            companyRepository.existsByCompanyNameAndIdNot(payload.getCompanyName(), excludeId)) {
            throw new RuntimeException("Company name already exists");
        }
        
        if (payload.getRegistrationNumber() != null && 
            companyRepository.existsByRegistrationNumberAndIdNot(payload.getRegistrationNumber(), excludeId)) {
            throw new RuntimeException("Registration number already exists");
        }
        
        if (payload.getTaxId() != null && 
            companyRepository.existsByTaxIdAndIdNot(payload.getTaxId(), excludeId)) {
            throw new RuntimeException("Tax ID already exists");
        }
        
        if (payload.getEmail() != null && 
            companyRepository.existsByEmailAndIdNot(payload.getEmail(), excludeId)) {
            throw new RuntimeException("Email already exists");
        }
    }
    
    /**
     * Update company entity from payload
     * @param company the company entity
     * @param payload the company payload
     */
    private void updateCompanyFromPayload(Company company, CompanyPayload payload) {
        if (payload.getCompanyName() != null) {
            company.setCompanyName(payload.getCompanyName());
        }
        if (payload.getLegalName() != null) {
            company.setLegalName(payload.getLegalName());
        }
        if (payload.getRegistrationNumber() != null) {
            company.setRegistrationNumber(payload.getRegistrationNumber());
        }
        if (payload.getTaxId() != null) {
            company.setTaxId(payload.getTaxId());
        }
        if (payload.getAddressLine1() != null) {
            company.setAddressLine1(payload.getAddressLine1());
        }
        if (payload.getAddressLine2() != null) {
            company.setAddressLine2(payload.getAddressLine2());
        }
        if (payload.getCity() != null) {
            company.setCity(payload.getCity());
        }
        if (payload.getState() != null) {
            company.setState(payload.getState());
        }
        if (payload.getCountry() != null) {
            company.setCountry(payload.getCountry());
        }
        if (payload.getPostalCode() != null) {
            company.setPostalCode(payload.getPostalCode());
        }
        if (payload.getPhone() != null) {
            company.setPhone(payload.getPhone());
        }
        if (payload.getEmail() != null) {
            company.setEmail(payload.getEmail());
        }
        if (payload.getWebsite() != null) {
            company.setWebsite(payload.getWebsite());
        }
        if (payload.getCurrency() != null) {
            company.setCurrency(payload.getCurrency());
        }
        if (payload.getTimezone() != null) {
            company.setTimezone(payload.getTimezone());
        }
        if (payload.getFiscalYearStart() != null) {
            company.setFiscalYearStart(payload.getFiscalYearStart());
        }
        if (payload.getFiscalYearEnd() != null) {
            company.setFiscalYearEnd(payload.getFiscalYearEnd());
        }
        if (payload.getIsActive() != null) {
            company.setIsActive(payload.getIsActive());
        }
    }
    
    /**
     * Convert company entity to DTO
     * @param company the company entity
     * @return Company DTO
     */
    private CompanyDto convertToDto(Company company) {
        return new CompanyDto(
            company.getId(),
            company.getCompanyName(),
            company.getLegalName(),
            company.getRegistrationNumber(),
            company.getTaxId(),
            company.getAddressLine1(),
            company.getAddressLine2(),
            company.getCity(),
            company.getState(),
            company.getCountry(),
            company.getPostalCode(),
            company.getPhone(),
            company.getEmail(),
            company.getWebsite(),
            company.getCurrency(),
            company.getTimezone(),
            company.getFiscalYearStart(),
            company.getFiscalYearEnd(),
            company.getCreatedAt(),
            company.getUpdatedAt(),
            company.getIsActive()
        );
    }
}