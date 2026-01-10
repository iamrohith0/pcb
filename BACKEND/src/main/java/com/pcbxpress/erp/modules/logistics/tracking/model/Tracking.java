package com.pcbxpress.erp.modules.logistics.tracking.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Tracking Entity
 * Represents tracking information for shipments and packages
 */
@Entity
@Table(name = "tracking", indexes = {
    @Index(name = "idx_tracking_tracking_id", columnList = "tracking_id"),
    @Index(name = "idx_tracking_shipment_id", columnList = "shipment_id"),
    @Index(name = "idx_tracking_package_id", columnList = "package_id"),
    @Index(name = "idx_tracking_status", columnList = "status"),
    @Index(name = "idx_tracking_carrier_id", columnList = "carrier_id"),
    @Index(name = "idx_tracking_created_at", columnList = "created_at"),
    @Index(name = "idx_tracking_updated_at", columnList = "updated_at")
})
public class Tracking {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "tracking_id", nullable = false, unique = true, length = 100)
    private String trackingId;
    
    @Column(name = "shipment_id")
    private UUID shipmentId;
    
    @Column(name = "shipment_code", length = 100)
    private String shipmentCode;
    
    @Column(name = "package_id")
    private UUID packageId;
    
    @Column(name = "package_code", length = 100)
    private String packageCode;
    
    @Column(name = "carrier_id", nullable = false)
    private UUID carrierId;
    
    @Column(name = "carrier_name", length = 200)
    private String carrierName;
    
    @Column(name = "carrier_tracking_url", length = 500)
    private String carrierTrackingUrl;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private TrackingStatus status;
    
    @Column(name = "status_description", length = 500)
    private String statusDescription;
    
    @Column(name = "status_code", length = 20)
    private String statusCode;
    
    @Column(name = "location_name", length = 200)
    private String locationName;
    
    @Column(name = "location_address", columnDefinition = "text")
    private String locationAddress;
    
    @Column(name = "location_city", length = 100)
    private String locationCity;
    
    @Column(name = "location_state", length = 100)
    private String locationState;
    
    @Column(name = "location_country", length = 100)
    private String locationCountry;
    
    @Column(name = "location_postal_code", length = 20)
    private String locationPostalCode;
    
    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;
    
    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;
    
    @Column(name = "event_time")
    private OffsetDateTime eventTime;
    
    @Column(name = "estimated_delivery")
    private OffsetDateTime estimatedDelivery;
    
    @Column(name = "actual_delivery")
    private OffsetDateTime actualDelivery;
    
    @Column(name = "delivery_signature", columnDefinition = "text")
    private String deliverySignature;
    
    @Column(name = "delivery_notes", columnDefinition = "text")
    private String deliveryNotes;
    
    @Column(name = "delivery_attempt_count")
    private Integer deliveryAttemptCount;
    
    @Column(name = "delivery_contact_name", length = 200)
    private String deliveryContactName;
    
    @Column(name = "delivery_contact_phone", length = 50)
    private String deliveryContactPhone;
    
    @Column(name = "delivery_contact_email", length = 200)
    private String deliveryContactEmail;
    
    @Column(name = "tracking_type", length = 50)
    @Enumerated(EnumType.STRING)
    private TrackingType trackingType;
    
    @Column(name = "is_active")
    private Boolean isActive;
    
    @Column(name = "last_updated")
    private OffsetDateTime lastUpdated;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    // Audit fields
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (lastUpdated == null) {
            lastUpdated = now;
        }
        if (isActive == null) {
            isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
        lastUpdated = OffsetDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getTrackingId() {
        return trackingId;
    }
    
    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }
    
    public UUID getShipmentId() {
        return shipmentId;
    }
    
    public void setShipmentId(UUID shipmentId) {
        this.shipmentId = shipmentId;
    }
    
    public String getShipmentCode() {
        return shipmentCode;
    }
    
    public void setShipmentCode(String shipmentCode) {
        this.shipmentCode = shipmentCode;
    }
    
    public UUID getPackageId() {
        return packageId;
    }
    
    public void setPackageId(UUID packageId) {
        this.packageId = packageId;
    }
    
    public String getPackageCode() {
        return packageCode;
    }
    
    public void setPackageCode(String packageCode) {
        this.packageCode = packageCode;
    }
    
    public UUID getCarrierId() {
        return carrierId;
    }
    
    public void setCarrierId(UUID carrierId) {
        this.carrierId = carrierId;
    }
    
    public String getCarrierName() {
        return carrierName;
    }
    
    public void setCarrierName(String carrierName) {
        this.carrierName = carrierName;
    }
    
    public String getCarrierTrackingUrl() {
        return carrierTrackingUrl;
    }
    
    public void setCarrierTrackingUrl(String carrierTrackingUrl) {
        this.carrierTrackingUrl = carrierTrackingUrl;
    }
    
    public TrackingStatus getStatus() {
        return status;
    }
    
    public void setStatus(TrackingStatus status) {
        this.status = status;
    }
    
    public String getStatusDescription() {
        return statusDescription;
    }
    
    public void setStatusDescription(String statusDescription) {
        this.statusDescription = statusDescription;
    }
    
    public String getStatusCode() {
        return statusCode;
    }
    
    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }
    
    public String getLocationName() {
        return locationName;
    }
    
    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }
    
    public String getLocationAddress() {
        return locationAddress;
    }
    
    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }
    
    public String getLocationCity() {
        return locationCity;
    }
    
    public void setLocationCity(String locationCity) {
        this.locationCity = locationCity;
    }
    
    public String getLocationState() {
        return locationState;
    }
    
    public void setLocationState(String locationState) {
        this.locationState = locationState;
    }
    
    public String getLocationCountry() {
        return locationCountry;
    }
    
    public void setLocationCountry(String locationCountry) {
        this.locationCountry = locationCountry;
    }
    
    public String getLocationPostalCode() {
        return locationPostalCode;
    }
    
    public void setLocationPostalCode(String locationPostalCode) {
        this.locationPostalCode = locationPostalCode;
    }
    
    public BigDecimal getLatitude() {
        return latitude;
    }
    
    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }
    
    public BigDecimal getLongitude() {
        return longitude;
    }
    
    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }
    
    public OffsetDateTime getEventTime() {
        return eventTime;
    }
    
    public void setEventTime(OffsetDateTime eventTime) {
        this.eventTime = eventTime;
    }
    
    public OffsetDateTime getEstimatedDelivery() {
        return estimatedDelivery;
    }
    
    public void setEstimatedDelivery(OffsetDateTime estimatedDelivery) {
        this.estimatedDelivery = estimatedDelivery;
    }
    
    public OffsetDateTime getActualDelivery() {
        return actualDelivery;
    }
    
    public void setActualDelivery(OffsetDateTime actualDelivery) {
        this.actualDelivery = actualDelivery;
    }
    
    public String getDeliverySignature() {
        return deliverySignature;
    }
    
    public void setDeliverySignature(String deliverySignature) {
        this.deliverySignature = deliverySignature;
    }
    
    public String getDeliveryNotes() {
        return deliveryNotes;
    }
    
    public void setDeliveryNotes(String deliveryNotes) {
        this.deliveryNotes = deliveryNotes;
    }
    
    public Integer getDeliveryAttemptCount() {
        return deliveryAttemptCount;
    }
    
    public void setDeliveryAttemptCount(Integer deliveryAttemptCount) {
        this.deliveryAttemptCount = deliveryAttemptCount;
    }
    
    public String getDeliveryContactName() {
        return deliveryContactName;
    }
    
    public void setDeliveryContactName(String deliveryContactName) {
        this.deliveryContactName = deliveryContactName;
    }
    
    public String getDeliveryContactPhone() {
        return deliveryContactPhone;
    }
    
    public void setDeliveryContactPhone(String deliveryContactPhone) {
        this.deliveryContactPhone = deliveryContactPhone;
    }
    
    public String getDeliveryContactEmail() {
        return deliveryContactEmail;
    }
    
    public void setDeliveryContactEmail(String deliveryContactEmail) {
        this.deliveryContactEmail = deliveryContactEmail;
    }
    
    public TrackingType getTrackingType() {
        return trackingType;
    }
    
    public void setTrackingType(TrackingType trackingType) {
        this.trackingType = trackingType;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public OffsetDateTime getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(OffsetDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public enum TrackingStatus {
        CREATED,
        PICKED_UP,
        IN_TRANSIT,
        OUT_FOR_DELIVERY,
        DELIVERED,
        FAILED_DELIVERY,
        RETURNED,
        CANCELLED,
        EXCEPTION,
        AVAILABLE_FOR_PICKUP
    }
    
    public enum TrackingType {
        SHIPMENT,
        PACKAGE,
        PARCEL
    }
}