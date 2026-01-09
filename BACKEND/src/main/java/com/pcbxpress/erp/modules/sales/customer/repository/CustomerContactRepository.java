package com.pcbxpress.erp.modules.sales.customer.repository;

import com.pcbxpress.erp.modules.sales.customer.model.CustomerContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerContactRepository extends JpaRepository<CustomerContact, Long> {

    List<CustomerContact> findByCustomerId(UUID customerId);

    List<CustomerContact> findByCustomerIdAndIsPrimaryTrue(UUID customerId);

    List<CustomerContact> findByCustomerIdAndIsBillingContactTrue(UUID customerId);

    List<CustomerContact> findByCustomerIdAndIsShippingContactTrue(UUID customerId);

    List<CustomerContact> findByCustomerIdAndIsTechnicalContactTrue(UUID customerId);

    @Query("SELECT cc FROM CustomerContact cc WHERE cc.customerId = :customerId AND cc.email = :email")
    List<CustomerContact> findByCustomerIdAndEmail(@Param("customerId") UUID customerId, @Param("email") String email);

    @Query("SELECT cc FROM CustomerContact cc WHERE cc.customerId = :customerId AND cc.phone = :phone")
    List<CustomerContact> findByCustomerIdAndPhone(@Param("customerId") UUID customerId, @Param("phone") String phone);

    long countByCustomerId(UUID customerId);

    boolean existsByCustomerIdAndIsPrimaryTrue(UUID customerId);
}