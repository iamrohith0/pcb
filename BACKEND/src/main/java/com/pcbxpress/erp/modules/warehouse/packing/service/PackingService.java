package com.pcbxpress.erp.modules.warehouse.packing.service;

import com.pcbxpress.erp.modules.warehouse.packing.dto.PackingDto;
import com.pcbxpress.erp.modules.warehouse.packing.dto.PackingPayload;
import com.pcbxpress.erp.modules.warehouse.packing.model.Packing;
import com.pcbxpress.erp.modules.warehouse.packing.repository.PackingRepository;
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
 * Service for managing Packings
 */
@Service
@Transactional
public class PackingService {
    
    private final PackingRepository packingRepository;
    
    public PackingService(PackingRepository packingRepository) {
        this.packingRepository = packingRepository;
    }
    
    /**
     * List packings with optional filters
     */
    public List<PackingDto> list(String query, UUID warehouseId, UUID locationId, UUID itemId, 
                               UUID batchId, UUID serialId, UUID shipmentId, UUID pickListId,
                               String workOrder, Packing.PackingStatus status, Packing.Priority priority, 
                               Packing.PackingType packingType, String cartonType) {
        return packingRepository.findByCriteria(warehouseId, locationId, itemId, batchId, serialId, 
            shipmentId, pickListId, workOrder, status, priority, packingType, cartonType, query).stream()
            .sorted(Comparator.comparing(Packing::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single packing by ID
     */
    public PackingDto get(String id) {
        Packing packing = packingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Packing not found: " + id));
        return toDto(packing);
    }
    
    /**
     * Create a new packing
     */
    public PackingDto create(PackingPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Packing packing = new Packing();
        packing.setId(UUID.randomUUID());
        applyPayload(packing, payload);
        
        // Auto-generate code if not provided
        if (packing.getCode() == null || packing.getCode().isBlank()) {
            packing.setCode(generatePackingCode());
        }
        
        // Set default values
        if (packing.getStatus() == null) {
            packing.setStatus(Packing.PackingStatus.DRAFT);
        }
        
        if (packing.getPriority() == null) {
            packing.setPriority(Packing.Priority.NORMAL);
        }
        
        if (packing.getPackingType() == null) {
            packing.setPackingType(Packing.PackingType.INDIVIDUAL);
        }
        
        // Initialize quantities if not provided
        if (packing.getQuantityToPack() == null) {
            packing.setQuantityToPack(BigDecimal.ZERO);
        }
        if (packing.getQuantityPacked() == null) {
            packing.setQuantityPacked(BigDecimal.ZERO);
        }
        if (packing.getQuantityConfirmed() == null) {
            packing.setQuantityConfirmed(BigDecimal.ZERO);
        }
        
        Packing saved = packingRepository.save(packing);
        return toDto(saved);
    }
    
    /**
     * Update an existing packing
     */
    public PackingDto update(String id, PackingPayload payload) {
        Packing existing = packingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Packing not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Packing saved = packingRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a packing
     */
    public void delete(String id) {
        packingRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple packings
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(PackingService::parseId).collect(Collectors.toList());
        packingRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search packings by query
     */
    public List<PackingDto> search(String query) {
        return packingRepository.findByCriteria(null, null, null, null, null, null, null, null, null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by warehouse
     */
    public List<PackingDto> getByWarehouse(UUID warehouseId) {
        return packingRepository.findByWarehouseId(warehouseId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by location
     */
    public List<PackingDto> getByLocation(UUID locationId) {
        return packingRepository.findByLocationId(locationId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by item
     */
    public List<PackingDto> getByItem(UUID itemId) {
        return packingRepository.findByItemId(itemId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by batch
     */
    public List<PackingDto> getByBatch(UUID batchId) {
        return packingRepository.findByBatchId(batchId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by serial
     */
    public List<PackingDto> getBySerial(UUID serialId) {
        return packingRepository.findBySerialId(serialId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by shipment
     */
    public List<PackingDto> getByShipment(UUID shipmentId) {
        return packingRepository.findByShipmentId(shipmentId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by pick list
     */
    public List<PackingDto> getByPickList(UUID pickListId) {
        return packingRepository.findByPickListId(pickListId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by work order
     */
    public List<PackingDto> getByWorkOrder(String workOrder) {
        return packingRepository.findByWorkOrderIgnoreCase(workOrder).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by status
     */
    public List<PackingDto> getByStatus(Packing.PackingStatus status) {
        return packingRepository.findByStatus(status).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by priority
     */
    public List<PackingDto> getByPriority(Packing.Priority priority) {
        return packingRepository.findByPriority(priority).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by type
     */
    public List<PackingDto> getByType(Packing.PackingType packingType) {
        return packingRepository.findByPackingType(packingType).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings by carton type
     */
    public List<PackingDto> getByCartonType(String cartonType) {
        return packingRepository.findByCartonTypeIgnoreCase(cartonType).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings with unpacked quantity
     */
    public List<PackingDto> getWithUnpackedQuantity() {
        return packingRepository.findPackingsWithUnpackedQuantity().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get packings with unconfirmed quantity
     */
    public List<PackingDto> getWithUnconfirmedQuantity() {
        return packingRepository.findPackingsWithUnconfirmedQuantity().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Update packing status
     */
    public PackingDto updateStatus(String id, Packing.PackingStatus status) {
        Packing packing = packingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Packing not found: " + id));
        
        packing.setStatus(status);
        
        // Update timestamps based on status
        if (status == Packing.PackingStatus.PACKED) {
            packing.setPackedAt(OffsetDateTime.now());
        } else if (status == Packing.PackingStatus.CONFIRMED) {
            packing.setConfirmedAt(OffsetDateTime.now());
        }
        
        Packing saved = packingRepository.save(packing);
        return toDto(saved);
    }
    
    /**
     * Update packing quantities
     */
    public PackingDto updateQuantities(String id, BigDecimal quantityPacked, BigDecimal quantityConfirmed) {
        Packing packing = packingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Packing not found: " + id));
        
        if (quantityPacked != null) {
            packing.setQuantityPacked(quantityPacked);
        }
        
        if (quantityConfirmed != null) {
            packing.setQuantityConfirmed(quantityConfirmed);
        }
        
        // Update status based on quantities
        if (packing.getQuantityConfirmed().compareTo(packing.getQuantityToPack()) >= 0) {
            packing.setStatus(Packing.PackingStatus.CONFIRMED);
            packing.setConfirmedAt(OffsetDateTime.now());
        } else if (packing.getQuantityPacked().compareTo(BigDecimal.ZERO) > 0) {
            packing.setStatus(Packing.PackingStatus.PACKED);
            packing.setPackedAt(OffsetDateTime.now());
        }
        
        Packing saved = packingRepository.save(packing);
        return toDto(saved);
    }
    
    /**
     * Assign packer to packing
     */
    public PackingDto assignPacker(String id, String packer) {
        Packing packing = packingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Packing not found: " + id));
        
        packing.setAssignedTo(packer);
        
        Packing saved = packingRepository.save(packing);
        return toDto(saved);
    }
    
    /**
     * Mark packing as packed by user
     */
    public PackingDto markAsPacked(String id, String packer, BigDecimal quantityPacked) {
        Packing packing = packingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Packing not found: " + id));
        
        packing.setPackedBy(packer);
        if (quantityPacked != null) {
            packing.setQuantityPacked(quantityPacked);
        }
        packing.setStatus(Packing.PackingStatus.PACKED);
        packing.setPackedAt(OffsetDateTime.now());
        
        Packing saved = packingRepository.save(packing);
        return toDto(saved);
    }
    
    /**
     * Confirm packing
     */
    public PackingDto confirm(String id, String confirmer, BigDecimal quantityConfirmed) {
        Packing packing = packingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Packing not found: " + id));
        
        packing.setConfirmedBy(confirmer);
        if (quantityConfirmed != null) {
            packing.setQuantityConfirmed(quantityConfirmed);
        }
        packing.setStatus(Packing.PackingStatus.CONFIRMED);
        packing.setConfirmedAt(OffsetDateTime.now());
        
        Packing saved = packingRepository.save(packing);
        return toDto(saved);
    }
    
    /**
     * Get packing statistics
     */
    public Map<String, Object> getStats() {
        List<Packing> all = packingRepository.findAll();
        long total = all.size();
        long draft = all.stream().filter(p -> p.getStatus() == Packing.PackingStatus.DRAFT).count();
        long open = all.stream().filter(p -> p.getStatus() == Packing.PackingStatus.OPEN).count();
        long packing = all.stream().filter(p -> p.getStatus() == Packing.PackingStatus.PACKING).count();
        long packed = all.stream().filter(p -> p.getStatus() == Packing.PackingStatus.PACKED).count();
        long confirmed = all.stream().filter(p -> p.getStatus() == Packing.PackingStatus.CONFIRMED).count();
        long cancelled = all.stream().filter(p -> p.getStatus() == Packing.PackingStatus.CANCELLED).count();
        long highPriority = all.stream().filter(p -> p.getPriority() == Packing.Priority.HIGH).count();
        long urgent = all.stream().filter(p -> p.getPriority() == Packing.Priority.URGENT).count();
        long individual = all.stream().filter(p -> p.getPackingType() == Packing.PackingType.INDIVIDUAL).count();
        long batch = all.stream().filter(p -> p.getPackingType() == Packing.PackingType.BATCH).count();
        long carton = all.stream().filter(p -> p.getPackingType() == Packing.PackingType.CARTON).count();
        
        // Count by warehouse
        Map<String, Long> byWarehouse = all.stream()
            .filter(p -> p.getWarehouseName() != null)
            .collect(Collectors.groupingBy(Packing::getWarehouseName, Collectors.counting()));
        
        // Count by customer
        Map<String, Long> byCustomer = all.stream()
            .filter(p -> p.getCustomer() != null)
            .collect(Collectors.groupingBy(Packing::getCustomer, Collectors.counting()));
        
        // Calculate completion rate
        double completionRate = total > 0 ? (double) confirmed / total * 100 : 0.0;
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("draft", draft),
            Map.entry("open", open),
            Map.entry("packing", packing),
            Map.entry("packed", packed),
            Map.entry("confirmed", confirmed),
            Map.entry("cancelled", cancelled),
            Map.entry("highPriority", highPriority),
            Map.entry("urgent", urgent),
            Map.entry("individual", individual),
            Map.entry("batch", batch),
            Map.entry("carton", carton),
            Map.entry("completionRate", Math.round(completionRate)),
            Map.entry("byWarehouse", byWarehouse),
            Map.entry("byCustomer", byCustomer)
        );
    }
    
    /**
     * Export packings to CSV format
     */
    public String exportCsv(List<PackingDto> data) {
        String header = "Code,Description,Warehouse,Location,Item,Batch,Serial,Shipment,Pick List,Work Order,Customer,Priority,Status,To Pack,Packed,Confirmed,Type,Carton Type,Carton Code,Carton Qty,Weight,Assigned To,Packed By,Confirmed By";
        String rows = data.stream()
            .map(packing -> String.join(",",
                safe(packing.code()),
                safe(packing.description()),
                safe(packing.warehouseName()),
                safe(packing.locationCode()),
                safe(packing.itemCode()),
                safe(packing.batchCode()),
                safe(packing.serialCode()),
                safe(packing.shipmentCode()),
                safe(packing.pickListCode()),
                safe(packing.workOrder()),
                safe(packing.customer()),
                safe(packing.priority() != null ? packing.priority().toString() : ""),
                safe(packing.status() != null ? packing.status().toString() : ""),
                safe(packing.quantityToPack() != null ? packing.quantityToPack().toString() : ""),
                safe(packing.quantityPacked() != null ? packing.quantityPacked().toString() : ""),
                safe(packing.quantityConfirmed() != null ? packing.quantityConfirmed().toString() : ""),
                safe(packing.packingType() != null ? packing.packingType().toString() : ""),
                safe(packing.cartonType()),
                safe(packing.cartonCode()),
                safe(packing.cartonQuantity() != null ? packing.cartonQuantity().toString() : ""),
                safe(packing.weight() != null ? packing.weight().toString() : ""),
                safe(packing.assignedTo()),
                safe(packing.packedBy()),
                safe(packing.confirmedBy())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Packing not found: " + id);
        }
    }
    
    private static String generatePackingCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "PACK-" + token;
    }
    
    private void validateUniqueConstraints(PackingPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate code
        if (payload.code() != null && !payload.code().isBlank()) {
            boolean exists = packingRepository.existsByCodeIgnoreCaseAndIdNot(payload.code(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Packing code already exists: " + payload.code());
            }
        }
    }
    
    private void applyPayload(Packing target, PackingPayload payload) {
        target.setCode(payload.code());
        target.setDescription(payload.description());
        target.setWarehouseId(payload.warehouseId());
        target.setWarehouseName(payload.warehouseName());
        target.setLocationId(payload.locationId());
        target.setLocationCode(payload.locationCode());
        target.setLocationName(payload.locationName());
        target.setItemId(payload.itemId());
        target.setItemCode(payload.itemCode());
        target.setItemName(payload.itemName());
        target.setBatchId(payload.batchId());
        target.setBatchCode(payload.batchCode());
        target.setSerialId(payload.serialId());
        target.setSerialCode(payload.serialCode());
        target.setShipmentId(payload.shipmentId());
        target.setShipmentCode(payload.shipmentCode());
        target.setWorkOrder(payload.workOrder());
        target.setPickListId(payload.pickListId());
        target.setPickListCode(payload.pickListCode());
        target.setCustomer(payload.customer());
        target.setPriority(payload.priority());
        target.setStatus(payload.status());
        target.setQuantityToPack(payload.quantityToPack());
        target.setQuantityPacked(payload.quantityPacked());
        target.setQuantityConfirmed(payload.quantityConfirmed());
        target.setUnitOfMeasure(payload.unitOfMeasure());
        target.setPackingType(payload.packingType());
        target.setCartonType(payload.cartonType());
        target.setCartonCode(payload.cartonCode());
        target.setCartonQuantity(payload.cartonQuantity());
        target.setWeight(payload.weight());
        target.setWeightUnit(payload.weightUnit());
        target.setDimensionsLength(payload.dimensionsLength());
        target.setDimensionsWidth(payload.dimensionsWidth());
        target.setDimensionsHeight(payload.dimensionsHeight());
        target.setDimensionsUnit(payload.dimensionsUnit());
        target.setAssignedTo(payload.assignedTo());
        target.setPackedBy(payload.packedBy());
        target.setConfirmedBy(payload.confirmedBy());
        target.setNotes(payload.notes());
    }
    
    private PackingDto toDto(Packing packing) {
        return new PackingDto(
            packing.getId().toString(),
            packing.getCode(),
            packing.getDescription(),
            packing.getWarehouseId(),
            packing.getWarehouseName(),
            packing.getLocationId(),
            packing.getLocationCode(),
            packing.getLocationName(),
            packing.getItemId(),
            packing.getItemCode(),
            packing.getItemName(),
            packing.getBatchId(),
            packing.getBatchCode(),
            packing.getSerialId(),
            packing.getSerialCode(),
            packing.getShipmentId(),
            packing.getShipmentCode(),
            packing.getWorkOrder(),
            packing.getPickListId(),
            packing.getPickListCode(),
            packing.getCustomer(),
            packing.getPriority(),
            packing.getStatus(),
            packing.getQuantityToPack(),
            packing.getQuantityPacked(),
            packing.getQuantityConfirmed(),
            packing.getUnitOfMeasure(),
            packing.getPackingType(),
            packing.getCartonType(),
            packing.getCartonCode(),
            packing.getCartonQuantity(),
            packing.getWeight(),
            packing.getWeightUnit(),
            packing.getDimensionsLength(),
            packing.getDimensionsWidth(),
            packing.getDimensionsHeight(),
            packing.getDimensionsUnit(),
            packing.getAssignedTo(),
            packing.getPackedBy(),
            packing.getConfirmedBy(),
            packing.getNotes(),
            safeOffset(packing.getCreatedAt()),
            safeOffset(packing.getUpdatedAt()),
            safeOffset(packing.getPackedAt()),
            safeOffset(packing.getConfirmedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}