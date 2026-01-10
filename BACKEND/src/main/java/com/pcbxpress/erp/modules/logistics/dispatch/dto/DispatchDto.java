package com.pcbxpress.erp.modules.logistics.dispatch.dto;

import com.pcbxpress.erp.modules.logistics.dispatch.model.Dispatch;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for Dispatch
 */
public record DispatchDto(
    String id,
    String code,
    String description,
    UUID orderId,
    String orderCode,
    UUID customerId,
    String customerName,
    UUID warehouseId,
    String warehouseName,
    UUID carrierId,
    String carrierName,
    String trackingNumber,
    UUID shipmentId,
    String shipmentCode,
    OffsetDateTime dispatchDate,
    OffsetDateTime estimatedDelivery,
    OffsetDateTime actualDelivery,
    Dispatch.DispatchStatus status,
    Dispatch.Priority priority,
    Dispatch.DispatchType dispatchType,
    BigDecimal weight,
    String weightUnit,
    BigDecimal dimensionsLength,
    BigDecimal dimensionsWidth,
    BigDecimal dimensionsHeight,
    String dimensionsUnit,
    BigDecimal value,
    String currency,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String dispatchedBy,
    String receivedBy
) {
}