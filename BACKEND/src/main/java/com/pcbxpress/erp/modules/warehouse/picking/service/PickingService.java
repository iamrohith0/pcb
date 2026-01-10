package com.pcbxpress.erp.modules.warehouse.picking.service;

import com.pcbxpress.erp.modules.warehouse.picking.dto.PickingDto;
import com.pcbxpress.erp.modules.warehouse.picking.dto.PickingPayload;
import com.pcbxpress.erp.modules.warehouse.picking.model.Picking;
import com.pcbxpress.erp.modules.warehouse.picking.repository.PickingRepository;
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
 * Service for managing Pickings
 */
@Service
@Transactional
public class PickingService {
    
    private final PickingRepository pickingRepository;
    
    public PickingService(PickingRepository pickingRepository) {
        this.pickingRepository = pickingRepository;
    }
    
    /**
     * List pickings with optional filters
     */
    public List<PickingDto> list(String query, UUID warehouseId, UUID locationId, UUID itemId, 
                               UUID batchId, UUID serialId, UUID shipmentId, String workOrder,
                               Picking.PickingStatus status, Picking.Priority priority, 
                               Picking.PickingType pickingType) {
        return pickingRepository.findByCriteria(warehouseId, locationId, itemId, batchId, serialId, 
            shipmentId, workOrder, status, priority, pickingType, query).stream()
            .sorted(Comparator.comparing(Picking::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single picking by ID
     */
    public PickingDto get(String id) {
        Picking picking = pickingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Picking not found: " + id));
        return toDto(picking);
    }
    
    /**
     * Create a new picking
     */
    public PickingDto create(PickingPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Picking picking = new Picking();
        picking.setId(UUID.randomUUID());
        applyPayload(picking, payload);
        
        // Auto-generate code if not provided
        if (picking.getCode() == null || picking.getCode().isBlank()) {
            picking.setCode(generatePickingCode());
        }
        
        // Set default values
        if (picking.getStatus() == null) {
            picking.setStatus(Picking.PickingStatus.DRAFT);
        }
        
        if (picking.getPriority() == null) {
            picking.setPriority(Picking.Priority.NORMAL);
        }
        
        if (picking.getPickingType() == null) {
            picking.setPickingType(Picking.PickingType.MANUAL);
        }
        
        // Initialize quantities if not provided
        if (picking.getQuantityRequested() == null) {
            picking.setQuantityRequested(BigDecimal.ZERO);
        }
        if (picking.getQuantityPicked() == null) {
            picking.setQuantityPicked(BigDecimal.ZERO);
        }
        if (picking.getQuantityConfirmed() == null) {
            picking.setQuantityConfirmed(BigDecimal.ZERO);
        }
        
        Picking saved = pickingRepository.save(picking);
        return toDto(saved);
    }
    
    /**
     * Update an existing picking
     */
    public PickingDto update(String id, PickingPayload payload) {
        Picking existing = pickingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Picking not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Picking saved = pickingRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a picking
     */
    public void delete(String id) {
        pickingRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple pickings
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(PickingService::parseId).collect(Collectors.toList());
        pickingRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search pickings by query
     */
    public List<PickingDto> search(String query) {
        return pickingRepository.findByCriteria(null, null, null, null, null, null, null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by warehouse
     */
    public List<PickingDto> getByWarehouse(UUID warehouseId) {
        return pickingRepository.findByWarehouseId(warehouseId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by location
     */
    public List<PickingDto> getByLocation(UUID locationId) {
        return pickingRepository.findByLocationId(locationId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by item
     */
    public List<PickingDto> getByItem(UUID itemId) {
        return pickingRepository.findByItemId(itemId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by batch
     */
    public List<PickingDto> getByBatch(UUID batchId) {
        return pickingRepository.findByBatchId(batchId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by serial
     */
    public List<PickingDto> getBySerial(UUID serialId) {
        return pickingRepository.findBySerialId(serialId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by shipment
     */
    public List<PickingDto> getByShipment(UUID shipmentId) {
        return pickingRepository.findByShipmentId(shipmentId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by work order
     */
    public List<PickingDto> getByWorkOrder(String workOrder) {
        return pickingRepository.findByWorkOrderIgnoreCase(workOrder).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by status
     */
    public List<PickingDto> getByStatus(Picking.PickingStatus status) {
        return pickingRepository.findByStatus(status).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by priority
     */
    public List<PickingDto> getByPriority(Picking.Priority priority) {
        return pickingRepository.findByPriority(priority).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings by type
     */
    public List<PickingDto> getByType(Picking.PickingType pickingType) {
        return pickingRepository.findByPickingType(pickingType).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings with unpicked quantity
     */
    public List<PickingDto> getWithUnpickedQuantity() {
        return pickingRepository.findPickingsWithUnpickedQuantity().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get pickings with unconfirmed quantity
     */
    public List<PickingDto> getWithUnconfirmedQuantity() {
        return pickingRepository.findPickingsWithUnconfirmedQuantity().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Update picking status
     */
    public PickingDto updateStatus(String id, Picking.PickingStatus status) {
        Picking picking = pickingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Picking not found: " + id));
        
        picking.setStatus(status);
        
        // Update timestamps based on status
        if (status == Picking.PickingStatus.PICKED) {
            picking.setPickedAt(OffsetDateTime.now());
        } else if (status == Picking.PickingStatus.CONFIRMED) {
            picking.setConfirmedAt(OffsetDateTime.now());
        }
        
        Picking saved = pickingRepository.save(picking);
        return toDto(saved);
    }
    
    /**
     * Update picking quantities
     */
    public PickingDto updateQuantities(String id, BigDecimal quantityPicked, BigDecimal quantityConfirmed) {
        Picking picking = pickingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Picking not found: " + id));
        
        if (quantityPicked != null) {
            picking.setQuantityPicked(quantityPicked);
        }
        
        if (quantityConfirmed != null) {
            picking.setQuantityConfirmed(quantityConfirmed);
        }
        
        // Update status based on quantities
        if (picking.getQuantityConfirmed().compareTo(picking.getQuantityRequested()) >= 0) {
            picking.setStatus(Picking.PickingStatus.CONFIRMED);
            picking.setConfirmedAt(OffsetDateTime.now());
        } else if (picking.getQuantityPicked().compareTo(BigDecimal.ZERO) > 0) {
            picking.setStatus(Picking.PickingStatus.PICKED);
            picking.setPickedAt(OffsetDateTime.now());
        }
        
        Picking saved = pickingRepository.save(picking);
        return toDto(saved);
    }
    
    /**
     * Assign picker to picking
     */
    public PickingDto assignPicker(String id, String picker) {
        Picking picking = pickingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Picking not found: " + id));
        
        picking.setAssignedTo(picker);
        
        Picking saved = pickingRepository.save(picking);
        return toDto(saved);
    }
    
    /**
     * Mark picking as picked by user
     */
    public PickingDto markAsPicked(String id, String picker, BigDecimal quantityPicked) {
        Picking picking = pickingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Picking not found: " + id));
        
        picking.setPickedBy(picker);
        if (quantityPicked != null) {
            picking.setQuantityPicked(quantityPicked);
        }
        picking.setStatus(Picking.PickingStatus.PICKED);
        picking.setPickedAt(OffsetDateTime.now());
        
        Picking saved = pickingRepository.save(picking);
        return toDto(saved);
    }
    
    /**
     * Confirm picking
     */
    public PickingDto confirm(String id, String confirmer, BigDecimal quantityConfirmed) {
        Picking picking = pickingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Picking not found: " + id));
        
        picking.setConfirmedBy(confirmer);
        if (quantityConfirmed != null) {
            picking.setQuantityConfirmed(quantityConfirmed);
        }
        picking.setStatus(Picking.PickingStatus.CONFIRMED);
        picking.setConfirmedAt(OffsetDateTime.now());
        
        Picking saved = pickingRepository.save(picking);
        return toDto(saved);
    }
    
    /**
     * Get picking statistics
     */
    public Map<String, Object> getStats() {
        List<Picking> all = pickingRepository.findAll();
        long total = all.size();
        long draft = all.stream().filter(p -> p.getStatus() == Picking.PickingStatus.DRAFT).count();
        long open = all.stream().filter(p -> p.getStatus() == Picking.PickingStatus.OPEN).count();
        long picking = all.stream().filter(p -> p.getStatus() == Picking.PickingStatus.PICKING).count();
        long picked = all.stream().filter(p -> p.getStatus() == Picking.PickingStatus.PICKED).count();
        long confirmed = all.stream().filter(p -> p.getStatus() == Picking.PickingStatus.CONFIRMED).count();
        long cancelled = all.stream().filter(p -> p.getStatus() == Picking.PickingStatus.CANCELLED).count();
        long highPriority = all.stream().filter(p -> p.getPriority() == Picking.Priority.HIGH).count();
        long urgent = all.stream().filter(p -> p.getPriority() == Picking.Priority.URGENT).count();
        long manual = all.stream().filter(p -> p.getPickingType() == Picking.PickingType.MANUAL).count();
        long pickToLight = all.stream().filter(p -> p.getPickingType() == Picking.PickingType.PICK_TO_LIGHT).count();
        
        // Count by warehouse
        Map<String, Long> byWarehouse = all.stream()
            .filter(p -> p.getWarehouseName() != null)
            .collect(Collectors.groupingBy(Picking::getWarehouseName, Collectors.counting()));
        
        // Count by customer
        Map<String, Long> byCustomer = all.stream()
            .filter(p -> p.getCustomer() != null)
            .collect(Collectors.groupingBy(Picking::getCustomer, Collectors.counting()));
        
        // Calculate completion rate
        double completionRate = total > 0 ? (double) confirmed / total * 100 : 0.0;
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("draft", draft),
            Map.entry("open", open),
            Map.entry("picking", picking),
            Map.entry("picked", picked),
            Map.entry("confirmed", confirmed),
            Map.entry("cancelled", cancelled),
            Map.entry("highPriority", highPriority),
            Map.entry("urgent", urgent),
            Map.entry("manual", manual),
            Map.entry("pickToLight", pickToLight),
            Map.entry("completionRate", Math.round(completionRate)),
            Map.entry("byWarehouse", byWarehouse),
            Map.entry("byCustomer", byCustomer)
        );
    }
    
    /**
     * Export pickings to CSV format
     */
    public String exportCsv(List<PickingDto> data) {
        String header = "Code,Description,Warehouse,Location,Item,Batch,Serial,Shipment,Work Order,Customer,Priority,Status,Requested,Picked,Confirmed,Type,Assigned To,Picked By,Confirmed By";
        String rows = data.stream()
            .map(picking -> String.join(",",
                safe(picking.code()),
                safe(picking.description()),
                safe(picking.warehouseName()),
                safe(picking.locationCode()),
                safe(picking.itemCode()),
                safe(picking.batchCode()),
                safe(picking.serialCode()),
                safe(picking.shipmentCode()),
                safe(picking.workOrder()),
                safe(picking.customer()),
                safe(picking.priority() != null ? picking.priority().toString() : ""),
                safe(picking.status() != null ? picking.status().toString() : ""),
                safe(picking.quantityRequested() != null ? picking.quantityRequested().toString() : ""),
                safe(picking.quantityPicked() != null ? picking.quantityPicked().toString() : ""),
                safe(picking.quantityConfirmed() != null ? picking.quantityConfirmed().toString() : ""),
                safe(picking.pickingType() != null ? picking.pickingType().toString() : ""),
                safe(picking.assignedTo()),
                safe(picking.pickedBy()),
                safe(picking.confirmedBy())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Picking not found: " + id);
        }
    }
    
    private static String generatePickingCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "PICK-" + token;
    }
    
    private void validateUniqueConstraints(PickingPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate code
        if (payload.code() != null && !payload.code().isBlank()) {
            boolean exists = pickingRepository.existsByCodeIgnoreCaseAndIdNot(payload.code(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Picking code already exists: " + payload.code());
            }
        }
    }
    
    private void applyPayload(Picking target, PickingPayload payload) {
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
        target.setCustomer(payload.customer());
        target.setPriority(payload.priority());
        target.setStatus(payload.status());
        target.setQuantityRequested(payload.quantityRequested());
        target.setQuantityPicked(payload.quantityPicked());
        target.setQuantityConfirmed(payload.quantityConfirmed());
        target.setUnitOfMeasure(payload.unitOfMeasure());
        target.setPickingType(payload.pickingType());
        target.setAssignedTo(payload.assignedTo());
        target.setPickedBy(payload.pickedBy());
        target.setConfirmedBy(payload.confirmedBy());
        target.setNotes(payload.notes());
    }
    
    private PickingDto toDto(Picking picking) {
        return new PickingDto(
            picking.getId().toString(),
            picking.getCode(),
            picking.getDescription(),
            picking.getWarehouseId(),
            picking.getWarehouseName(),
            picking.getLocationId(),
            picking.getLocationCode(),
            picking.getLocationName(),
            picking.getItemId(),
            picking.getItemCode(),
            picking.getItemName(),
            picking.getBatchId(),
            picking.getBatchCode(),
            picking.getSerialId(),
            picking.getSerialCode(),
            picking.getShipmentId(),
            picking.getShipmentCode(),
            picking.getWorkOrder(),
            picking.getCustomer(),
            picking.getPriority(),
            picking.getStatus(),
            picking.getQuantityRequested(),
            picking.getQuantityPicked(),
            picking.getQuantityConfirmed(),
            picking.getUnitOfMeasure(),
            picking.getPickingType(),
            picking.getAssignedTo(),
            picking.getPickedBy(),
            picking.getConfirmedBy(),
            picking.getNotes(),
            safeOffset(picking.getCreatedAt()),
            safeOffset(picking.getUpdatedAt()),
            safeOffset(picking.getPickedAt()),
            safeOffset(picking.getConfirmedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}