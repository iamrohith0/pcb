package com.pcbxpress.erp.modules.sales.quotation.dto;

public record PcbSpecDto(
    String jobName,
    String boardType,
    Integer layerCount,
    String thickness,
    String copperWeight,
    String surfaceFinish,
    String solderMask,
    String silkscreen,
    String impedanceControl,
    String viaType,
    String panelization
) {
}
