package com.pcbxpress.erp.modules.sales.customer.dto;

public record CustomerContactPayload(
    String name,
    String email,
    String phone,
    String designation,
    String department,
    boolean isPrimary,
    boolean isBillingContact,
    boolean isShippingContact,
    boolean isTechnicalContact
) {
}