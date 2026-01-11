package com.pcbxpress.erp.modules.procurement.grn.service;

import com.pcbxpress.erp.modules.procurement.grn.dto.GrnDto;
import com.pcbxpress.erp.modules.procurement.grn.dto.GrnPayload;
import com.pcbxpress.erp.modules.procurement.grn.model.Grn;
import com.pcbxpress.erp.modules.procurement.grn.model.GrnLine;
import com.pcbxpress.erp.modules.procurement.grn.repository.GrnRepository;
import com.pcbxpress.erp.modules.procurement.purchaseorders.model.PurchaseOrder;
import com.pcbxpress.erp.modules.procurement.purchaseorders.model.PurchaseOrderLine;
import com.pcbxpress.erp.modules.procurement.purchaseorders.repository.PurchaseOrderRepository;
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
public class GrnService {

    private final GrnRepository grnRepository;
    private final PurchaseOrderRepository poRepository;

    public GrnService(GrnRepository grnRepository, PurchaseOrderRepository poRepository) {
        this.grnRepository = grnRepository;
        this.poRepository = poRepository;
    }

    public List<GrnDto> list(String query, String status) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "updatedAt"));
        
        if ((status == null || status.isBlank() || "all".equalsIgnoreCase(status)) && 
            (query == null || query.isBlank())) {
            return grnRepository.findAll(pageable).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        }
        
        Page<Grn> page = grnRepository.findByStatusAndQuery(
            status, query != null ? query.trim() : "", pageable);
        
        return page.getContent().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public GrnDto get(String id) {
        Grn grn = grnRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("GRN not found: " + id));
        return toDto(grn);
    }

    public GrnDto create(GrnPayload payload) {
        // Validate PO exists
        PurchaseOrder po = poRepository.findById(parseId(payload.poId()))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + payload.poId()));
        
        Grn grn = new Grn();
        grn.setId(UUID.randomUUID());
        grn.setGrnNumber(generateGrnNumber());
        grn.setGrnDate(OffsetDateTime.now());
        grn.setPoId(po.getId());
        grn.setPoNumber(po.getPoNumber());
        grn.setSupplierId(po.getSupplierId());
        grn.setSupplierName(po.getSupplierName());
        grn.setSupplierCode(po.getSupplierCode());
        
        applyPayload(grn, payload, null);
        
        if (grn.getStatus() == null || grn.getStatus().isBlank()) {
            grn.setStatus("RECEIVED");
        }
        
        calculateTotals(grn);
        
        Grn saved = grnRepository.save(grn);
        return toDto(saved);
    }

    public GrnDto update(String id, GrnPayload payload) {
        Grn existing = grnRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("GRN not found: " + id));
        
        applyPayload(existing, payload, existing);
        calculateTotals(existing);
        
        Grn saved = grnRepository.save(existing);
        return toDto(saved);
    }

    public void delete(String id) {
        grnRepository.deleteById(parseId(id));
    }

    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(GrnService::parseId).collect(Collectors.toList());
        grnRepository.deleteAllById(uuidList);
    }

    public Map<String, Object> stats() {
        List<Grn> all = grnRepository.findAll();
        long total = all.size();
        long received = all.stream().filter(grn -> "RECEIVED".equalsIgnoreCase(grn.getStatus())).count();
        long qcPending = all.stream().filter(grn -> "QC_PENDING".equalsIgnoreCase(grn.getStatus())).count();
        long qcPassed = all.stream().filter(grn -> "QC_PASSED".equalsIgnoreCase(grn.getStatus())).count();
        long qcFailed = all.stream().filter(grn -> "QC_FAILED".equalsIgnoreCase(grn.getStatus())).count();
        long putaway = all.stream().filter(grn -> "PUTAWAY".equalsIgnoreCase(grn.getStatus())).count();
        
        BigDecimal totalValue = all.stream()
            .map(Grn::getTotalValue)
            .filter(bt -> bt != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "total", total,
            "received", received,
            "qcPending", qcPending,
            "qcPassed", qcPassed,
            "qcFailed", qcFailed,
            "putaway", putaway,
            "totalValue", totalValue
        );
    }

    public String exportCsv(List<GrnDto> data) {
        String header = "GRN Number,GRN Date,PO Number,Supplier,Warehouse,Status,Total Quantity,Total Value,Vehicle Number";
        String rows = data.stream()
            .map(grn -> String.join(",",
                safe(grn.grnNumber()),
                safe(grn.grnDate() != null ? grn.grnDate().toString() : ""),
                safe(grn.poNumber()),
                safe(grn.supplierName()),
                safe(grn.warehouseName()),
                safe(grn.status()),
                safe(grn.totalQuantity() != null ? grn.totalQuantity().toString() : ""),
                safe(grn.totalValue() != null ? grn.totalValue().toString() : ""),
                safe(grn.vehicleNumber())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    public void markQcPassed(String id, String remarks) {
        Grn grn = grnRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("GRN not found: " + id));
        
        grn.setStatus("QC_PASSED");
        grn.setQcPassedAt(OffsetDateTime.now());
        grn.setQcRemarks(remarks);
        
        grnRepository.save(grn);
    }

    public void markQcFailed(String id, String remarks) {
        Grn grn = grnRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("GRN not found: " + id));
        
        grn.setStatus("QC_FAILED");
        grn.setQcFailedAt(OffsetDateTime.now());
        grn.setQcRemarks(remarks);
        
        grnRepository.save(grn);
    }

    public void markPutawayCompleted(String id) {
        Grn grn = grnRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("GRN not found: " + id));
        
        grn.setStatus("PUTAWAY");
        grn.setPutawayCompletedAt(OffsetDateTime.now());
        
        grnRepository.save(grn);
    }

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid GRN ID: " + id);
        }
    }

    private static String generateGrnNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "GRN-" + token;
    }

    private void calculateTotals(Grn grn) {
        BigDecimal totalQuantity = grn.getLines().stream()
            .map(GrnLine::getReceivedQuantity)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalValue = grn.getLines().stream()
            .map(line -> line.getReceivedQuantity().multiply(line.getUnitPrice()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        grn.setTotalQuantity(totalQuantity);
        grn.setTotalValue(totalValue);
    }

    private void applyPayload(Grn target, GrnPayload payload, Grn existing) {
        target.setPoId(parseId(payload.poId()));
        target.setPoNumber(payload.poNumber());
        target.setSupplierId(parseId(payload.supplierId()));
        target.setSupplierName(payload.supplierName());
        target.setSupplierCode(payload.supplierCode());
        target.setWarehouseId(parseId(payload.warehouseId()));
        target.setWarehouseName(payload.warehouseName());
        target.setVehicleNumber(firstNonNull(payload.vehicleNumber(), existing != null ? existing.getVehicleNumber() : null));
        target.setDriverName(firstNonNull(payload.driverName(), existing != null ? existing.getDriverName() : null));
        target.setDriverContact(firstNonNull(payload.driverContact(), existing != null ? existing.getDriverContact() : null));
        target.setReceivedBy(firstNonNull(payload.receivedBy(), existing != null ? existing.getReceivedBy() : null));
        target.setReceivedAt(firstNonNull(payload.receivedAt(), existing != null ? existing.getReceivedAt() : OffsetDateTime.now()));
        target.setNotes(firstNonNull(payload.notes(), existing != null ? existing.getNotes() : null));
        target.setQcRequired(firstNonNull(payload.qcRequired(), existing != null ? existing.isQcRequired() : true));
        
        // Handle lines
        if (payload.lines() != null) {
            target.getLines().clear();
            for (var linePayload : payload.lines()) {
                GrnLine line = new GrnLine();
                line.setId(UUID.randomUUID());
                line.setPoLineId(parseId(linePayload.poLineId()));
                line.setItemId(parseId(linePayload.itemId()));
                line.setItemCode(linePayload.itemCode());
                line.setItemDescription(linePayload.itemDescription());
                line.setPoQuantity(BigDecimal.ZERO); // TODO: Get from PO line
                line.setReceivedQuantity(linePayload.receivedQuantity());
                line.setUnitPrice(linePayload.unitPrice());
                line.setLineValue(line.getReceivedQuantity().multiply(line.getUnitPrice()));
                line.setBatchNumber(linePayload.batchNumber());
                line.setExpiryDate(linePayload.expiryDate());
                line.setQcStatus(firstNonNull(linePayload.qcStatus(), "PENDING"));
                line.setQcRemarks(linePayload.qcRemarks());
                line.setPutawayLocation(linePayload.putawayLocation());
                
                target.addLine(line);
            }
        }
    }

    private GrnDto toDto(Grn grn) {
        var lineDtos = grn.getLines().stream()
            .map(line -> new GrnDto.GrnLineDto(
                line.getId().toString(),
                line.getPoLineId().toString(),
                line.getItemId().toString(),
                line.getItemCode(),
                line.getItemDescription(),
                line.getPoQuantity(),
                line.getReceivedQuantity(),
                line.getAcceptedQuantity(),
                line.getRejectedQuantity(),
                line.getUnitPrice(),
                line.getLineValue(),
                line.getBatchNumber(),
                safeOffset(line.getExpiryDate()),
                line.getQcStatus(),
                line.getQcRemarks(),
                line.getPutawayLocation(),
                safeOffset(line.getPutawayCompletedAt()),
                safeOffset(line.getCreatedAt()),
                safeOffset(line.getUpdatedAt())
            ))
            .collect(Collectors.toList());

        return new GrnDto(
            grn.getId().toString(),
            grn.getGrnNumber(),
            safeOffset(grn.getGrnDate()),
            grn.getPoId().toString(),
            grn.getPoNumber(),
            grn.getSupplierId().toString(),
            grn.getSupplierName(),
            grn.getSupplierCode(),
            grn.getWarehouseId().toString(),
            grn.getWarehouseName(),
            grn.getVehicleNumber(),
            grn.getDriverName(),
            grn.getDriverContact(),
            grn.getReceivedBy(),
            safeOffset(grn.getReceivedAt()),
            grn.getStatus(),
            grn.getTotalQuantity(),
            grn.getTotalValue(),
            grn.getNotes(),
            grn.isQcRequired(),
            safeOffset(grn.getQcPassedAt()),
            safeOffset(grn.getQcFailedAt()),
            grn.getQcRemarks(),
            safeOffset(grn.getPutawayCompletedAt()),
            safeOffset(grn.getCreatedAt()),
            safeOffset(grn.getUpdatedAt()),
            lineDtos
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