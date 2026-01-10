package com.pcbxpress.erp.modules.production.service;

import com.pcbxpress.erp.modules.production.dto.OperationDto;
import com.pcbxpress.erp.modules.production.dto.OperationPayload;
import com.pcbxpress.erp.modules.production.model.Operation;
import com.pcbxpress.erp.modules.production.repository.OperationRepository;
import java.math.BigDecimal;
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
 * Service for managing Operations
 */
@Service
@Transactional
public class OperationService {
    
    private final OperationRepository operationRepository;
    
    public OperationService(OperationRepository operationRepository) {
        this.operationRepository = operationRepository;
    }
    
    /**
     * List operations with optional filters
     */
    public List<OperationDto> list(String query, String routingId, Operation.OperationType operationType, String machineType, Boolean isCritical, Boolean isInspection) {
        return operationRepository.findByCriteria(
            routingId != null ? UUID.fromString(routingId) : null,
            operationType,
            machineType,
            isCritical,
            isInspection,
            query
        ).stream()
            .sorted(Comparator.comparing(Operation::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single operation by ID
     */
    public OperationDto get(String id) {
        Operation operation = operationRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Operation not found: " + id));
        return toDto(operation);
    }
    
    /**
     * Create a new operation
     */
    public OperationDto create(OperationPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Operation operation = new Operation();
        operation.setId(UUID.randomUUID());
        applyPayload(operation, payload);
        
        // Auto-generate operation code if not provided
        if (operation.getOperationCode() == null || operation.getOperationCode().isBlank()) {
            operation.setOperationCode(generateOperationCode());
        }
        
        // Set default values
        if (operation.getSequenceNumber() == null) {
            operation.setSequenceNumber(1);
        }
        
        if (operation.isCritical() == false) {
            operation.setCritical(false);
        }
        
        if (operation.isInspection() == false) {
            operation.setInspection(false);
        }
        
        if (operation.requiresTooling() == false) {
            operation.setRequiresTooling(false);
        }
        
        Operation saved = operationRepository.save(operation);
        return toDto(saved);
    }
    
    /**
     * Update an existing operation
     */
    public OperationDto update(String id, OperationPayload payload) {
        Operation existing = operationRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Operation not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Operation saved = operationRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete an operation
     */
    public void delete(String id) {
        operationRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple operations
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(OperationService::parseId).collect(Collectors.toList());
        operationRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search operations by query
     */
    public List<OperationDto> search(String query) {
        return operationRepository.findByCriteria(null, null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get operations by routing ID ordered by sequence
     */
    public List<OperationDto> findByRoutingIdOrdered(String routingId) {
        return operationRepository.findByRoutingIdOrderBySequenceNumberAsc(UUID.fromString(routingId)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get operations by machine type
     */
    public List<OperationDto> findByMachineType(String machineType) {
        return operationRepository.findByMachineTypeIgnoreCase(machineType).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get critical operations
     */
    public List<OperationDto> findCritical() {
        return operationRepository.findByIsCritical(true).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get inspection operations
     */
    public List<OperationDto> findInspection() {
        return operationRepository.findByIsInspection(true).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get operations requiring tooling
     */
    public List<OperationDto> findRequiringTooling() {
        return operationRepository.findByRequiresTooling(true).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get operation statistics
     */
    public Map<String, Object> getStats() {
        List<Operation> all = operationRepository.findAll();
        long total = all.size();
        
        // Count by operation type
        Map<Operation.OperationType, Long> byType = all.stream()
            .collect(Collectors.groupingBy(Operation::getOperationType, Collectors.counting()));
        
        // Count by machine type
        Map<String, Long> byMachineType = all.stream()
            .filter(o -> o.getMachineType() != null)
            .collect(Collectors.groupingBy(Operation::getMachineType, Collectors.counting()));
        
        // Count critical vs non-critical
        long critical = all.stream().filter(Operation::isCritical).count();
        long nonCritical = all.stream().filter(o -> !o.isCritical()).count();
        
        // Count inspection vs non-inspection
        long inspection = all.stream().filter(Operation::isInspection).count();
        long nonInspection = all.stream().filter(o -> !o.isInspection()).count();
        
        // Count tooling vs non-tooling
        long requiringTooling = all.stream().filter(Operation::requiresTooling).count();
        long notRequiringTooling = all.stream().filter(o -> !o.requiresTooling()).count();
        
        // Calculate total estimated time and cost
        BigDecimal totalEstimatedTime = all.stream()
            .map(o -> o.getEstimatedTime() != null ? o.getEstimatedTime() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalEstimatedCost = all.stream()
            .map(o -> o.getEstimatedCost() != null ? o.getEstimatedCost() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("byType", byType),
            Map.entry("byMachineType", byMachineType),
            Map.entry("critical", critical),
            Map.entry("nonCritical", nonCritical),
            Map.entry("inspection", inspection),
            Map.entry("nonInspection", nonInspection),
            Map.entry("requiringTooling", requiringTooling),
            Map.entry("notRequiringTooling", notRequiringTooling),
            Map.entry("totalEstimatedTime", totalEstimatedTime),
            Map.entry("totalEstimatedCost", totalEstimatedCost)
        );
    }
    
    /**
     * Export operations to CSV format
     */
    public String exportCsv(List<OperationDto> data) {
        String header = "Operation Code,Sequence,Description,Type,Machine Type,Estimated Time,Setup Time,Cycle Time,Estimated Cost,Labor Rate,Machine Rate,Critical,Inspection,Requires Tooling";
        String rows = data.stream()
            .map(operation -> String.join(",",
                safe(operation.operationCode()),
                safe(operation.sequenceNumber() != null ? operation.sequenceNumber().toString() : ""),
                safe(operation.description()),
                safe(operation.operationType() != null ? operation.operationType().toString() : ""),
                safe(operation.machineType()),
                safe(operation.estimatedTime() != null ? operation.estimatedTime().toString() : ""),
                safe(operation.setupTime() != null ? operation.setupTime().toString() : ""),
                safe(operation.cycleTime() != null ? operation.cycleTime().toString() : ""),
                safe(operation.estimatedCost() != null ? operation.estimatedCost().toString() : ""),
                safe(operation.laborRate() != null ? operation.laborRate().toString() : ""),
                safe(operation.machineRate() != null ? operation.machineRate().toString() : ""),
                operation.isCritical() ? "Yes" : "No",
                operation.isInspection() ? "Yes" : "No",
                operation.requiresTooling() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Operation not found: " + id);
        }
    }
    
    private static String generateOperationCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "OP-" + token;
    }
    
    private void validateUniqueConstraints(OperationPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate operation code
        if (payload.operationCode() != null && !payload.operationCode().isBlank()) {
            Operation existing = operationRepository.findByOperationCodeIgnoreCase(payload.operationCode());
            if (existing != null && !existing.getId().equals(existingUUID)) {
                throw new IllegalArgumentException("Operation code already exists: " + payload.operationCode());
            }
        }
    }
    
    private void applyPayload(Operation target, OperationPayload payload) {
        target.setOperationCode(payload.operationCode());
        target.setRoutingId(payload.routingId() != null ? UUID.fromString(payload.routingId()) : null);
        target.setSequenceNumber(payload.sequenceNumber());
        target.setDescription(payload.description());
        target.setOperationType(payload.operationType());
        target.setMachineType(payload.machineType());
        target.setMachineId(payload.machineId() != null ? UUID.fromString(payload.machineId()) : null);
        target.setEstimatedTime(payload.estimatedTime());
        target.setSetupTime(payload.setupTime());
        target.setCycleTime(payload.cycleTime());
        target.setEstimatedCost(payload.estimatedCost());
        target.setLaborRate(payload.laborRate());
        target.setMachineRate(payload.machineRate());
        target.setCritical(payload.isCritical());
        target.setInspection(payload.isInspection());
        target.setRequiresTooling(payload.requiresTooling());
        target.setToolingCode(payload.toolingCode());
        target.setSetupInstructions(payload.setupInstructions());
        target.setOperationInstructions(payload.operationInstructions());
        target.setQualityChecks(payload.qualityChecks());
        target.setSafetyRequirements(payload.safetyRequirements());
        target.setMaterialsRequired(payload.materialsRequired());
    }
    
    private OperationDto toDto(Operation operation) {
        return new OperationDto(
            operation.getId().toString(),
            operation.getOperationCode(),
            operation.getRoutingId() != null ? operation.getRoutingId().toString() : null,
            operation.getSequenceNumber(),
            operation.getDescription(),
            operation.getOperationType(),
            operation.getMachineType(),
            operation.getMachineId() != null ? operation.getMachineId().toString() : null,
            operation.getEstimatedTime(),
            operation.getSetupTime(),
            operation.getCycleTime(),
            operation.getEstimatedCost(),
            operation.getLaborRate(),
            operation.getMachineRate(),
            operation.isCritical(),
            operation.isInspection(),
            operation.requiresTooling(),
            operation.getToolingCode(),
            operation.getSetupInstructions(),
            operation.getOperationInstructions(),
            operation.getQualityChecks(),
            operation.getSafetyRequirements(),
            operation.getMaterialsRequired(),
            safeOffset(operation.getCreatedAt()),
            safeOffset(operation.getUpdatedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}