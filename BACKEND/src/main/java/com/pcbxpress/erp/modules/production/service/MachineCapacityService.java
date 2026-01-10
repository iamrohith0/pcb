package com.pcbxpress.erp.modules.production.service;

import com.pcbxpress.erp.modules.production.dto.MachineCapacityDto;
import com.pcbxpress.erp.modules.production.dto.MachineCapacityPayload;
import com.pcbxpress.erp.modules.production.model.MachineCapacity;
import com.pcbxpress.erp.modules.production.repository.MachineCapacityRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
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
 * Service for managing Machine Capacity
 */
@Service
@Transactional
public class MachineCapacityService {
    
    private final MachineCapacityRepository machineCapacityRepository;
    
    public MachineCapacityService(MachineCapacityRepository machineCapacityRepository) {
        this.machineCapacityRepository = machineCapacityRepository;
    }
    
    /**
     * List machine capacities with optional filters
     */
    public List<MachineCapacityDto> list(String query, String machineId, String machineType, LocalDate date, MachineCapacity.Shift shift, MachineCapacity.Status status, String workOrderId, String operationId) {
        return machineCapacityRepository.findByCriteria(
            machineId != null ? UUID.fromString(machineId) : null,
            machineType,
            date,
            shift,
            status,
            workOrderId != null ? UUID.fromString(workOrderId) : null,
            operationId != null ? UUID.fromString(operationId) : null
        ).stream()
            .sorted(Comparator.comparing(MachineCapacity::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single machine capacity by ID
     */
    public MachineCapacityDto get(String id) {
        MachineCapacity machineCapacity = machineCapacityRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Machine capacity not found: " + id));
        return toDto(machineCapacity);
    }
    
    /**
     * Create a new machine capacity
     */
    public MachineCapacityDto create(MachineCapacityPayload payload) {
        MachineCapacity machineCapacity = new MachineCapacity();
        machineCapacity.setId(UUID.randomUUID());
        applyPayload(machineCapacity, payload);
        
        // Calculate utilization percentage if available hours and planned hours are provided
        if (machineCapacity.getAvailableHours() != null && machineCapacity.getPlannedHours() != null && 
            machineCapacity.getPlannedHours().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal utilization = machineCapacity.getAvailableHours()
                .divide(machineCapacity.getPlannedHours(), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            machineCapacity.setUtilizationPercentage(utilization.setScale(2, BigDecimal.ROUND_HALF_UP));
        }
        
        // Calculate OEE overall if all components are available
        if (machineCapacity.getOeeAvailability() != null && machineCapacity.getOeePerformance() != null && 
            machineCapacity.getOeeQuality() != null) {
            BigDecimal oeeOverall = machineCapacity.getOeeAvailability()
                .multiply(machineCapacity.getOeePerformance())
                .multiply(machineCapacity.getOeeQuality())
                .divide(BigDecimal.valueOf(10000), 4, BigDecimal.ROUND_HALF_UP);
            machineCapacity.setOeeOverall(oeeOverall.setScale(2, BigDecimal.ROUND_HALF_UP));
        }
        
        MachineCapacity saved = machineCapacityRepository.save(machineCapacity);
        return toDto(saved);
    }
    
    /**
     * Update an existing machine capacity
     */
    public MachineCapacityDto update(String id, MachineCapacityPayload payload) {
        MachineCapacity existing = machineCapacityRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Machine capacity not found: " + id));
        
        applyPayload(existing, payload);
        
        // Recalculate utilization percentage if available hours and planned hours are provided
        if (existing.getAvailableHours() != null && existing.getPlannedHours() != null && 
            existing.getPlannedHours().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal utilization = existing.getAvailableHours()
                .divide(existing.getPlannedHours(), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            existing.setUtilizationPercentage(utilization.setScale(2, BigDecimal.ROUND_HALF_UP));
        }
        
        // Recalculate OEE overall if all components are available
        if (existing.getOeeAvailability() != null && existing.getOeePerformance() != null && 
            existing.getOeeQuality() != null) {
            BigDecimal oeeOverall = existing.getOeeAvailability()
                .multiply(existing.getOeePerformance())
                .multiply(existing.getOeeQuality())
                .divide(BigDecimal.valueOf(10000), 4, BigDecimal.ROUND_HALF_UP);
            existing.setOeeOverall(oeeOverall.setScale(2, BigDecimal.ROUND_HALF_UP));
        }
        
        MachineCapacity saved = machineCapacityRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a machine capacity
     */
    public void delete(String id) {
        machineCapacityRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple machine capacities
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(MachineCapacityService::parseId).collect(Collectors.toList());
        machineCapacityRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search machine capacities by query
     */
    public List<MachineCapacityDto> search(String query) {
        return machineCapacityRepository.findByCriteria(null, null, null, null, null, null, null).stream()
            .filter(m -> query == null || query.isBlank() || 
                (m.getMachineName() != null && m.getMachineName().toLowerCase().contains(query.toLowerCase())) ||
                (m.getMachineType() != null && m.getMachineType().toLowerCase().contains(query.toLowerCase())))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity by machine ID and date
     */
    public List<MachineCapacityDto> findByMachineAndDate(String machineId, LocalDate date) {
        return machineCapacityRepository.findByMachineIdAndDate(UUID.fromString(machineId), date).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity by date and shift
     */
    public List<MachineCapacityDto> findByDateAndShift(LocalDate date, MachineCapacity.Shift shift) {
        return machineCapacityRepository.findByDateAndShift(date, shift).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity by machine ID and date range
     */
    public List<MachineCapacityDto> findByMachineAndDateRange(String machineId, LocalDate startDate, LocalDate endDate) {
        return machineCapacityRepository.findByMachineIdAndDateBetween(UUID.fromString(machineId), startDate, endDate).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity by status
     */
    public List<MachineCapacityDto> findByStatus(MachineCapacity.Status status) {
        return machineCapacityRepository.findByStatus(status).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity by work order ID
     */
    public List<MachineCapacityDto> findByWorkOrder(String workOrderId) {
        return machineCapacityRepository.findByWorkOrderId(UUID.fromString(workOrderId)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity by operation ID
     */
    public List<MachineCapacityDto> findByOperation(String operationId) {
        return machineCapacityRepository.findByOperationId(UUID.fromString(operationId)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity with high utilization
     */
    public List<MachineCapacityDto> findHighUtilizationMachines() {
        return machineCapacityRepository.findHighUtilizationMachines(80.0).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity with low utilization
     */
    public List<MachineCapacityDto> findLowUtilizationMachines() {
        return machineCapacityRepository.findLowUtilizationMachines(30.0).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity with high downtime
     */
    public List<MachineCapacityDto> findHighDowntimeMachines() {
        return machineCapacityRepository.findHighDowntimeMachines(60.0).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get machine capacity statistics
     */
    public Map<String, Object> getStats() {
        List<MachineCapacity> all = machineCapacityRepository.findAll();
        long total = all.size();
        
        // Count by status
        Map<MachineCapacity.Status, Long> byStatus = all.stream()
            .collect(Collectors.groupingBy(MachineCapacity::getStatus, Collectors.counting()));
        
        // Count by machine type
        Map<String, Long> byMachineType = all.stream()
            .filter(m -> m.getMachineType() != null)
            .collect(Collectors.groupingBy(MachineCapacity::getMachineType, Collectors.counting()));
        
        // Count by shift
        Map<MachineCapacity.Shift, Long> byShift = all.stream()
            .collect(Collectors.groupingBy(MachineCapacity::getShift, Collectors.counting()));
        
        // Calculate average utilization
        BigDecimal avgUtilization = all.stream()
            .map(m -> m.getUtilizationPercentage() != null ? m.getUtilizationPercentage() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (total > 0) {
            avgUtilization = avgUtilization.divide(BigDecimal.valueOf(total), 2, BigDecimal.ROUND_HALF_UP);
        }
        
        // Calculate average OEE
        BigDecimal avgOEE = all.stream()
            .map(m -> m.getOeeOverall() != null ? m.getOeeOverall() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (total > 0) {
            avgOEE = avgOEE.divide(BigDecimal.valueOf(total), 2, BigDecimal.ROUND_HALF_UP);
        }
        
        // Calculate total planned and available hours
        BigDecimal totalPlannedHours = all.stream()
            .map(m -> m.getPlannedHours() != null ? m.getPlannedHours() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalAvailableHours = all.stream()
            .map(m -> m.getAvailableHours() != null ? m.getAvailableHours() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calculate total downtime
        BigDecimal totalDowntime = all.stream()
            .map(m -> m.getDowntimeMinutes() != null ? m.getDowntimeMinutes() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("byStatus", byStatus),
            Map.entry("byMachineType", byMachineType),
            Map.entry("byShift", byShift),
            Map.entry("avgUtilization", avgUtilization),
            Map.entry("avgOEE", avgOEE),
            Map.entry("totalPlannedHours", totalPlannedHours),
            Map.entry("totalAvailableHours", totalAvailableHours),
            Map.entry("totalDowntime", totalDowntime)
        );
    }
    
    /**
     * Export machine capacities to CSV format
     */
    public String exportCsv(List<MachineCapacityDto> data) {
        String header = "Machine Name,Machine Type,Date,Shift,Planned Hours,Available Hours,Utilization %,Status,Assigned Quantity,Completed Quantity,Setup Time,Downtime,OEE Availability,OEE Performance,OEE Quality,OEE Overall";
        String rows = data.stream()
            .map(machine -> String.join(",",
                safe(machine.machineName()),
                safe(machine.machineType()),
                safe(machine.date() != null ? machine.date().toString() : ""),
                safe(machine.shift() != null ? machine.shift().toString() : ""),
                safe(machine.plannedHours() != null ? machine.plannedHours().toString() : ""),
                safe(machine.availableHours() != null ? machine.availableHours().toString() : ""),
                safe(machine.utilizationPercentage() != null ? machine.utilizationPercentage().toString() : ""),
                safe(machine.status() != null ? machine.status().toString() : ""),
                safe(machine.assignedQuantity() != null ? machine.assignedQuantity().toString() : ""),
                safe(machine.completedQuantity() != null ? machine.completedQuantity().toString() : ""),
                safe(machine.setupTimeMinutes() != null ? machine.setupTimeMinutes().toString() : ""),
                safe(machine.downtimeMinutes() != null ? machine.downtimeMinutes().toString() : ""),
                safe(machine.oeeAvailability() != null ? machine.oeeAvailability().toString() : ""),
                safe(machine.oeePerformance() != null ? machine.oeePerformance().toString() : ""),
                safe(machine.oeeQuality() != null ? machine.oeeQuality().toString() : ""),
                safe(machine.oeeOverall() != null ? machine.oeeOverall().toString() : "")
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Machine capacity not found: " + id);
        }
    }
    
    private void applyPayload(MachineCapacity target, MachineCapacityPayload payload) {
        target.setMachineId(payload.machineId() != null ? UUID.fromString(payload.machineId()) : null);
        target.setMachineName(payload.machineName());
        target.setMachineType(payload.machineType());
        target.setDate(payload.date());
        target.setShift(payload.shift());
        target.setShiftStart(payload.shiftStart());
        target.setShiftEnd(payload.shiftEnd());
        target.setPlannedHours(payload.plannedHours());
        target.setAvailableHours(payload.availableHours());
        target.setUtilizationPercentage(payload.utilizationPercentage());
        target.setStatus(payload.status());
        target.setWorkOrderId(payload.workOrderId() != null ? UUID.fromString(payload.workOrderId()) : null);
        target.setOperationId(payload.operationId() != null ? UUID.fromString(payload.operationId()) : null);
        target.setAssignedQuantity(payload.assignedQuantity());
        target.setCompletedQuantity(payload.completedQuantity());
        target.setSetupTimeMinutes(payload.setupTimeMinutes());
        target.setDowntimeMinutes(payload.downtimeMinutes());
        target.setMaintenanceHours(payload.maintenanceHours());
        target.setBreakdownHours(payload.breakdownHours());
        target.setOeeAvailability(payload.oeeAvailability());
        target.setOeePerformance(payload.oeePerformance());
        target.setOeeQuality(payload.oeeQuality());
        target.setOeeOverall(payload.oeeOverall());
        target.setCapacityNotes(payload.capacityNotes());
        target.setMaintenanceNotes(payload.maintenanceNotes());
        target.setPerformanceNotes(payload.performanceNotes());
    }
    
    private MachineCapacityDto toDto(MachineCapacity machineCapacity) {
        return new MachineCapacityDto(
            machineCapacity.getId().toString(),
            machineCapacity.getMachineId() != null ? machineCapacity.getMachineId().toString() : null,
            machineCapacity.getMachineName(),
            machineCapacity.getMachineType(),
            machineCapacity.getDate(),
            machineCapacity.getShift(),
            machineCapacity.getShiftStart(),
            machineCapacity.getShiftEnd(),
            machineCapacity.getPlannedHours(),
            machineCapacity.getAvailableHours(),
            machineCapacity.getUtilizationPercentage(),
            machineCapacity.getStatus(),
            machineCapacity.getWorkOrderId() != null ? machineCapacity.getWorkOrderId().toString() : null,
            machineCapacity.getOperationId() != null ? machineCapacity.getOperationId().toString() : null,
            machineCapacity.getAssignedQuantity(),
            machineCapacity.getCompletedQuantity(),
            machineCapacity.getSetupTimeMinutes(),
            machineCapacity.getDowntimeMinutes(),
            machineCapacity.getMaintenanceHours(),
            machineCapacity.getBreakdownHours(),
            machineCapacity.getOeeAvailability(),
            machineCapacity.getOeePerformance(),
            machineCapacity.getOeeQuality(),
            machineCapacity.getOeeOverall(),
            machineCapacity.getCapacityNotes(),
            machineCapacity.getMaintenanceNotes(),
            machineCapacity.getPerformanceNotes(),
            safeOffset(machineCapacity.getCreatedAt()),
            safeOffset(machineCapacity.getUpdatedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}