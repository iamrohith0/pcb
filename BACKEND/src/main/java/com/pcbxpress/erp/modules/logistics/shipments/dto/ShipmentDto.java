package com.pcbxpress.erp.modules.logistics.shipments.dto;

import com.pcbxpress.erp.modules.logistics.shipments.model.Shipment;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for Shipment
 */
public record ShipmentDto(
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
    OffsetDateTime shipmentDate,
    OffsetDateTime estimatedDelivery,
    OffsetDateTime actualDelivery,
    Shipment.ShipmentStatus status,
    Shipment.Priority priority,
    Shipment.ShipmentType shipmentType,
    Shipment.ServiceLevel serviceLevel,
    BigDecimal weight,
    String weightUnit,
    BigDecimal dimensionsLength,
    BigDecimal dimensionsWidth,
    BigDecimal dimensionsHeight,
    String dimensionsUnit,
    BigDecimal value,
    String currency,
    Integer packageCount,
    Integer itemCount,
    BigDecimal declaredValue,
    BigDecimal insuranceValue,
    BigDecimal freightCharge,
    BigDecimal handlingCharge,
    BigDecimal customsCharge,
    BigDecimal totalCharge,
    String originAddress,
    String destinationAddress,
    String originContact,
    String destinationContact,
    String originPhone,
    String destinationPhone,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String shippedBy,
    String receivedBy
) {
}