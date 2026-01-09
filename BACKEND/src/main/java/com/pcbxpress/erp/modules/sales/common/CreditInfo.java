package com.pcbxpress.erp.modules.sales.common;

import java.math.BigDecimal;

public record CreditInfo(
    BigDecimal creditLimit,
    Integer paymentTermsDays,
    String currency
) {
    public CreditInfo {
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }
    }
}
