package com.pcbxpress.erp.modules.admin.masters.dto;

import com.pcbxpress.erp.modules.admin.masters.model.MaterialMaster;
import java.math.BigDecimal;

/**
 * Payload DTO for creating and updating Material Master
 */
public record MaterialMasterPayload(
    String materialCode,
    String name,
    String description,
    MaterialMaster.MaterialType materialType,
    String unitOfMeasure,
    MaterialMaster.Status status,
    BigDecimal thicknessMm,
    BigDecimal copperOz,
    BigDecimal tg,
    String materialClass,
    String finish,
    String color,
    String notes,
    String preferredVendor,
    String vendorPartNo,
    Integer leadTimeDays,
    BigDecimal minStock,
    BigDecimal reorderPoint,
    String currency,
    BigDecimal unitPrice,
    boolean isRoHS,
    boolean isReach,
    boolean isUl
) {
}