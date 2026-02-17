package com.pcbxpress.erp.modules.logistics.tracking.service;

import com.pcbxpress.erp.modules.logistics.tracking.dto.TrackingDto;
import com.pcbxpress.erp.modules.logistics.tracking.dto.TrackingPayload;
import com.pcbxpress.erp.modules.logistics.tracking.model.Tracking;
import com.pcbxpress.erp.modules.logistics.tracking.repository.TrackingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing Tracking
 */
@Service
@Transactional
public class TrackingService {

    private final TrackingRepository trackingRepository;

    public TrackingService(TrackingRepository trackingRepository) {
        this.trackingRepository = trackingRepository;
    }

    /**
     * List tracking records with optional filters
     */
    public List<TrackingDto> list(String query, UUID shipmentId, UUID packageId, UUID carrierId,
            Tracking.TrackingStatus status, Tracking.TrackingType trackingType,
            Boolean isActive, OffsetDateTime startDate, OffsetDateTime endDate) {
        return trackingRepository
                .findByCriteria(shipmentId, packageId, carrierId, status, trackingType, isActive, query).stream()
                .filter(tracking -> {
                    if (startDate != null && endDate != null) {
                        return tracking.getEventTime() != null &&
                                tracking.getEventTime().isAfter(startDate) &&
                                tracking.getEventTime().isBefore(endDate);
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Tracking::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * List tracking records with pagination
     */
    public Page<TrackingDto> listWithPagination(String query, UUID shipmentId, UUID packageId, UUID carrierId,
            Tracking.TrackingStatus status, Tracking.TrackingType trackingType,
            Boolean isActive, OffsetDateTime startDate, OffsetDateTime endDate, Pageable pageable) {
        Page<Tracking> trackings;

        if (startDate != null && endDate != null) {
            trackings = trackingRepository.findTrackingByEventTimeRange(startDate, endDate, pageable);
        } else {
            List<Tracking> allTrackings = trackingRepository.findByCriteria(shipmentId, packageId, carrierId, status,
                    trackingType, isActive, query);
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allTrackings.size());
            List<Tracking> pagedTrackings = allTrackings.subList(start, end);
            List<TrackingDto> dtoList = pagedTrackings.stream().map(this::toDto).collect(Collectors.toList());
            return new PageImpl<>(dtoList, pageable, allTrackings.size());
        }

        return trackings.map(this::toDto);
    }

    /**
     * Get a single tracking record by ID
     */
    public TrackingDto get(String id) {
        Tracking tracking = trackingRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Tracking not found: " + id));
        return toDto(tracking);
    }

    /**
     * Get tracking by tracking ID
     */
    public TrackingDto getByTrackingId(String trackingId) {
        List<Tracking> trackings = trackingRepository.findByTrackingId(trackingId);
        if (trackings.isEmpty()) {
            throw new NoSuchElementException("Tracking not found: " + trackingId);
        }
        // Return the most recent tracking record
        Tracking latest = trackings.stream()
                .max(Comparator.comparing(Tracking::getEventTime, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(trackings.get(0));
        return toDto(latest);
    }

    /**
     * Create a new tracking record
     */
    public TrackingDto create(TrackingPayload payload) {
        // Validate required NOT NULL fields defensively
        List<String> missing = new java.util.ArrayList<>();
        if (payload.trackingId() == null || payload.trackingId().isBlank())
            missing.add("trackingId");
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException(
                    "Missing required fields: " + String.join(", ", missing));
        }

        // Validate unique constraints
        validateUniqueConstraints(payload, null);

        Tracking tracking = new Tracking();
        tracking.setId(UUID.randomUUID());
        applyPayload(tracking, payload);

        // Set default values
        if (tracking.getStatus() == null) {
            tracking.setStatus(Tracking.TrackingStatus.CREATED);
        }

        if (tracking.getTrackingType() == null) {
            tracking.setTrackingType(Tracking.TrackingType.SHIPMENT);
        }

        if (tracking.getIsActive() == null) {
            tracking.setIsActive(true);
        }

        // Default carrierId to nil UUID if not provided (for document-type records)
        if (tracking.getCarrierId() == null) {
            tracking.setCarrierId(new UUID(0L, 0L));
        }

        // Initialize values if not provided
        if (tracking.getDeliveryAttemptCount() == null) {
            tracking.setDeliveryAttemptCount(0);
        }

        // Set last updated time
        tracking.setLastUpdated(OffsetDateTime.now());

        Tracking saved = trackingRepository.save(tracking);
        return toDto(saved);
    }

    /**
     * Update an existing tracking record
     */
    public TrackingDto update(String id, TrackingPayload payload) {
        Tracking existing = trackingRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Tracking not found: " + id));

        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);

        // Update last updated time
        existing.setLastUpdated(OffsetDateTime.now());

        Tracking saved = trackingRepository.save(existing);
        return toDto(saved);
    }

    /**
     * Delete a tracking record
     */
    public void delete(String id) {
        trackingRepository.deleteById(parseId(id));
    }

    /**
     * Delete multiple tracking records
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(TrackingService::parseId).collect(Collectors.toList());
        trackingRepository.deleteAllById(uuidList);
    }

    /**
     * Search tracking records by query
     */
    public List<TrackingDto> search(String query) {
        return trackingRepository.findByCriteria(null, null, null, null, null, null, query).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by shipment
     */
    public List<TrackingDto> getByShipment(UUID shipmentId) {
        return trackingRepository.findByShipmentId(shipmentId).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by shipment code
     */
    public List<TrackingDto> getByShipmentCode(String shipmentCode) {
        return trackingRepository.findByShipmentCode(shipmentCode).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by package
     */
    public List<TrackingDto> getByPackage(UUID packageId) {
        return trackingRepository.findByPackageId(packageId).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by package code
     */
    public List<TrackingDto> getByPackageCode(String packageCode) {
        return trackingRepository.findByPackageCode(packageCode).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by carrier
     */
    public List<TrackingDto> getByCarrier(UUID carrierId) {
        return trackingRepository.findByCarrierId(carrierId).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by status
     */
    public List<TrackingDto> getByStatus(Tracking.TrackingStatus status) {
        return trackingRepository.findByStatus(status).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by type
     */
    public List<TrackingDto> getByType(Tracking.TrackingType trackingType) {
        return trackingRepository.findByTrackingType(trackingType).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by active status
     */
    public List<TrackingDto> getByActive(Boolean isActive) {
        if (isActive) {
            return trackingRepository.findByIsActiveTrue().stream()
                    .sorted(Comparator
                            .comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                            .reversed())
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } else {
            return trackingRepository.findByIsActiveFalse().stream()
                    .sorted(Comparator
                            .comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                            .reversed())
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Get tracking by date range
     */
    public List<TrackingDto> getByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return trackingRepository.findByEventTimeBetween(startDate, endDate).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by estimated delivery range
     */
    public List<TrackingDto> getByEstimatedDeliveryRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return trackingRepository.findByEstimatedDeliveryBetween(startDate, endDate).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get tracking by actual delivery range
     */
    public List<TrackingDto> getByActualDeliveryRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return trackingRepository.findByActualDeliveryBetween(startDate, endDate).stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Update tracking status
     */
    public TrackingDto updateStatus(String id, Tracking.TrackingStatus status, String statusDescription) {
        Tracking tracking = trackingRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Tracking not found: " + id));

        tracking.setStatus(status);
        if (statusDescription != null) {
            tracking.setStatusDescription(statusDescription);
        }
        tracking.setLastUpdated(OffsetDateTime.now());

        // Update timestamps based on status
        if (status == Tracking.TrackingStatus.DELIVERED) {
            tracking.setActualDelivery(OffsetDateTime.now());
        }

        Tracking saved = trackingRepository.save(tracking);
        return toDto(saved);
    }

    /**
     * Update tracking location
     */
    public TrackingDto updateLocation(String id, String locationName, String locationAddress,
            String locationCity, String locationState, String locationCountry,
            String locationPostalCode, BigDecimal latitude, BigDecimal longitude) {
        Tracking tracking = trackingRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Tracking not found: " + id));

        tracking.setLocationName(locationName);
        tracking.setLocationAddress(locationAddress);
        tracking.setLocationCity(locationCity);
        tracking.setLocationState(locationState);
        tracking.setLocationCountry(locationCountry);
        tracking.setLocationPostalCode(locationPostalCode);
        tracking.setLatitude(latitude);
        tracking.setLongitude(longitude);
        tracking.setLastUpdated(OffsetDateTime.now());

        Tracking saved = trackingRepository.save(tracking);
        return toDto(saved);
    }

    /**
     * Update tracking event time
     */
    public TrackingDto updateEventTime(String id, OffsetDateTime eventTime) {
        Tracking tracking = trackingRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Tracking not found: " + id));

        tracking.setEventTime(eventTime);
        tracking.setLastUpdated(OffsetDateTime.now());

        Tracking saved = trackingRepository.save(tracking);
        return toDto(saved);
    }

    /**
     * Update tracking delivery information
     */
    public TrackingDto updateDelivery(String id, OffsetDateTime actualDelivery, String deliverySignature,
            String deliveryNotes, Integer deliveryAttemptCount,
            String deliveryContactName, String deliveryContactPhone, String deliveryContactEmail) {
        Tracking tracking = trackingRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Tracking not found: " + id));

        if (actualDelivery != null) {
            tracking.setActualDelivery(actualDelivery);
        }
        if (deliverySignature != null) {
            tracking.setDeliverySignature(deliverySignature);
        }
        if (deliveryNotes != null) {
            tracking.setDeliveryNotes(deliveryNotes);
        }
        if (deliveryAttemptCount != null) {
            tracking.setDeliveryAttemptCount(deliveryAttemptCount);
        }
        if (deliveryContactName != null) {
            tracking.setDeliveryContactName(deliveryContactName);
        }
        if (deliveryContactPhone != null) {
            tracking.setDeliveryContactPhone(deliveryContactPhone);
        }
        if (deliveryContactEmail != null) {
            tracking.setDeliveryContactEmail(deliveryContactEmail);
        }

        tracking.setStatus(Tracking.TrackingStatus.DELIVERED);
        tracking.setLastUpdated(OffsetDateTime.now());

        Tracking saved = trackingRepository.save(tracking);
        return toDto(saved);
    }

    /**
     * Update tracking coordinates
     */
    public TrackingDto updateCoordinates(String id, BigDecimal latitude, BigDecimal longitude) {
        Tracking tracking = trackingRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Tracking not found: " + id));

        tracking.setLatitude(latitude);
        tracking.setLongitude(longitude);
        tracking.setLastUpdated(OffsetDateTime.now());

        Tracking saved = trackingRepository.save(tracking);
        return toDto(saved);
    }

    /**
     * Get tracking history for a tracking ID
     */
    public List<TrackingDto> getTrackingHistory(String trackingId, String status, OffsetDateTime startDate,
            OffsetDateTime endDate) {
        List<Tracking> trackings = trackingRepository.findByTrackingId(trackingId);

        if (status != null) {
            trackings = trackings.stream()
                    .filter(t -> t.getStatus().toString().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        if (startDate != null && endDate != null) {
            trackings = trackings.stream()
                    .filter(t -> t.getEventTime() != null &&
                            t.getEventTime().isAfter(startDate) &&
                            t.getEventTime().isBefore(endDate))
                    .collect(Collectors.toList());
        }

        return trackings.stream()
                .sorted(Comparator.comparing(Tracking::getEventTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get real-time location for a tracking ID
     */
    public TrackingDto getRealTimeLocation(String trackingId) {
        List<Tracking> trackings = trackingRepository.findByTrackingId(trackingId);
        if (trackings.isEmpty()) {
            throw new NoSuchElementException("Tracking not found: " + trackingId);
        }

        // Return the most recent tracking record
        Tracking latest = trackings.stream()
                .max(Comparator.comparing(Tracking::getEventTime, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(trackings.get(0));

        return toDto(latest);
    }

    /**
     * Get delivery estimate for a tracking ID
     */
    public OffsetDateTime getDeliveryEstimate(String trackingId) {
        List<Tracking> trackings = trackingRepository.findByTrackingId(trackingId);
        if (trackings.isEmpty()) {
            throw new NoSuchElementException("Tracking not found: " + trackingId);
        }

        // Return the estimated delivery from the most recent tracking record
        Tracking latest = trackings.stream()
                .max(Comparator.comparing(Tracking::getEventTime, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(trackings.get(0));

        return latest.getEstimatedDelivery();
    }

    /**
     * Get tracking report data
     */
    public Map<String, Object> getTrackingReport(String status, OffsetDateTime startDate, OffsetDateTime endDate) {
        List<Tracking> all = trackingRepository.findAll();

        if (status != null) {
            all = all.stream()
                    .filter(t -> t.getStatus().toString().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        if (startDate != null && endDate != null) {
            all = all.stream()
                    .filter(t -> t.getEventTime() != null &&
                            t.getEventTime().isAfter(startDate) &&
                            t.getEventTime().isBefore(endDate))
                    .collect(Collectors.toList());
        }

        long total = all.size();
        long created = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.CREATED).count();
        long pickedUp = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.PICKED_UP).count();
        long inTransit = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.IN_TRANSIT).count();
        long outForDelivery = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.OUT_FOR_DELIVERY)
                .count();
        long delivered = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.DELIVERED).count();
        long failedDelivery = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.FAILED_DELIVERY)
                .count();
        long returned = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.RETURNED).count();
        long cancelled = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.CANCELLED).count();
        long exception = all.stream().filter(t -> t.getStatus() == Tracking.TrackingStatus.EXCEPTION).count();
        long availableForPickup = all.stream()
                .filter(t -> t.getStatus() == Tracking.TrackingStatus.AVAILABLE_FOR_PICKUP).count();
        long shipment = all.stream().filter(t -> t.getTrackingType() == Tracking.TrackingType.SHIPMENT).count();
        long packageCount = all.stream().filter(t -> t.getTrackingType() == Tracking.TrackingType.PACKAGE).count();
        long parcel = all.stream().filter(t -> t.getTrackingType() == Tracking.TrackingType.PARCEL).count();
        long active = all.stream().filter(t -> t.getIsActive()).count();
        long inactive = all.stream().filter(t -> !t.getIsActive()).count();

        // Count by carrier
        Map<String, Long> byCarrier = all.stream()
                .filter(t -> t.getCarrierName() != null)
                .collect(Collectors.groupingBy(Tracking::getCarrierName, Collectors.counting()));

        // Count by location
        Map<String, Long> byLocation = all.stream()
                .filter(t -> t.getLocationCountry() != null)
                .collect(Collectors.groupingBy(Tracking::getLocationCountry, Collectors.counting()));

        // Count by status
        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().toString(), Collectors.counting()));

        // Calculate delivery rate
        double deliveryRate = total > 0 ? (double) delivered / total * 100 : 0.0;

        // Calculate average delivery time
        double avgDeliveryTime = 0.0;
        if (delivered > 0) {
            long totalDays = all.stream()
                    .filter(t -> t.getEventTime() != null && t.getActualDelivery() != null)
                    .mapToLong(t -> java.time.Duration.between(t.getEventTime(), t.getActualDelivery()).toDays())
                    .sum();
            avgDeliveryTime = delivered > 0 ? (double) totalDays / delivered : 0.0;
        }

        return Map.ofEntries(
                Map.entry("total", total),
                Map.entry("created", created),
                Map.entry("pickedUp", pickedUp),
                Map.entry("inTransit", inTransit),
                Map.entry("outForDelivery", outForDelivery),
                Map.entry("delivered", delivered),
                Map.entry("failedDelivery", failedDelivery),
                Map.entry("returned", returned),
                Map.entry("cancelled", cancelled),
                Map.entry("exception", exception),
                Map.entry("availableForPickup", availableForPickup),
                Map.entry("shipment", shipment),
                Map.entry("package", packageCount),
                Map.entry("parcel", parcel),
                Map.entry("active", active),
                Map.entry("inactive", inactive),
                Map.entry("deliveryRate", Math.round(deliveryRate)),
                Map.entry("avgDeliveryTime", Math.round(avgDeliveryTime)),
                Map.entry("byCarrier", byCarrier),
                Map.entry("byLocation", byLocation),
                Map.entry("byStatus", byStatus));
    }

    /**
     * Export tracking records to CSV format
     */
    public String exportCsv(List<TrackingDto> data) {
        String header = "Tracking ID,Shipment Code,Package Code,Carrier,Status,Status Description,Location,City,State,Country,Postal Code,Latitude,Longitude,Event Time,Estimated Delivery,Actual Delivery,Delivery Contact,Delivery Notes,Tracking Type,Active";
        String rows = data.stream()
                .map(tracking -> String.join(",",
                        safe(tracking.trackingId()),
                        safe(tracking.shipmentCode()),
                        safe(tracking.packageCode()),
                        safe(tracking.carrierName()),
                        safe(tracking.status() != null ? tracking.status().toString() : ""),
                        safe(tracking.statusDescription()),
                        safe(tracking.locationName()),
                        safe(tracking.locationCity()),
                        safe(tracking.locationState()),
                        safe(tracking.locationCountry()),
                        safe(tracking.locationPostalCode()),
                        safe(tracking.latitude() != null ? tracking.latitude().toString() : ""),
                        safe(tracking.longitude() != null ? tracking.longitude().toString() : ""),
                        safe(tracking.eventTime() != null ? tracking.eventTime().toString() : ""),
                        safe(tracking.estimatedDelivery() != null ? tracking.estimatedDelivery().toString() : ""),
                        safe(tracking.actualDelivery() != null ? tracking.actualDelivery().toString() : ""),
                        safe(getDeliveryContactString(tracking)),
                        safe(tracking.deliveryNotes()),
                        safe(tracking.trackingType() != null ? tracking.trackingType().toString() : ""),
                        safe(tracking.isActive() != null ? tracking.isActive().toString() : "")))
                .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    // Private helper methods

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Tracking not found: " + id);
        }
    }

    private void validateUniqueConstraints(TrackingPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;

        // Check for duplicate tracking ID
        if (payload.trackingId() != null && !payload.trackingId().isBlank()) {
            boolean exists = trackingRepository.existsByTrackingIdIgnoreCaseAndIdNot(payload.trackingId(),
                    existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Tracking ID already exists: " + payload.trackingId());
            }
        }
    }

    private void applyPayload(Tracking target, TrackingPayload payload) {
        target.setTrackingId(payload.trackingId());
        target.setShipmentId(payload.shipmentId());
        target.setShipmentCode(payload.shipmentCode());
        target.setPackageId(payload.packageId());
        target.setPackageCode(payload.packageCode());
        target.setCarrierId(payload.carrierId());
        target.setCarrierName(payload.carrierName());
        target.setCarrierTrackingUrl(payload.carrierTrackingUrl());
        target.setStatus(payload.status());
        target.setStatusDescription(payload.statusDescription());
        target.setStatusCode(payload.statusCode());
        target.setLocationName(payload.locationName());
        target.setLocationAddress(payload.locationAddress());
        target.setLocationCity(payload.locationCity());
        target.setLocationState(payload.locationState());
        target.setLocationCountry(payload.locationCountry());
        target.setLocationPostalCode(payload.locationPostalCode());
        target.setLatitude(payload.latitude());
        target.setLongitude(payload.longitude());
        target.setEventTime(payload.eventTime());
        target.setEstimatedDelivery(payload.estimatedDelivery());
        target.setActualDelivery(payload.actualDelivery());
        target.setDeliverySignature(payload.deliverySignature());
        target.setDeliveryNotes(payload.deliveryNotes());
        target.setDeliveryAttemptCount(payload.deliveryAttemptCount());
        target.setDeliveryContactName(payload.deliveryContactName());
        target.setDeliveryContactPhone(payload.deliveryContactPhone());
        target.setDeliveryContactEmail(payload.deliveryContactEmail());
        target.setTrackingType(payload.trackingType());
        target.setIsActive(payload.isActive());
        target.setNotes(payload.notes());
    }

    private TrackingDto toDto(Tracking tracking) {
        return new TrackingDto(
                tracking.getId().toString(),
                tracking.getTrackingId(),
                tracking.getShipmentId(),
                tracking.getShipmentCode(),
                tracking.getPackageId(),
                tracking.getPackageCode(),
                tracking.getCarrierId(),
                tracking.getCarrierName(),
                tracking.getCarrierTrackingUrl(),
                tracking.getStatus(),
                tracking.getStatusDescription(),
                tracking.getStatusCode(),
                tracking.getLocationName(),
                tracking.getLocationAddress(),
                tracking.getLocationCity(),
                tracking.getLocationState(),
                tracking.getLocationCountry(),
                tracking.getLocationPostalCode(),
                tracking.getLatitude(),
                tracking.getLongitude(),
                safeOffset(tracking.getEventTime()),
                safeOffset(tracking.getEstimatedDelivery()),
                safeOffset(tracking.getActualDelivery()),
                tracking.getDeliverySignature(),
                tracking.getDeliveryNotes(),
                tracking.getDeliveryAttemptCount(),
                tracking.getDeliveryContactName(),
                tracking.getDeliveryContactPhone(),
                tracking.getDeliveryContactEmail(),
                tracking.getTrackingType(),
                tracking.getIsActive(),
                safeOffset(tracking.getLastUpdated()),
                tracking.getNotes(),
                safeOffset(tracking.getCreatedAt()),
                safeOffset(tracking.getUpdatedAt()));
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static String getDeliveryContactString(TrackingDto tracking) {
        if (tracking.deliveryContactName() == null && tracking.deliveryContactPhone() == null
                && tracking.deliveryContactEmail() == null) {
            return "";
        }
        return String.format("%s | %s | %s",
                safe(tracking.deliveryContactName()),
                safe(tracking.deliveryContactPhone()),
                safe(tracking.deliveryContactEmail()));
    }

    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}