package com.pcbxpress.erp.modules.production.service;

import com.pcbxpress.erp.modules.production.dto.WIPEventDto;
import com.pcbxpress.erp.modules.production.dto.WIPEventPayload;
import com.pcbxpress.erp.modules.production.model.WIPEvent;
import com.pcbxpress.erp.modules.production.repository.WIPEventRepository;
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
 * Service for managing WIP Events
 */
@Service
@Transactional
public class WIPEventService {
    
    private final WIPEventRepository wipEventRepository;
    
    public WIPEventService(WIPEventRepository wipEventRepository) {
        this.wipEventRepository = wipEventRepository;
    }
    
    /**
     * List WIP events with optional filters
     */
    public List<WIPEventDto> list(String query, String workOrderId, String operationId, WIPEvent.EventType eventType, WIPEvent.Status status, String batchId, String machineName, String operatorName) {
        return wipEventRepository.findByCriteria(
            workOrderId != null ? UUID.fromString(workOrderId) : null,
            operationId != null ? UUID.fromString(operationId) : null,
            eventType,
            status,
            batchId,
            machineName,
            operatorName
        ).stream()
            .sorted(Comparator.comparing(WIPEvent::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single WIP event by ID
     */
    public WIPEventDto get(String id) {
        WIPEvent wipEvent = wipEventRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("WIP event not found: " + id));
        return toDto(wipEvent);
    }
    
    /**
     * Create a new WIP event
     */
    public WIPEventDto create(WIPEventPayload payload) {
        WIPEvent wipEvent = new WIPEvent();
        wipEvent.setId(UUID.randomUUID());
        applyPayload(wipEvent, payload);
        
        // Auto-generate batch ID if not provided and event type requires it
        if ((wipEvent.getBatchId() == null || wipEvent.getBatchId().isBlank()) && 
            (wipEvent.getEventType() == WIPEvent.EventType.START || 
             wipEvent.getEventType() == WIPEvent.EventType.COMPLETE)) {
            wipEvent.setBatchId(generateBatchId());
        }
        
        // Calculate yield percentage if quantities are provided
        if (wipEvent.getQuantity() != null && wipEvent.getQuantity() > 0) {
            int total = wipEvent.getQuantity();
            int scrap = wipEvent.getScrapQuantity() != null ? wipEvent.getScrapQuantity() : 0;
            int rework = wipEvent.getReworkQuantity() != null ? wipEvent.getReworkQuantity() : 0;
            int good = total - scrap - rework;
            
            if (good >= 0) {
                BigDecimal yield = BigDecimal.valueOf((double) good / total * 100);
                wipEvent.setYieldPercentage(yield.setScale(2, BigDecimal.ROUND_HALF_UP));
            }
        }
        
        WIPEvent saved = wipEventRepository.save(wipEvent);
        return toDto(saved);
    }
    
    /**
     * Update an existing WIP event
     */
    public WIPEventDto update(String id, WIPEventPayload payload) {
        WIPEvent existing = wipEventRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("WIP event not found: " + id));
        
        applyPayload(existing, payload);
        
        // Recalculate yield percentage if quantities changed
        if (existing.getQuantity() != null && existing.getQuantity() > 0) {
            int total = existing.getQuantity();
            int scrap = existing.getScrapQuantity() != null ? existing.getScrapQuantity() : 0;
            int rework = existing.getReworkQuantity() != null ? existing.getReworkQuantity() : 0;
            int good = total - scrap - rework;
            
            if (good >= 0) {
                BigDecimal yield = BigDecimal.valueOf((double) good / total * 100);
                existing.setYieldPercentage(yield.setScale(2, BigDecimal.ROUND_HALF_UP));
            }
        }
        
        WIPEvent saved = wipEventRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a WIP event
     */
    public void delete(String id) {
        wipEventRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple WIP events
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(WIPEventService::parseId).collect(Collectors.toList());
        wipEventRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search WIP events by query
     */
    public List<WIPEventDto> search(String query) {
        return wipEventRepository.findByCriteria(null, null, null, null, null, null, null).stream()
            .filter(w -> query == null || query.isBlank() ||
                (w.getBatchId() != null && w.getBatchId().toLowerCase().contains(query.toLowerCase())) ||
                (w.getMachineName() != null && w.getMachineName().toLowerCase().contains(query.toLowerCase())) ||
                (w.getOperatorName() != null && w.getOperatorName().toLowerCase().contains(query.toLowerCase())))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events by work order ID
     */
    public List<WIPEventDto> findByWorkOrder(String workOrderId) {
        return wipEventRepository.findByWorkOrderId(UUID.fromString(workOrderId)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events by operation ID
     */
    public List<WIPEventDto> findByOperation(String operationId) {
        return wipEventRepository.findByOperationId(UUID.fromString(operationId)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events by batch ID
     */
    public List<WIPEventDto> findByBatch(String batchId) {
        return wipEventRepository.findByBatchIdIgnoreCase(batchId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events by machine name
     */
    public List<WIPEventDto> findByMachine(String machineName) {
        return wipEventRepository.findByMachineNameIgnoreCase(machineName).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events by operator name
     */
    public List<WIPEventDto> findByOperator(String operatorName) {
        return wipEventRepository.findByOperatorNameIgnoreCase(operatorName).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events by time range
     */
    public List<WIPEventDto> findByTimeRange(OffsetDateTime startTime, OffsetDateTime endTime) {
        return wipEventRepository.findByStartTimeBetween(startTime, endTime).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events with low yield
     */
    public List<WIPEventDto> findLowYieldEvents() {
        return wipEventRepository.findLowYieldEvents(90.0).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events with high scrap
     */
    public List<WIPEventDto> findHighScrapEvents() {
        return wipEventRepository.findHighScrapEvents(5).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP events with rework
     */
    public List<WIPEventDto> findReworkEvents() {
        return wipEventRepository.findReworkEvents().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get WIP event statistics
     */
    public Map<String, Object> getStats() {
        List<WIPEvent> all = wipEventRepository.findAll();
        long total = all.size();
        
        // Count by event type
        Map<WIPEvent.EventType, Long> byEventType = all.stream()
            .collect(Collectors.groupingBy(WIPEvent::getEventType, Collectors.counting()));
        
        // Count by status
        Map<WIPEvent.Status, Long> byStatus = all.stream()
            .collect(Collectors.groupingBy(WIPEvent::getStatus, Collectors.counting()));
        
        // Count by machine
        Map<String, Long> byMachine = all.stream()
            .filter(w -> w.getMachineName() != null)
            .collect(Collectors.groupingBy(WIPEvent::getMachineName, Collectors.counting()));
        
        // Count by operator
        Map<String, Long> byOperator = all.stream()
            .filter(w -> w.getOperatorName() != null)
            .collect(Collectors.groupingBy(WIPEvent::getOperatorName, Collectors.counting()));
        
        // Calculate total quantities
        int totalQuantity = all.stream().mapToInt(w -> w.getQuantity() != null ? w.getQuantity() : 0).sum();
        int totalScrap = all.stream().mapToInt(w -> w.getScrapQuantity() != null ? w.getScrapQuantity() : 0).sum();
        int totalRework = all.stream().mapToInt(w -> w.getReworkQuantity() != null ? w.getReworkQuantity() : 0).sum();
        
        // Calculate average yield
        BigDecimal avgYield = all.stream()
            .map(w -> w.getYieldPercentage() != null ? w.getYieldPercentage() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (total > 0) {
            avgYield = avgYield.divide(BigDecimal.valueOf(total), 2, BigDecimal.ROUND_HALF_UP);
        }
        
        // Calculate total duration
        BigDecimal totalDuration = all.stream()
            .map(w -> w.getDurationMinutes() != null ? w.getDurationMinutes() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("byEventType", byEventType),
            Map.entry("byStatus", byStatus),
            Map.entry("byMachine", byMachine),
            Map.entry("byOperator", byOperator),
            Map.entry("totalQuantity", totalQuantity),
            Map.entry("totalScrap", totalScrap),
            Map.entry("totalRework", totalRework),
            Map.entry("avgYield", avgYield),
            Map.entry("totalDuration", totalDuration)
        );
    }
    
    /**
     * Export WIP events to CSV format
     */
    public String exportCsv(List<WIPEventDto> data) {
        String header = "Work Order ID,Operation ID,Batch ID,Event Type,Status,Quantity,Scrap, Rework,Operator,Machine,Start Time,End Time,Duration,Yield,Event Notes";
        String rows = data.stream()
            .map(event -> String.join(",",
                safe(event.workOrderId()),
                safe(event.operationId()),
                safe(event.batchId()),
                safe(event.eventType() != null ? event.eventType().toString() : ""),
                safe(event.status() != null ? event.status().toString() : ""),
                safe(event.quantity() != null ? event.quantity().toString() : ""),
                safe(event.scrapQuantity() != null ? event.scrapQuantity().toString() : ""),
                safe(event.reworkQuantity() != null ? event.reworkQuantity().toString() : ""),
                safe(event.operatorName()),
                safe(event.machineName()),
                safe(event.startTime() != null ? event.startTime().toString() : ""),
                safe(event.endTime() != null ? event.endTime().toString() : ""),
                safe(event.durationMinutes() != null ? event.durationMinutes().toString() : ""),
                safe(event.yieldPercentage() != null ? event.yieldPercentage().toString() : ""),
                safe(event.productionNotes())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("WIP event not found: " + id);
        }
    }
    
    private static String generateBatchId() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "BATCH-" + token;
    }
    
    private void applyPayload(WIPEvent target, WIPEventPayload payload) {
        target.setWorkOrderId(payload.workOrderId() != null ? UUID.fromString(payload.workOrderId()) : null);
        target.setOperationId(payload.operationId() != null ? UUID.fromString(payload.operationId()) : null);
        target.setBatchId(payload.batchId());
        target.setEventType(payload.eventType());
        target.setStatus(payload.status());
        target.setQuantity(payload.quantity());
        target.setScrapQuantity(payload.scrapQuantity());
        target.setReworkQuantity(payload.reworkQuantity());
        target.setOperatorId(payload.operatorId() != null ? UUID.fromString(payload.operatorId()) : null);
        target.setOperatorName(payload.operatorName());
        target.setMachineId(payload.machineId() != null ? UUID.fromString(payload.machineId()) : null);
        target.setMachineName(payload.machineName());
        target.setStartTime(payload.startTime());
        target.setEndTime(payload.endTime());
        target.setDurationMinutes(payload.durationMinutes());
        target.setSetupTimeMinutes(payload.setupTimeMinutes());
        target.setCycleTimeMinutes(payload.cycleTimeMinutes());
        target.setYieldPercentage(payload.yieldPercentage());
        target.setReworkReason(payload.reworkReason());
        target.setHoldReason(payload.holdReason());
        target.setReleaseReason(payload.releaseReason());
        target.setQualityNotes(payload.qualityNotes());
        target.setProductionNotes(payload.productionNotes());
        target.setInspectionResults(payload.inspectionResults());
        target.setMaterialConsumption(payload.materialConsumption());
    }
    
    private WIPEventDto toDto(WIPEvent wipEvent) {
        return new WIPEventDto(
            wipEvent.getId().toString(),
            wipEvent.getWorkOrderId() != null ? wipEvent.getWorkOrderId().toString() : null,
            wipEvent.getOperationId() != null ? wipEvent.getOperationId().toString() : null,
            wipEvent.getBatchId(),
            wipEvent.getEventType(),
            wipEvent.getStatus(),
            wipEvent.getQuantity(),
            wipEvent.getScrapQuantity(),
            wipEvent.getReworkQuantity(),
            wipEvent.getOperatorId() != null ? wipEvent.getOperatorId().toString() : null,
            wipEvent.getOperatorName(),
            wipEvent.getMachineId() != null ? wipEvent.getMachineId().toString() : null,
            wipEvent.getMachineName(),
            wipEvent.getStartTime(),
            wipEvent.getEndTime(),
            wipEvent.getDurationMinutes(),
            wipEvent.getSetupTimeMinutes(),
            wipEvent.getCycleTimeMinutes(),
            wipEvent.getYieldPercentage(),
            wipEvent.getReworkReason(),
            wipEvent.getHoldReason(),
            wipEvent.getReleaseReason(),
            wipEvent.getQualityNotes(),
            wipEvent.getProductionNotes(),
            wipEvent.getInspectionResults(),
            wipEvent.getMaterialConsumption(),
            safeOffset(wipEvent.getCreatedAt()),
            safeOffset(wipEvent.getUpdatedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}