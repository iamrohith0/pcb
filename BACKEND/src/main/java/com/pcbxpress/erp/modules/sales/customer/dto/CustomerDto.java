package com.pcbxpress.erp.modules.sales.customer.dto;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.ComplianceInfo;
import com.pcbxpress.erp.modules.sales.common.CreditInfo;
import com.pcbxpress.erp.modules.sales.common.Preferences;
import java.time.OffsetDateTime;

public record CustomerDto(
    String id,
    String customerCode,
    String name,
    String companyName,
    String email,
    String phone,
    String website,
    String gstin,
    String pan,
    String status,
    AddressDto billing,
    AddressDto shipping,
    CreditInfo credit,
    ComplianceInfo compliance,
    Preferences preferences,
    String notes,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String country,
    String pincode,
    String company,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
