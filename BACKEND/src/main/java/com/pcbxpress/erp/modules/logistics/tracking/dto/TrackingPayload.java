package com.pcbxpress.erp.modules.logistics.tracking.dto;

import com.pcbxpress.erp.modules.logistics.tracking.model.Tracking;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Payload DTO for creating and updating Tracking
 */
public record TrackingPayload(
    String trackingId,
    UUID shipmentId,
    String shipmentCode,
    UUID packageId,
    String packageCode,
    UUID carrierId,
    String carrierName,
    String carrierTrackingUrl,
    Tracking.TrackingStatus status,
    String statusDescription,
    String statusCode,
    String locationName,
    String locationAddress,
    String locationCity,
    String locationState,
    String locationCountry,
    String locationPostalCode,
    BigDecimal latitude,
    BigDecimal longitude,
    OffsetDateTime eventTime,
    OffsetDateTime estimatedDelivery,
    OffsetDateTime actualDelivery,
    String deliverySignature,
    String deliveryNotes,
    Integer deliveryAttemptCount,
    String deliveryContactName,
    String deliveryContactPhone,
    String deliveryContactEmail,
    Tracking.TrackingType trackingType,
    Boolean isActive,
    String notes
) {
}