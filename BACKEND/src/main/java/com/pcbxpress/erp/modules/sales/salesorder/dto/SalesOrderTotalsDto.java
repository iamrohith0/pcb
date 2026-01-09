package com.pcbxpress.erp.modules.sales.salesorder.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record SalesOrderTotalsDto(
    @JsonAlias({"sub_total", "subTotal"}) Double subTotal,
    @JsonAlias({"tax_total", "taxTotal"}) Double taxTotal,
    @JsonAlias({"grand_total", "grandTotal"}) Double grandTotal
) {
}
