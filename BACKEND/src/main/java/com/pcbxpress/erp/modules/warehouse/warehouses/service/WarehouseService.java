package com.pcbxpress.erp.modules.warehouse.warehouses.service;

import com.pcbxpress.erp.modules.warehouse.warehouses.dto.WarehouseDto;
import com.pcbxpress.erp.modules.warehouse.warehouses.dto.WarehousePayload;
import com.pcbxpress.erp.modules.warehouse.warehouses.model.Warehouse;
import com.pcbxpress.erp.modules.warehouse.warehouses.repository.WarehouseRepository;
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
 * Service for managing Warehouses
 */
@Service
@Transactional
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseService(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    /**
     * List warehouses with optional filters
     */
    public List<WarehouseDto> list(String query, UUID plantId, Warehouse.WarehouseType warehouseType,
            Boolean isActive, Boolean isDefault) {
        return warehouseRepository.findByCriteria(plantId, warehouseType, isActive, isDefault, query).stream()
                .sorted(Comparator.comparing(Warehouse::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get a single warehouse by ID
     */
    public WarehouseDto get(String id) {
        Warehouse warehouse = warehouseRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Warehouse not found: " + id));
        return toDto(warehouse);
    }

    /**
     * Create a new warehouse
     */
    public WarehouseDto create(WarehousePayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(UUID.randomUUID());
        applyPayload(warehouse, payload);

        // Auto-generate code if not provided
        if (warehouse.getCode() == null || warehouse.getCode().isBlank()) {
            warehouse.setCode(generateWarehouseCode());
        }

        // Set default values only if payload did not provide them
        if (payload.isActive() == null) {
            warehouse.setActive(true);
        }
        if (payload.isDefault() == null) {
            warehouse.setDefault(false);
        }

        // If this is set as default, unset any existing default warehouse
        if (warehouse.isDefault()) {
            unsetExistingDefault();
        }

        Warehouse saved = warehouseRepository.save(warehouse);
        return toDto(saved);
    }

    /**
     * Update an existing warehouse
     */
    public WarehouseDto update(String id, WarehousePayload payload) {
        Warehouse existing = warehouseRepository.findById(parseId(id))
                .orElseThrow(() -> new NoSuchElementException("Warehouse not found: " + id));

        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);

        // If this is set as default, unset any existing default warehouse
        if (existing.isDefault()) {
            unsetExistingDefault(existing.getId());
        }

        Warehouse saved = warehouseRepository.save(existing);
        return toDto(saved);
    }

    /**
     * Delete a warehouse
     */
    public void delete(String id) {
        warehouseRepository.deleteById(parseId(id));
    }

    /**
     * Delete multiple warehouses
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(WarehouseService::parseId).collect(Collectors.toList());
        warehouseRepository.deleteAllById(uuidList);
    }

    /**
     * Search warehouses by query
     */
    public List<WarehouseDto> search(String query) {
        return warehouseRepository.findByCriteria(null, null, null, null, query).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get default warehouse
     */
    public WarehouseDto getDefaultWarehouse() {
        Warehouse defaultWarehouse = warehouseRepository.findByIsDefaultTrue();
        return defaultWarehouse != null ? toDto(defaultWarehouse) : null;
    }

    /**
     * Get warehouses by plant
     */
    public List<WarehouseDto> getByPlant(UUID plantId) {
        return warehouseRepository.findByPlantId(plantId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get warehouses by type
     */
    public List<WarehouseDto> getByType(Warehouse.WarehouseType warehouseType) {
        return warehouseRepository.findByWarehouseType(warehouseType).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get warehouse statistics
     */
    public Map<String, Object> getStats() {
        List<Warehouse> all = warehouseRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(Warehouse::isActive).count();
        long inactive = all.stream().filter(w -> !w.isActive()).count();
        long defaultCount = all.stream().filter(Warehouse::isDefault).count();
        long temperatureControlled = all.stream().filter(Warehouse::isSupportsTemperatureControl).count();
        long serialized = all.stream().filter(Warehouse::isSupportsSerialization).count();
        long lotTracked = all.stream().filter(Warehouse::isSupportsLotTracking).count();

        // Count by type
        Map<Warehouse.WarehouseType, Long> byType = all.stream()
                .collect(Collectors.groupingBy(Warehouse::getWarehouseType, Collectors.counting()));

        // Count by plant
        Map<String, Long> byPlant = all.stream()
                .filter(w -> w.getPlantName() != null)
                .collect(Collectors.groupingBy(Warehouse::getPlantName, Collectors.counting()));

        // Calculate capacity utilization
        double avgUtilization = all.stream()
                .filter(w -> w.getTotalCapacity() != null && w.getTotalCapacity().compareTo(BigDecimal.ZERO) > 0)
                .mapToDouble(w -> {
                    BigDecimal used = w.getUsedCapacity() != null ? w.getUsedCapacity() : BigDecimal.ZERO;
                    BigDecimal capacityTotal = w.getTotalCapacity();
                    return used.divide(capacityTotal, 4, BigDecimal.ROUND_HALF_UP).doubleValue();
                })
                .average()
                .orElse(0.0);

        return Map.of(
                "total", total,
                "active", active,
                "inactive", inactive,
                "default", defaultCount,
                "temperatureControlled", temperatureControlled,
                "serialized", serialized,
                "lotTracked", lotTracked,
                "avgCapacityUtilization", Math.round(avgUtilization * 100),
                "byType", byType,
                "byPlant", byPlant);
    }

    /**
     * Export warehouses to CSV format
     */
    public String exportCsv(List<WarehouseDto> data) {
        String header = "Code,Name,Type,Plant,City,Country,Active,Default,Capacity,Used Capacity,Contact";
        String rows = data.stream()
                .map(warehouse -> String.join(",",
                        safe(warehouse.code()),
                        safe(warehouse.name()),
                        safe(warehouse.warehouseType() != null ? warehouse.warehouseType().toString() : ""),
                        safe(warehouse.plantName()),
                        safe(warehouse.city()),
                        safe(warehouse.country()),
                        warehouse.isActive() ? "Yes" : "No",
                        warehouse.isDefault() ? "Yes" : "No",
                        safe(warehouse.totalCapacity() != null ? warehouse.totalCapacity().toString() : ""),
                        safe(warehouse.usedCapacity() != null ? warehouse.usedCapacity().toString() : ""),
                        safe(warehouse.contactName())))
                .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    // Private helper methods

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Warehouse not found: " + id);
        }
    }

    private static String generateWarehouseCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "WH-" + token;
    }

    private void validateUniqueConstraints(WarehousePayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;

        // Check for duplicate code
        if (payload.code() != null && !payload.code().isBlank()) {
            boolean exists = warehouseRepository.existsByCodeIgnoreCaseAndIdNot(payload.code(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Warehouse code already exists: " + payload.code());
            }
        }
    }

    private void unsetExistingDefault(UUID excludeId) {
        Warehouse defaultWarehouse = warehouseRepository.findByIsDefaultTrue();
        if (defaultWarehouse != null && (excludeId == null || !defaultWarehouse.getId().equals(excludeId))) {
            defaultWarehouse.setDefault(false);
            warehouseRepository.save(defaultWarehouse);
        }
    }

    private void unsetExistingDefault() {
        unsetExistingDefault(null);
    }

    private void applyPayload(Warehouse target, WarehousePayload payload) {
        target.setCode(payload.code());
        target.setName(payload.name());
        target.setDescription(payload.description());
        target.setWarehouseType(payload.warehouseType());
        target.setPlantId(payload.plantId());
        target.setPlantName(payload.plantName());
        if (payload.isDefault() != null) {
            target.setDefault(payload.isDefault());
        }
        if (payload.isActive() != null) {
            target.setActive(payload.isActive());
        }
        target.setAddressLine1(payload.addressLine1());
        target.setAddressLine2(payload.addressLine2());
        target.setCity(payload.city());
        target.setState(payload.state());
        target.setPincode(payload.pincode());
        target.setCountry(payload.country());
        target.setContactName(payload.contactName());
        target.setContactPhone(payload.contactPhone());
        target.setTotalCapacity(payload.totalCapacity());
        target.setUsedCapacity(payload.usedCapacity());
        target.setCapacityUnit(payload.capacityUnit());
        target.setAreaSqM(payload.areaSqM());
        target.setSupportsSerialization(payload.supportsSerialization());
        target.setSupportsLotTracking(payload.supportsLotTracking());
        target.setSupportsBulkStorage(payload.supportsBulkStorage());
        target.setSupportsTemperatureControl(payload.supportsTemperatureControl());
        target.setTemperatureRange(payload.temperatureRange());
    }

    private WarehouseDto toDto(Warehouse warehouse) {
        return new WarehouseDto(
                warehouse.getId().toString(),
                warehouse.getCode(),
                warehouse.getName(),
                warehouse.getDescription(),
                warehouse.getWarehouseType(),
                warehouse.getPlantId(),
                warehouse.getPlantName(),
                warehouse.isDefault(),
                warehouse.isActive(),
                warehouse.getAddressLine1(),
                warehouse.getAddressLine2(),
                warehouse.getCity(),
                warehouse.getState(),
                warehouse.getPincode(),
                warehouse.getCountry(),
                warehouse.getContactName(),
                warehouse.getContactPhone(),
                warehouse.getTotalCapacity(),
                warehouse.getUsedCapacity(),
                warehouse.getCapacityUnit(),
                warehouse.getAreaSqM(),
                warehouse.isSupportsSerialization(),
                warehouse.isSupportsLotTracking(),
                warehouse.isSupportsBulkStorage(),
                warehouse.isSupportsTemperatureControl(),
                warehouse.getTemperatureRange(),
                safeOffset(warehouse.getCreatedAt()),
                safeOffset(warehouse.getUpdatedAt()));
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}