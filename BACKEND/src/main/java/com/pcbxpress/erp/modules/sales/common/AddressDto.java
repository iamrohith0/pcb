package com.pcbxpress.erp.modules.sales.common;

public record AddressDto(
    String name,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String pincode,
    String country,
    String gstin
) {
    public AddressDto {
        // Normalize empty strings to null for optional fields
        if (country == null || country.isBlank()) {
            country = "India";
        }
    }
}
