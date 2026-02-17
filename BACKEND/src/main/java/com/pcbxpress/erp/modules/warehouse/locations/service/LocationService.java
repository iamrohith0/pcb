package com.pcbxpress.erp.modules.warehouse.locations.service;

import com.pcbxpress.erp.modules.warehouse.locations.dto.LocationDto;
import com.pcbxpress.erp.modules.warehouse.locations.dto.LocationPayload;
import com.pcbxpress.erp.modules.warehouse.locations.model.Location;
import com.pcbxpress.erp.modules.warehouse.locations.repository.LocationRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Locations
 */
@Service
@Transactional
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    /**
     * List locations with optional filters
     */
    public List<LocationDto> list(String query, UUID warehouseId, Location.LocationType locationType,
            Boolean isActive, Location.LocationStatus status, String zone,
            String aisle, String rack, String shelf, String bin,
            Integer page, Integer limit) {

        // Determine if any filter is actually set
        boolean hasFilters = warehouseId != null || locationType != null || isActive != null
                || status != null
                || (zone != null && !zone.isBlank())
                || (aisle != null && !aisle.isBlank())
                || (rack != null && !rack.isBlank())
                || (shelf != null && !shelf.isBlank())
                || (bin != null && !bin.isBlank())
                || (query != null && !query.isBlank());

        List<Location> locations;
        if (hasFilters) {
            locations = locationRepository
                    .findByCriteria(warehouseId, locationType, isActive, status, zone, aisle, rack, shelf, bin, query);
        } else {
            locations = locationRepository.findAll();
        }

        List<LocationDto> list = locations
                .stream()
                .sorted(Comparator.comparing(Location::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());

        // Apply safe in-memory pagination
        if (page != null && limit != null && page > 0 && limit > 0) {
            int start = (page - 1) * limit;
            if (start >= list.size()) {
                return List.of();
            }
            int end = Math.min(start + limit, list.size());
            return list.subList(start, end);
        }
        return list;
    }

    /**
     * Get a single location by ID
     */
    public LocationDto get(String id) {
        Location location = locationRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Location not found: " + id));
        return toDto(location);
    }

    /**
     * Create a new location
     */
    public LocationDto create(LocationPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);

        Location location = new Location();
        location.setId(UUID.randomUUID());
        applyPayload(location, payload);

        // Auto-generate code if not provided
        if (location.getCode() == null || location.getCode().isBlank()) {
            location.setCode(generateLocationCode());
        }

        // Set default status if not provided
        if (location.getStatus() == null) {
            location.setStatus(Location.LocationStatus.AVAILABLE);
        }

        Location saved = locationRepository.save(location);
        return toDto(saved);
    }

    /**
     * Update an existing location
     */
    public LocationDto update(String id, LocationPayload payload) {
        Location existing = locationRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Location not found: " + id));

        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);

        Location saved = locationRepository.save(existing);
        return toDto(saved);
    }

    /**
     * Delete a location
     */
    public void delete(String id) {
        locationRepository.deleteById(parseId(id));
    }

    /**
     * Delete multiple locations
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(LocationService::parseId).collect(Collectors.toList());
        locationRepository.deleteAllById(uuidList);
    }

    /**
     * Search locations by query
     */
    public List<LocationDto> search(String query) {
        return locationRepository.findByCriteria(null, null, null, null, null, null, null, null, null, query).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by warehouse
     */
    public List<LocationDto> getByWarehouse(UUID warehouseId) {
        return locationRepository.findByWarehouseId(warehouseId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by type
     */
    public List<LocationDto> getByType(Location.LocationType locationType) {
        return locationRepository.findByLocationType(locationType).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by status
     */
    public List<LocationDto> getByStatus(Location.LocationStatus status) {
        return locationRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by zone
     */
    public List<LocationDto> getByZone(String zone) {
        return locationRepository.findByZoneIgnoreCase(zone).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by aisle
     */
    public List<LocationDto> getByAisle(String aisle) {
        return locationRepository.findByAisleIgnoreCase(aisle).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by rack
     */
    public List<LocationDto> getByRack(String rack) {
        return locationRepository.findByRackIgnoreCase(rack).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by shelf
     */
    public List<LocationDto> getByShelf(String shelf) {
        return locationRepository.findByShelfIgnoreCase(shelf).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get locations by bin
     */
    public List<LocationDto> getByBin(String bin) {
        return locationRepository.findByBinIgnoreCase(bin).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get location statistics
     */
    public Map<String, Object> getStats() {
        List<Location> all = locationRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(Location::isActive).count();
        long inactive = all.stream().filter(l -> !l.isActive()).count();
        long available = all.stream().filter(l -> l.getStatus() == Location.LocationStatus.AVAILABLE).count();
        long occupied = all.stream().filter(l -> l.getStatus() == Location.LocationStatus.OCCUPIED).count();
        long reserved = all.stream().filter(l -> l.getStatus() == Location.LocationStatus.RESERVED).count();
        long maintenance = all.stream().filter(l -> l.getStatus() == Location.LocationStatus.MAINTENANCE).count();
        long disabled = all.stream().filter(l -> l.getStatus() == Location.LocationStatus.DISABLED).count();
        long quarantine = all.stream().filter(Location::isQuarantine).count();
        long locked = all.stream().filter(Location::isLocked).count();
        long serialized = all.stream().filter(Location::isSupportsSerialization).count();
        long lotTracked = all.stream().filter(Location::isSupportsLotTracking).count();

        // Count by type
        Map<Location.LocationType, Long> byType = all.stream()
                .collect(Collectors.groupingBy(Location::getLocationType, Collectors.counting()));

        // Count by warehouse
        Map<String, Long> byWarehouse = all.stream()
                .filter(l -> l.getWarehouseName() != null)
                .collect(Collectors.groupingBy(Location::getWarehouseName, Collectors.counting()));

        // Calculate capacity utilization
        double avgUtilization = all.stream()
                .filter(l -> l.getMaxCapacity() != null && l.getMaxCapacity().compareTo(BigDecimal.ZERO) > 0)
                .mapToDouble(l -> {
                    BigDecimal current = l.getCurrentCapacity() != null ? l.getCurrentCapacity() : BigDecimal.ZERO;
                    BigDecimal max = l.getMaxCapacity();
                    return current.divide(max, 4, BigDecimal.ROUND_HALF_UP).doubleValue();
                })
                .average()
                .orElse(0.0);

        return Map.ofEntries(
                Map.entry("total", total),
                Map.entry("active", active),
                Map.entry("inactive", inactive),
                Map.entry("available", available),
                Map.entry("occupied", occupied),
                Map.entry("reserved", reserved),
                Map.entry("maintenance", maintenance),
                Map.entry("disabled", disabled),
                Map.entry("quarantine", quarantine),
                Map.entry("locked", locked),
                Map.entry("serialized", serialized),
                Map.entry("lotTracked", lotTracked),
                Map.entry("avgCapacityUtilization", Math.round(avgUtilization * 100)),
                Map.entry("byType", byType),
                Map.entry("byWarehouse", byWarehouse));
    }

    /**
     * Export locations to CSV format
     */
    public String exportCsv(List<LocationDto> data) {
        String header = "Code,Name,Type,Warehouse,Zone,Aisle,Rack,Shelf,Bin,Status,Active,Capacity,Used Capacity,Locked,Quarantine";
        String rows = data.stream()
                .map(location -> String.join(",",
                        safe(location.code()),
                        safe(location.name()),
                        safe(location.locationType() != null ? location.locationType().toString() : ""),
                        safe(location.warehouseName()),
                        safe(location.zone()),
                        safe(location.aisle()),
                        safe(location.rack()),
                        safe(location.shelf()),
                        safe(location.bin()),
                        safe(location.status() != null ? location.status().toString() : ""),
                        location.isActive() ? "Yes" : "No",
                        safe(location.maxCapacity() != null ? location.maxCapacity().toString() : ""),
                        safe(location.currentCapacity() != null ? location.currentCapacity().toString() : ""),
                        location.isLocked() ? "Yes" : "No",
                        location.isQuarantine() ? "Yes" : "No"))
                .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    // Private helper methods

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Location not found: " + id);
        }
    }

    private static String generateLocationCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "LOC-" + token;
    }

    private void validateUniqueConstraints(LocationPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;

        // Check for duplicate code
        if (payload.code() != null && !payload.code().isBlank()) {
            boolean exists = locationRepository.existsByCodeIgnoreCaseAndIdNot(payload.code(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Location code already exists: " + payload.code());
            }
        }
    }

    private void applyPayload(Location target, LocationPayload payload) {
        target.setCode(payload.code());
        target.setName(payload.name());
        target.setDescription(payload.description());
        target.setWarehouseId(payload.warehouseId());
        target.setWarehouseName(payload.warehouseName());
        target.setLocationType(payload.locationType());
        target.setActive(payload.isActive() != null ? payload.isActive() : true);
        target.setZone(payload.zone());
        target.setAisle(payload.aisle());
        target.setRack(payload.rack());
        target.setShelf(payload.shelf());
        target.setBin(payload.bin());
        target.setMaxCapacity(payload.maxCapacity());
        target.setCurrentCapacity(payload.currentCapacity());
        target.setCapacityUnit(payload.capacityUnit());
        target.setLength(payload.length());
        target.setWidth(payload.width());
        target.setHeight(payload.height());
        target.setVolume(payload.volume());
        target.setStatus(payload.status());
        target.setLocked(payload.isLocked());
        target.setQuarantine(payload.isQuarantine());
        target.setBulkStorage(payload.isBulkStorage());
        target.setSupportsSerialization(payload.supportsSerialization());
        target.setSupportsLotTracking(payload.supportsLotTracking());
        target.setRestrictedItemTypes(payload.restrictedItemTypes());
        target.setMaxItemsPerLocation(payload.maxItemsPerLocation());
    }

    private LocationDto toDto(Location location) {
        return new LocationDto(
                location.getId().toString(),
                location.getCode(),
                location.getName(),
                location.getDescription(),
                location.getWarehouseId(),
                location.getWarehouseName(),
                location.getLocationType(),
                location.isActive(),
                location.getZone(),
                location.getAisle(),
                location.getRack(),
                location.getShelf(),
                location.getBin(),
                location.getMaxCapacity(),
                location.getCurrentCapacity(),
                location.getCapacityUnit(),
                location.getLength(),
                location.getWidth(),
                location.getHeight(),
                location.getVolume(),
                location.getStatus(),
                location.isLocked(),
                location.isQuarantine(),
                location.isBulkStorage(),
                location.isSupportsSerialization(),
                location.isSupportsLotTracking(),
                location.getRestrictedItemTypes(),
                location.getMaxItemsPerLocation(),
                safeOffset(location.getCreatedAt()),
                safeOffset(location.getUpdatedAt()));
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}