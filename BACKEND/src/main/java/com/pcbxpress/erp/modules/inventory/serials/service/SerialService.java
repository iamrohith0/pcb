package com.pcbxpress.erp.modules.inventory.serials.service;

import com.pcbxpress.erp.modules.inventory.serials.dto.SerialDto;
import com.pcbxpress.erp.modules.inventory.serials.dto.SerialPayload;
import com.pcbxpress.erp.modules.inventory.serials.model.Serial;
import com.pcbxpress.erp.modules.inventory.serials.repository.SerialRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for Serial Management
 */
@Service
@Transactional
public class SerialService {
    
    private final SerialRepository serialRepository;
    
    public SerialService(SerialRepository serialRepository) {
        this.serialRepository = serialRepository;
    }
    
    /**
     * Register serials for a work order and lot
     */
    public List<SerialDto> registerSerials(List<String> serialNumbers, String itemId, 
                                         String lotId, String workOrderId) {
        return serialNumbers.stream()
            .map(serialNumber -> createSerial(serialNumber, itemId, lotId, workOrderId))
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single serial by ID
     */
    public SerialDto getById(String id) {
        Serial serial = serialRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Serial not found: " + id));
        return toDto(serial);
    }
    
    /**
     * Search serials
     */
    public List<SerialDto> search(String query, String status, String itemId, String workOrderId) {
        List<Serial> serials = serialRepository.findAll();
        
        // Apply filters
        if (query != null && !query.isBlank()) {
            serials = serials.stream()
                .filter(serial -> matchesQuery(serial, query))
                .collect(Collectors.toList());
        }
        
        if (status != null && !status.isBlank()) {
            Serial.SerialStatus serialStatus = Serial.SerialStatus.valueOf(status.toUpperCase());
            serials = serials.stream()
                .filter(serial -> serial.getStatus() == serialStatus)
                .collect(Collectors.toList());
        }
        
        if (itemId != null && !itemId.isBlank()) {
            UUID itemUUID = UUID.fromString(itemId);
            serials = serials.stream()
                .filter(serial -> serial.getItemId().equals(itemUUID))
                .collect(Collectors.toList());
        }
        
        if (workOrderId != null && !workOrderId.isBlank()) {
            UUID workOrderUUID = UUID.fromString(workOrderId);
            serials = serials.stream()
                .filter(serial -> serial.getWorkOrderId() != null && serial.getWorkOrderId().equals(workOrderUUID))
                .collect(Collectors.toList());
        }
        
        return serials.stream()
            .sorted(Comparator.comparing(Serial::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get serial history
     */
    public List<Map<String, Object>> getHistory(String id, int limit) {
        Serial serial = serialRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Serial not found: " + id));
        
        // This would typically query a separate history table
        // For now, return basic serial information
        return List.of(Map.of(
            "serialId", serial.getId(),
            "serialNumber", serial.getSerialNumber(),
            "status", serial.getStatus(),
            "currentLocation", serial.getCurrentLocation(),
            "currentWorkOrderId", serial.getCurrentWorkOrderId(),
            "updatedAt", serial.getUpdatedAt()
        ));
    }
    
    /**
     * Get serial genealogy
     */
    public Map<String, Object> getGenealogy(String id) {
        Serial serial = serialRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Serial not found: " + id));
        
        // Get parent serial
        Serial parentSerial = null;
        if (serial.getParentSerialId() != null) {
            parentSerial = serialRepository.findById(serial.getParentSerialId()).orElse(null);
        }
        
        // Get child serials
        List<Serial> childSerials = serialRepository.findByParentSerialId(serial.getId());
        
        return Map.of(
            "serial", toDto(serial),
            "parentSerial", parentSerial != null ? toDto(parentSerial) : null,
            "childSerials", childSerials.stream().map(this::toDto).collect(Collectors.toList()),
            "hasParent", parentSerial != null,
            "childCount", childSerials.size()
        );
    }
    
    /**
     * Update serial status
     */
    public SerialDto updateStatus(String id, String status) {
        Serial serial = serialRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Serial not found: " + id));
        
        Serial.SerialStatus serialStatus = Serial.SerialStatus.valueOf(status.toUpperCase());
        serial.setStatus(serialStatus);
        
        // Update quality status based on serial status
        if (serialStatus == Serial.SerialStatus.QUARANTINE) {
            serial.setQualityStatus(Serial.QualityStatus.QUARANTINE);
        } else if (serialStatus == Serial.SerialStatus.SCRAPPED || serialStatus == Serial.SerialStatus.EXPIRED) {
            serial.setQualityStatus(Serial.QualityStatus.FAILED);
        }
        
        Serial saved = serialRepository.save(serial);
        return toDto(saved);
    }
    
    /**
     * Link serial to lot
     */
    public SerialDto linkToLot(String serialId, String lotId) {
        Serial serial = serialRepository.findById(UUID.fromString(serialId))
            .orElseThrow(() -> new NoSuchElementException("Serial not found: " + serialId));
        
        serial.setLotId(UUID.fromString(lotId));
        Serial saved = serialRepository.save(serial);
        return toDto(saved);
    }
    
    /**
     * Link serial to work order
     */
    public SerialDto linkToWorkOrder(String serialId, String workOrderId) {
        Serial serial = serialRepository.findById(UUID.fromString(serialId))
            .orElseThrow(() -> new NoSuchElementException("Serial not found: " + serialId));
        
        serial.setWorkOrderId(UUID.fromString(workOrderId));
        serial.setCurrentWorkOrderId(UUID.fromString(workOrderId));
        serial.setStatus(Serial.SerialStatus.ASSIGNED);
        
        Serial saved = serialRepository.save(serial);
        return toDto(saved);
    }
    
    /**
     * Get serials by work order
     */
    public List<SerialDto> getByWorkOrder(String workOrderId, int limit) {
        List<Serial> serials = serialRepository.findByWorkOrderId(UUID.fromString(workOrderId));
        return serials.stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get serials by lot
     */
    public List<SerialDto> getByLot(String lotId, int limit) {
        List<Serial> serials = serialRepository.findByLotId(UUID.fromString(lotId));
        return serials.stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Validate serial format
     */
    public Map<String, Object> validateSerial(String serial) {
        // Basic validation - in a real system, this would have more complex rules
        boolean isValid = serial != null && !serial.trim().isEmpty() && serial.length() >= 3;
        
        return Map.of(
            "serial", serial,
            "isValid", isValid,
            "message", isValid ? "Serial format is valid" : "Serial format is invalid"
        );
    }
    
    /**
     * Get serial statistics
     */
    public Map<String, Object> getStats() {
        List<Serial> all = serialRepository.findAll();
        long total = all.size();
        long available = all.stream().filter(s -> s.getStatus() == Serial.SerialStatus.AVAILABLE).count();
        long assigned = all.stream().filter(s -> s.getStatus() == Serial.SerialStatus.ASSIGNED).count();
        long inUse = all.stream().filter(s -> s.getStatus() == Serial.SerialStatus.IN_USE).count();
        long repaired = all.stream().filter(s -> s.getStatus() == Serial.SerialStatus.REPAIRED).count();
        long scrapped = all.stream().filter(s -> s.getStatus() == Serial.SerialStatus.SCRAPPED).count();
        
        return Map.of(
            "total", total,
            "available", available,
            "assigned", assigned,
            "inUse", inUse,
            "repaired", repaired,
            "scrapped", scrapped,
            "avgAge", calculateAverageAge(all)
        );
    }
    
    // Private helper methods
    
    private SerialDto createSerial(String serialNumber, String itemId, String lotId, String workOrderId) {
        // Validate unique constraints
        Serial existing = serialRepository.findBySerialNumber(serialNumber);
        if (existing != null) {
            throw new IllegalArgumentException("Serial number already exists: " + serialNumber);
        }
        
        Serial serial = new Serial();
        serial.setId(UUID.randomUUID());
        serial.setSerialNumber(serialNumber);
        serial.setItemId(UUID.fromString(itemId));
        
        if (lotId != null && !lotId.isBlank()) {
            serial.setLotId(UUID.fromString(lotId));
        }
        
        if (workOrderId != null && !workOrderId.isBlank()) {
            serial.setWorkOrderId(UUID.fromString(workOrderId));
            serial.setCurrentWorkOrderId(UUID.fromString(workOrderId));
            serial.setStatus(Serial.SerialStatus.ASSIGNED);
        } else {
            serial.setStatus(Serial.SerialStatus.AVAILABLE);
        }
        
        serial.setReceivedDate(OffsetDateTime.now());
        serial.setManufactureDate(OffsetDateTime.now());
        
        Serial saved = serialRepository.save(serial);
        return toDto(saved);
    }
    
    private SerialDto toDto(Serial serial) {
        return new SerialDto(
            serial.getId().toString(),
            serial.getSerialNumber(),
            serial.getItemId().toString(),
            serial.getLotId() != null ? serial.getLotId().toString() : null,
            serial.getWorkOrderId() != null ? serial.getWorkOrderId().toString() : null,
            serial.getReceivedDate(),
            serial.getManufactureDate(),
            serial.getExpirationDate(),
            serial.getStatus(),
            serial.getStorageLocation(),
            serial.getParentSerialId() != null ? serial.getParentSerialId().toString() : null,
            serial.getChildSerialIds(),
            serial.getCurrentLocation(),
            serial.getCurrentWarehouseId() != null ? serial.getCurrentWarehouseId().toString() : null,
            serial.getCurrentWorkOrderId() != null ? serial.getCurrentWorkOrderId().toString() : null,
            serial.getQualityStatus(),
            serial.getQuarantineReason(),
            serial.getTestResults(),
            serial.getRepairHistory(),
            serial.getWarrantyExpiryDate(),
            serial.getNotes(),
            serial.getCreatedAt(),
            serial.getUpdatedAt()
        );
    }
    
    private boolean matchesQuery(Serial serial, String query) {
        String q = query.toLowerCase();
        return contains(serial.getSerialNumber(), q)
            || contains(serial.getCurrentLocation(), q)
            || contains(serial.getStorageLocation(), q)
            || contains(serial.getTestResults(), q);
    }
    
    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }
    
    private double calculateAverageAge(List<Serial> serials) {
        if (serials.isEmpty()) return 0.0;
        
        long totalDays = serials.stream()
            .filter(serial -> serial.getReceivedDate() != null)
            .mapToLong(serial -> java.time.Duration.between(serial.getReceivedDate(), OffsetDateTime.now()).toDays())
            .sum();
        
        return (double) totalDays / serials.size();
    }
}