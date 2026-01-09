package com.pcbxpress.erp.modules.sales.customer.dto;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.ComplianceInfo;
import com.pcbxpress.erp.modules.sales.common.CreditInfo;
import com.pcbxpress.erp.modules.sales.common.Preferences;

public record CustomerPayload(
    String name,
    String companyName,
    String customerCode,
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
    String notes
) {
}
