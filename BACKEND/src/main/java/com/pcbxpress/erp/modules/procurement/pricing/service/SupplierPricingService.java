package com.pcbxpress.erp.modules.procurement.pricing.service;

import com.pcbxpress.erp.modules.procurement.pricing.dto.SupplierPricingDto;
import com.pcbxpress.erp.modules.procurement.pricing.dto.SupplierPricingPayload;
import com.pcbxpress.erp.modules.procurement.pricing.model.SupplierPricing;
import com.pcbxpress.erp.modules.procurement.pricing.repository.SupplierPricingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierPricingService {

    private final SupplierPricingRepository supplierPricingRepository;

    public SupplierPricingService(SupplierPricingRepository supplierPricingRepository) {
        this.supplierPricingRepository = supplierPricingRepository;
    }

    public List<SupplierPricingDto> list(String query, String status) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "updatedAt"));
        
        if ((status == null || status.isBlank() || "all".equalsIgnoreCase(status)) && 
            (query == null || query.isBlank())) {
            return supplierPricingRepository.findAll(pageable).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        }
        
        Page<SupplierPricing> page = supplierPricingRepository.findByStatusAndQuery(
            status, query != null ? query.trim() : "", pageable);
        
        return page.getContent().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public SupplierPricingDto get(String id) {
        SupplierPricing pricing = supplierPricingRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Supplier Pricing not found: " + id));
        return toDto(pricing);
    }

    public SupplierPricingDto create(SupplierPricingPayload payload) {
        SupplierPricing pricing = new SupplierPricing();
        pricing.setId(UUID.randomUUID());
        applyPayload(pricing, payload, null);
        
        if (pricing.getStatus() == null || pricing.getStatus().isBlank()) {
            pricing.setStatus("ACTIVE");
        }
        
        SupplierPricing saved = supplierPricingRepository.save(pricing);
        return toDto(saved);
    }

    public SupplierPricingDto update(String id, SupplierPricingPayload payload) {
        SupplierPricing existing = supplierPricingRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Supplier Pricing not found: " + id));
        
        applyPayload(existing, payload, existing);
        
        SupplierPricing saved = supplierPricingRepository.save(existing);
        return toDto(saved);
    }

    public void delete(String id) {
        supplierPricingRepository.deleteById(parseId(id));
    }

    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(SupplierPricingService::parseId).collect(Collectors.toList());
        supplierPricingRepository.deleteAllById(uuidList);
    }

    public Map<String, Object> stats() {
        List<SupplierPricing> all = supplierPricingRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(sp -> "ACTIVE".equalsIgnoreCase(sp.getStatus())).count();
        long inactive = all.stream().filter(sp -> "INACTIVE".equalsIgnoreCase(sp.getStatus())).count();
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive
        );
    }

    public String exportCsv(List<SupplierPricingDto> data) {
        String header = "Supplier,Item Code,Item Description,Currency,Unit Price,MOQ,Lead Time,Effective Date,Status";
        String rows = data.stream()
            .map(sp -> String.join(",",
                safe(sp.supplierName()),
                safe(sp.itemCode()),
                safe(sp.itemDescription()),
                safe(sp.currency()),
                safe(sp.unitPrice() != null ? sp.unitPrice().toString() : ""),
                safe(sp.moq() != null ? sp.moq().toString() : ""),
                String.valueOf(sp.leadTimeDays() != null ? sp.leadTimeDays() : ""),
                safe(sp.effectiveDate() != null ? sp.effectiveDate().toString() : ""),
                safe(sp.status())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    public List<SupplierPricingDto> findBySupplier(String supplierId) {
        return supplierPricingRepository.findBySupplierId(parseId(supplierId)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public List<SupplierPricingDto> findByItem(String itemId) {
        return supplierPricingRepository.findByItemId(parseId(itemId)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public List<SupplierPricingDto> findActiveByItem(String itemId) {
        return supplierPricingRepository.findActiveByItem(parseId(itemId), OffsetDateTime.now()).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public SupplierPricingDto findBestPriceForItem(String itemId) {
        List<SupplierPricing> bestPrices = supplierPricingRepository.findActiveByItemOrderByPrice(parseId(itemId), OffsetDateTime.now());
        if (bestPrices.isEmpty()) {
            return null;
        }
        return toDto(bestPrices.get(0));
    }

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid Supplier Pricing ID: " + id);
        }
    }

    private void applyPayload(SupplierPricing target, SupplierPricingPayload payload, SupplierPricing existing) {
        target.setSupplierId(parseId(payload.supplierId()));
        target.setSupplierName(payload.supplierName());
        target.setSupplierCode(payload.supplierCode());
        target.setItemId(parseId(payload.itemId()));
        target.setItemCode(payload.itemCode());
        target.setItemDescription(payload.itemDescription());
        target.setCurrency(firstNonNull(payload.currency(), existing != null ? existing.getCurrency() : "INR"));
        target.setUnitPrice(payload.unitPrice());
        target.setMoq(firstNonNull(payload.moq(), existing != null ? existing.getMoq() : BigDecimal.ONE));
        target.setLeadTimeDays(firstNonNull(payload.leadTimeDays(), existing != null ? existing.getLeadTimeDays() : 0));
        target.setEffectiveDate(firstNonNull(payload.effectiveDate(), existing != null ? existing.getEffectiveDate() : OffsetDateTime.now()));
        target.setExpiryDate(firstNonNull(payload.expiryDate(), existing != null ? existing.getExpiryDate() : null));
        target.setStatus(firstNonNull(payload.status(), existing != null ? existing.getStatus() : "ACTIVE"));
        target.setNotes(firstNonNull(payload.notes(), existing != null ? existing.getNotes() : null));
        target.setApprovedBy(firstNonNull(payload.approvedBy(), existing != null ? existing.getApprovedBy() : null));
        
        if (target.getStatus() == null || target.getStatus().isBlank()) {
            target.setStatus("ACTIVE");
        }
    }

    private SupplierPricingDto toDto(SupplierPricing pricing) {
        return new SupplierPricingDto(
            pricing.getId().toString(),
            pricing.getSupplierId().toString(),
            pricing.getSupplierName(),
            pricing.getSupplierCode(),
            pricing.getItemId().toString(),
            pricing.getItemCode(),
            pricing.getItemDescription(),
            pricing.getCurrency(),
            pricing.getUnitPrice(),
            pricing.getMoq(),
            pricing.getLeadTimeDays(),
            safeOffset(pricing.getEffectiveDate()),
            safeOffset(pricing.getExpiryDate()),
            pricing.getStatus(),
            pricing.getNotes(),
            pricing.getApprovedBy(),
            safeOffset(pricing.getApprovedAt()),
            safeOffset(pricing.getCreatedAt()),
            safeOffset(pricing.getUpdatedAt())
        );
    }

    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }

    private static <T> T firstNonNull(T candidate, T fallback) {
        return candidate != null ? candidate : fallback;
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}