package com.pcbxpress.erp.modules.sales.salesorder.dto;

import java.time.LocalDate;

public record JobInfo(
    String name,
    String priority,
    LocalDate requestedDelivery
) {
}
