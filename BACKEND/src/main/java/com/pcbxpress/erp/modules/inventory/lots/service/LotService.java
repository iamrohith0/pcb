package com.pcbxpress.erp.modules.inventory.lots.service;

import com.pcbxpress.erp.modules.inventory.lots.dto.LotDto;
import com.pcbxpress.erp.modules.inventory.lots.dto.LotPayload;
import com.pcbxpress.erp.modules.inventory.lots.model.Lot;
import com.pcbxpress.erp.modules.inventory.lots.repository.LotRepository;
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
 * Service for Lot Management
 */
@Service
@Transactional
public class LotService {
    
    private final LotRepository lotRepository;
    
    public LotService(LotRepository lotRepository) {
        this.lotRepository = lotRepository;
    }
    
    /**
     * List lots with optional filters
     */
    public List<LotDto> list(String query, String status, String qualityStatus, String itemId) {
        List<Lot> lots = lotRepository.findAll();
        
        // Apply filters
        if (query != null && !query.isBlank()) {
            lots = lots.stream()
                .filter(lot -> matchesQuery(lot, query))
                .collect(Collectors.toList());
        }
        
        if (status != null && !status.isBlank()) {
            Lot.LotStatus lotStatus = Lot.LotStatus.valueOf(status.toUpperCase());
            lots = lots.stream()
                .filter(lot -> lot.getStatus() == lotStatus)
                .collect(Collectors.toList());
        }
        
        if (qualityStatus != null && !qualityStatus.isBlank()) {
            Lot.QualityStatus qStatus = Lot.QualityStatus.valueOf(qualityStatus.toUpperCase());
            lots = lots.stream()
                .filter(lot -> lot.getQualityStatus() == qStatus)
                .collect(Collectors.toList());
        }
        
        if (itemId != null && !itemId.isBlank()) {
            UUID itemUUID = UUID.fromString(itemId);
            lots = lots.stream()
                .filter(lot -> lot.getItemId().equals(itemUUID))
                .collect(Collectors.toList());
        }
        
        return lots.stream()
            .sorted(Comparator.comparing(Lot::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single lot by ID
     */
    public LotDto getById(String id) {
        Lot lot = lotRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Lot not found: " + id));
        return toDto(lot);
    }
    
    /**
     * Create a new lot
     */
    public LotDto create(LotPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Lot lot = new Lot();
        lot.setId(UUID.randomUUID());
        applyPayload(lot, payload);
        
        // Auto-generate lot number if not provided
        if (lot.getLotNumber() == null || lot.getLotNumber().isBlank()) {
            lot.setLotNumber(generateLotNumber());
        }
        
        // Set default status
        if (lot.getStatus() == null) {
            lot.setStatus(Lot.LotStatus.ACTIVE);
        }
        
        if (lot.getQualityStatus() == null) {
            lot.setQualityStatus(Lot.QualityStatus.PENDING);
        }
        
        Lot saved = lotRepository.save(lot);
        return toDto(saved);
    }
    
    /**
     * Update an existing lot
     */
    public LotDto update(String id, LotPayload payload) {
        Lot existing = lotRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Lot not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Lot saved = lotRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a lot
     */
    public void remove(String id) {
        lotRepository.deleteById(UUID.fromString(id));
    }
    
    /**
     * Update lot status
     */
    public LotDto updateStatus(String id, String status) {
        Lot lot = lotRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Lot not found: " + id));
        
        Lot.LotStatus lotStatus = Lot.LotStatus.valueOf(status.toUpperCase());
        lot.setStatus(lotStatus);
        
        // Update quality status based on lot status
        if (lotStatus == Lot.LotStatus.QUARANTINE) {
            lot.setQualityStatus(Lot.QualityStatus.QUARANTINE);
        } else if (lotStatus == Lot.LotStatus.EXPIRED || lotStatus == Lot.LotStatus.SCRAPPED) {
            lot.setQualityStatus(Lot.QualityStatus.FAILED);
        }
        
        Lot saved = lotRepository.save(lot);
        return toDto(saved);
    }
    
    /**
     * Get lot movements
     */
    public List<Object[]> getMovements(String id, int days) {
        OffsetDateTime fromDate = OffsetDateTime.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
        OffsetDateTime toDate = OffsetDateTime.now();
        
        // This would typically query a separate movements table
        // For now, return basic lot information
        Lot lot = lotRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Lot not found: " + id));
        
        Object[] movementData = new Object[]{
            lot.getItemId(),
            lot.getLotNumber(),
            lot.getStatus(),
            lot.getQuantityReceived(),
            lot.getQuantityUsed(),
            lot.getQuantityScrapped()
        };
        List<Object[]> result = new java.util.ArrayList<>();
        result.add(movementData);
        return result;
    }
    
    /**
     * Get lot genealogy
     */
    public Map<String, Object> getGenealogy(String id) {
        Lot lot = lotRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Lot not found: " + id));
        
        // Get parent lot
        Lot parentLot = null;
        if (lot.getParentLotId() != null) {
            parentLot = lotRepository.findById(lot.getParentLotId()).orElse(null);
        }
        
        // Get child lots
        List<Lot> childLots = lotRepository.findByParentLotId(lot.getId());
        
        return Map.of(
            "lot", toDto(lot),
            "parentLot", parentLot != null ? toDto(parentLot) : null,
            "childLots", childLots.stream().map(this::toDto).collect(Collectors.toList()),
            "hasParent", parentLot != null,
            "childCount", childLots.size()
        );
    }
    
    /**
     * Search lots
     */
    public List<LotDto> search(String query) {
        return lotRepository.findAll().stream()
            .filter(lot -> matchesQuery(lot, query))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get expiring lots
     */
    public List<LotDto> getExpiringLots(int days) {
        OffsetDateTime expirationDate = OffsetDateTime.now().plusDays(days);
        List<Lot> lots = lotRepository.findExpiringLots(expirationDate);
        return lots.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get lot statistics
     */
    public Map<String, Object> getStats() {
        List<Lot> all = lotRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(l -> l.getStatus() == Lot.LotStatus.ACTIVE).count();
        long quarantine = all.stream().filter(l -> l.getStatus() == Lot.LotStatus.QUARANTINE).count();
        long expired = all.stream().filter(l -> l.getStatus() == Lot.LotStatus.EXPIRED).count();
        long scrapped = all.stream().filter(l -> l.getStatus() == Lot.LotStatus.SCRAPPED).count();
        
        // Calculate total quantities
        BigDecimal totalReceived = all.stream()
            .map(Lot::getQuantityReceived)
            .filter(q -> q != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalAvailable = all.stream()
            .map(Lot::getQuantityAvailable)
            .filter(q -> q != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "total", total,
            "active", active,
            "quarantine", quarantine,
            "expired", expired,
            "scrapped", scrapped,
            "totalReceived", totalReceived,
            "totalAvailable", totalAvailable,
            "avgAge", calculateAverageAge(all)
        );
    }
    
    // Private helper methods
    
    private void validateUniqueConstraints(LotPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate lot number
        if (payload.lotNumber() != null && !payload.lotNumber().isBlank()) {
            boolean exists = lotRepository.existsByLotNumberIgnoreCaseAndIdNot(payload.lotNumber(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Lot number already exists: " + payload.lotNumber());
            }
        }
    }
    
    // This method is no longer needed as it's now in the repository
    
    private static String generateLotNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "LOT-" + token;
    }
    
    private void applyPayload(Lot target, LotPayload payload) {
        target.setLotNumber(payload.lotNumber());
        target.setItemId(payload.itemId() != null ? UUID.fromString(payload.itemId()) : null);
        target.setSupplierId(payload.supplierId() != null ? UUID.fromString(payload.supplierId()) : null);
        target.setReceivedDate(payload.receivedDate());
        target.setManufactureDate(payload.manufactureDate());
        target.setExpirationDate(payload.expirationDate());
        target.setQuantityReceived(payload.quantityReceived());
        target.setCostPerUnit(payload.costPerUnit());
        target.setStatus(payload.status());
        target.setStorageLocation(payload.storageLocation());
        target.setBatchReference(payload.batchReference());
        target.setCertificateOfAnalysis(payload.certificateOfAnalysis());
        target.setQualityStatus(payload.qualityStatus());
        target.setQuarantineReason(payload.quarantineReason());
        target.setParentLotId(payload.parentLotId() != null ? UUID.fromString(payload.parentLotId()) : null);
        target.setChildLotIds(payload.childLotIds());
        target.setNotes(payload.notes());
    }
    
    private LotDto toDto(Lot lot) {
        return new LotDto(
            lot.getId().toString(),
            lot.getLotNumber(),
            lot.getItemId().toString(),
            lot.getSupplierId() != null ? lot.getSupplierId().toString() : null,
            lot.getReceivedDate(),
            lot.getManufactureDate(),
            lot.getExpirationDate(),
            lot.getQuantityReceived(),
            lot.getQuantityAvailable(),
            lot.getQuantityUsed(),
            lot.getQuantityScrapped(),
            lot.getCostPerUnit(),
            lot.getTotalCost(),
            lot.getStatus(),
            lot.getStorageLocation(),
            lot.getBatchReference(),
            lot.getCertificateOfAnalysis(),
            lot.getQualityStatus(),
            lot.getQuarantineReason(),
            lot.getParentLotId() != null ? lot.getParentLotId().toString() : null,
            lot.getChildLotIds(),
            lot.getNotes(),
            lot.getCreatedAt(),
            lot.getUpdatedAt()
        );
    }
    
    private boolean matchesQuery(Lot lot, String query) {
        String q = query.toLowerCase();
        return contains(lot.getLotNumber(), q)
            || contains(lot.getBatchReference(), q)
            || contains(lot.getStorageLocation(), q)
            || contains(lot.getCertificateOfAnalysis(), q);
    }
    
    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }
    
    private double calculateAverageAge(List<Lot> lots) {
        if (lots.isEmpty()) return 0.0;
        
        long totalDays = lots.stream()
            .filter(lot -> lot.getReceivedDate() != null)
            .mapToLong(lot -> java.time.Duration.between(lot.getReceivedDate(), OffsetDateTime.now()).toDays())
            .sum();
        
        return (double) totalDays / lots.size();
    }
}