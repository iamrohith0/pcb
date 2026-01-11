package com.pcbxpress.erp.modules.procurement.suppliers.dto;

import java.math.BigDecimal;

public record SupplierPayload(
    String name,
    String companyName,
    String supplierCode,
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
    BigDecimal creditLimit,
    String currency,
    String preferredPaymentMethod,
    String bankName,
    String bankAccountNo,
    String bankIfsc,
    String notes
) {
}