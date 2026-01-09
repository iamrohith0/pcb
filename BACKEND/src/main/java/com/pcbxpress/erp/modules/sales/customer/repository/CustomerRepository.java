package com.pcbxpress.erp.modules.sales.customer.repository;

import com.pcbxpress.erp.modules.sales.customer.model.Customer;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
    
    boolean existsByCompanyNameIgnoreCaseAndIdNot(String companyName, UUID id);
    
    boolean existsByCustomerCodeIgnoreCaseAndIdNot(String customerCode, UUID id);
    
    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);
    
    boolean existsByPhoneIgnoreCaseAndIdNot(String phone, UUID id);
}
