package com.pcbxpress.erp.modules.sales.salesorder.dto;

import java.time.LocalDate;

public record PoInfo(
    String number,
    LocalDate date
) {
}
