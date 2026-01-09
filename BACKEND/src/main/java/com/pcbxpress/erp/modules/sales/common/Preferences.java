package com.pcbxpress.erp.modules.sales.common;

public record Preferences(
    String preferredFinish,
    String preferredCopperOz,
    String preferredSolderMask,
    String preferredLegend,
    String preferredPackaging,
    String preferredCourier
) {
}
