package com.pcbxpress.erp.modules.sales.rfq.dto;

public record RfqLineDto(
    String id,
    String pcbType,
    Integer layers,
    Double thicknessMm,
    Double copperOz,
    String finish,
    String solderMask,
    String silkscreen,
    String panelization,
    Integer qty,
    String unit,
    Integer deliveryDays,
    String notes
) {
}
