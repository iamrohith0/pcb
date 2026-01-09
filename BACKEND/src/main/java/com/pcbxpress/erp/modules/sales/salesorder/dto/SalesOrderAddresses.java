package com.pcbxpress.erp.modules.sales.salesorder.dto;

import com.pcbxpress.erp.modules.sales.common.AddressDto;

public record SalesOrderAddresses(
    AddressDto shipping,
    AddressDto billing
) {
}
