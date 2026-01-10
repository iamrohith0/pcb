package com.pcbxpress.erp.modules.production.service;

import com.pcbxpress.erp.modules.production.dto.RoutingDto;
import com.pcbxpress.erp.modules.production.dto.RoutingPayload;
import com.pcbxpress.erp.modules.production.model.Routing;
import com.pcbxpress.erp.modules.production.repository.RoutingRepository;
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
 * Service for managing Routings
 */
@Service
@Transactional
public class RoutingService {
    
    private final RoutingRepository routingRepository;
    
    public RoutingService(RoutingRepository routingRepository) {
        this.routingRepository = routingRepository;
    }
    
    /**
     * List routings with optional filters
     */
    public List<RoutingDto> list(String query, String itemCode, Routing.RoutingStatus status, Boolean isActive, Boolean isDefault) {
        return routingRepository.findByCriteria(itemCode, status, isActive, isDefault, query).stream()
            .sorted(Comparator.comparing(Routing::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single routing by ID
     */
    public RoutingDto get(String id) {
        Routing routing = routingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Routing not found: " + id));
        return toDto(routing);
    }
    
    /**
     * Create a new routing
     */
    public RoutingDto create(RoutingPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Routing routing = new Routing();
        routing.setId(UUID.randomUUID());
        applyPayload(routing, payload);
        
        // Auto-generate routing code if not provided
        if (routing.getRoutingCode() == null || routing.getRoutingCode().isBlank()) {
            routing.setRoutingCode(generateRoutingCode());
        }
        
        // Set default values
        if (routing.getStatus() == null) {
            routing.setStatus(Routing.RoutingStatus.DRAFT);
        }
        
        if (routing.getVersion() == null) {
            routing.setVersion(1);
        }
        
        if (routing.isActive() == false) {
            routing.setActive(true);
        }
        
        Routing saved = routingRepository.save(routing);
        return toDto(saved);
    }
    
    /**
     * Update an existing routing
     */
    public RoutingDto update(String id, RoutingPayload payload) {
        Routing existing = routingRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Routing not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Routing saved = routingRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a routing
     */
    public void delete(String id) {
        routingRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple routings
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(RoutingService::parseId).collect(Collectors.toList());
        routingRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search routings by query
     */
    public List<RoutingDto> search(String query) {
        return routingRepository.findByCriteria(null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get latest version of routing for an item
     */
    public List<RoutingDto> findLatestVersionByItemCode(String itemCode) {
        return routingRepository.findLatestVersionByItemCode(itemCode).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get default routing for an item
     */
    public List<RoutingDto> findDefaultByItemCode(String itemCode) {
        return routingRepository.findDefaultByItemCode(itemCode).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get active routings
     */
    public List<RoutingDto> findActive() {
        return routingRepository.findByIsActiveTrue().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get default routings
     */
    public List<RoutingDto> findDefault() {
        return routingRepository.findByIsDefaultTrue().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get routing statistics
     */
    public Map<String, Object> getStats() {
        List<Routing> all = routingRepository.findAll();
        long total = all.size();
        long draft = all.stream().filter(r -> r.getStatus() == Routing.RoutingStatus.DRAFT).count();
        long active = all.stream().filter(r -> r.getStatus() == Routing.RoutingStatus.ACTIVE).count();
        long inactive = all.stream().filter(r -> r.getStatus() == Routing.RoutingStatus.INACTIVE).count();
        long obsolete = all.stream().filter(r -> r.getStatus() == Routing.RoutingStatus.OBSOLETE).count();
        long underReview = all.stream().filter(r -> r.getStatus() == Routing.RoutingStatus.UNDER_REVIEW).count();
        
        // Count by item code
        Map<String, Long> byItemCode = all.stream()
            .filter(r -> r.getItemCode() != null)
            .collect(Collectors.groupingBy(Routing::getItemCode, Collectors.counting()));
        
        // Count active vs inactive
        long activeRoutings = all.stream().filter(Routing::isActive).count();
        long inactiveRoutings = all.stream().filter(r -> !r.isActive()).count();
        
        // Count default vs non-default
        long defaultRoutings = all.stream().filter(Routing::isDefault).count();
        long nonDefaultRoutings = all.stream().filter(r -> !r.isDefault()).count();
        
        // Calculate total estimated time and cost
        BigDecimal totalEstimatedTime = all.stream()
            .map(r -> r.getEstimatedTotalTime() != null ? r.getEstimatedTotalTime() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalEstimatedCost = all.stream()
            .map(r -> r.getEstimatedTotalCost() != null ? r.getEstimatedTotalCost() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("draft", draft),
            Map.entry("active", active),
            Map.entry("inactive", inactive),
            Map.entry("obsolete", obsolete),
            Map.entry("underReview", underReview),
            Map.entry("byItemCode", byItemCode),
            Map.entry("activeRoutings", activeRoutings),
            Map.entry("inactiveRoutings", inactiveRoutings),
            Map.entry("defaultRoutings", defaultRoutings),
            Map.entry("nonDefaultRoutings", nonDefaultRoutings),
            Map.entry("totalEstimatedTime", totalEstimatedTime),
            Map.entry("totalEstimatedCost", totalEstimatedCost)
        );
    }
    
    /**
     * Export routings to CSV format
     */
    public String exportCsv(List<RoutingDto> data) {
        String header = "Routing Code,Item Code,Description,Version,Status,Estimated Time,Estimated Cost,Active,Default";
        String rows = data.stream()
            .map(routing -> String.join(",",
                safe(routing.routingCode()),
                safe(routing.itemCode()),
                safe(routing.description()),
                safe(routing.version() != null ? routing.version().toString() : ""),
                safe(routing.status() != null ? routing.status().toString() : ""),
                safe(routing.estimatedTotalTime() != null ? routing.estimatedTotalTime().toString() : ""),
                safe(routing.estimatedTotalCost() != null ? routing.estimatedTotalCost().toString() : ""),
                routing.isActive() ? "Yes" : "No",
                routing.isDefault() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Routing not found: " + id);
        }
    }
    
    private static String generateRoutingCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "RT-" + token;
    }
    
    private void validateUniqueConstraints(RoutingPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate routing code
        if (payload.routingCode() != null && !payload.routingCode().isBlank()) {
            Routing existing = routingRepository.findByRoutingCodeIgnoreCase(payload.routingCode());
            if (existing != null && !existing.getId().equals(existingUUID)) {
                throw new IllegalArgumentException("Routing code already exists: " + payload.routingCode());
            }
        }
    }
    
    private void applyPayload(Routing target, RoutingPayload payload) {
        target.setRoutingCode(payload.routingCode());
        target.setItemCode(payload.itemCode());
        target.setDescription(payload.description());
        target.setVersion(payload.version());
        target.setStatus(payload.status());
        target.setEstimatedTotalTime(payload.estimatedTotalTime());
        target.setEstimatedTotalCost(payload.estimatedTotalCost());
        target.setActive(payload.isActive());
        target.setDefault(payload.isDefault());
        target.setRevisionNotes(payload.revisionNotes());
        target.setEngineeringNotes(payload.engineeringNotes());
        target.setQualityRequirements(payload.qualityRequirements());
        target.setSafetyRequirements(payload.safetyRequirements());
    }
    
    private RoutingDto toDto(Routing routing) {
        return new RoutingDto(
            routing.getId().toString(),
            routing.getRoutingCode(),
            routing.getItemCode(),
            routing.getDescription(),
            routing.getVersion(),
            routing.getStatus(),
            routing.getEstimatedTotalTime(),
            routing.getEstimatedTotalCost(),
            routing.isActive(),
            routing.isDefault(),
            routing.getRevisionNotes(),
            routing.getEngineeringNotes(),
            routing.getQualityRequirements(),
            routing.getSafetyRequirements(),
            safeOffset(routing.getCreatedAt()),
            safeOffset(routing.getUpdatedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}