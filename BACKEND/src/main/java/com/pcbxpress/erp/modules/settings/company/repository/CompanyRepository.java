package com.pcbxpress.erp.modules.settings.company.repository;

import com.pcbxpress.erp.modules.settings.company.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {
    
    /**
     * Find active company settings
     * @return Optional of active company
     */
    @Query("SELECT c FROM Company c WHERE c.isActive = true")
    Optional<Company> findActiveCompany();
    
    /**
     * Find company by registration number
     * @param registrationNumber the registration number to search for
     * @return Optional of company
     */
    Optional<Company> findByRegistrationNumber(String registrationNumber);
    
    /**
     * Find company by tax ID
     * @param taxId the tax ID to search for
     * @return Optional of company
     */
    Optional<Company> findByTaxId(String taxId);
    
    /**
     * Find company by email
     * @param email the email to search for
     * @return Optional of company
     */
    Optional<Company> findByEmail(String email);
    
    /**
     * Check if company name already exists (excluding current company)
     * @param companyName the company name to check
     * @param excludeId the company ID to exclude from check
     * @return true if company name exists
     */
    @Query("SELECT COUNT(c) > 0 FROM Company c WHERE c.companyName = :companyName AND c.id != :excludeId")
    boolean existsByCompanyNameAndIdNot(@Param("companyName") String companyName, @Param("excludeId") UUID excludeId);
    
    /**
     * Check if registration number already exists (excluding current company)
     * @param registrationNumber the registration number to check
     * @param excludeId the company ID to exclude from check
     * @return true if registration number exists
     */
    @Query("SELECT COUNT(c) > 0 FROM Company c WHERE c.registrationNumber = :registrationNumber AND c.id != :excludeId")
    boolean existsByRegistrationNumberAndIdNot(@Param("registrationNumber") String registrationNumber, @Param("excludeId") UUID excludeId);
    
    /**
     * Check if tax ID already exists (excluding current company)
     * @param taxId the tax ID to check
     * @param excludeId the company ID to exclude from check
     * @return true if tax ID exists
     */
    @Query("SELECT COUNT(c) > 0 FROM Company c WHERE c.taxId = :taxId AND c.id != :excludeId")
    boolean existsByTaxIdAndIdNot(@Param("taxId") String taxId, @Param("excludeId") UUID excludeId);
    
    /**
     * Check if email already exists (excluding current company)
     * @param email the email to check
     * @param excludeId the company ID to exclude from check
     * @return true if email exists
     */
    @Query("SELECT COUNT(c) > 0 FROM Company c WHERE c.email = :email AND c.id != :excludeId")
    boolean existsByEmailAndIdNot(@Param("email") String email, @Param("excludeId") UUID excludeId);
}