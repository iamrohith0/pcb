package com.pcbxpress.erp.modules.procurement.suppliers.dto;

import java.time.OffsetDateTime;

public record SupplierDto(
    String id,
    String supplierCode,
    String name,
    String companyName,
    String email,
    String phone,
    String website,
    String gstin,
    String pan,
    String status,
    String contactPerson,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String pincode,
    String country,
    Integer leadTimeDays,
    String paymentTerms,
    String creditLimit,
    String currency,
    String preferredPaymentMethod,
    String bankName,
    String bankAccountNo,
    String bankIfsc,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}