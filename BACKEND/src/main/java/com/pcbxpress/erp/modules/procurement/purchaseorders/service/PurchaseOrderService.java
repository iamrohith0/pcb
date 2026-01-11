package com.pcbxpress.erp.modules.procurement.purchaseorders.service;

import com.pcbxpress.erp.modules.procurement.purchaseorders.dto.PurchaseOrderDto;
import com.pcbxpress.erp.modules.procurement.purchaseorders.dto.PurchaseOrderPayload;
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
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    public List<PurchaseOrderDto> list(String query, String status) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "updatedAt"));
        
        if ((status == null || status.isBlank() || "all".equalsIgnoreCase(status)) && 
            (query == null || query.isBlank())) {
            return purchaseOrderRepository.findAll(pageable).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        }
        
        Page<PurchaseOrder> page = purchaseOrderRepository.findByStatusAndQuery(
            status, query != null ? query.trim() : "", pageable);
        
        return page.getContent().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public PurchaseOrderDto get(String id) {
        PurchaseOrder po = purchaseOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        return toDto(po);
    }

    public PurchaseOrderDto create(PurchaseOrderPayload payload) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(UUID.randomUUID());
        po.setPoNumber(generatePoNumber());
        po.setPoDate(OffsetDateTime.now());
        applyPayload(po, payload, null);
        
        if (po.getStatus() == null || po.getStatus().isBlank()) {
            po.setStatus("DRAFT");
        }
        
        calculateTotals(po);
        
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return toDto(saved);
    }

    public PurchaseOrderDto update(String id, PurchaseOrderPayload payload) {
        PurchaseOrder existing = purchaseOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        
        applyPayload(existing, payload, existing);
        calculateTotals(existing);
        
        PurchaseOrder saved = purchaseOrderRepository.save(existing);
        return toDto(saved);
    }

    public void delete(String id) {
        purchaseOrderRepository.deleteById(parseId(id));
    }

    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(PurchaseOrderService::parseId).collect(Collectors.toList());
        purchaseOrderRepository.deleteAllById(uuidList);
    }

    public Map<String, Object> stats() {
        List<PurchaseOrder> all = purchaseOrderRepository.findAll();
        long total = all.size();
        long draft = all.stream().filter(po -> "DRAFT".equalsIgnoreCase(po.getStatus())).count();
        long submitted = all.stream().filter(po -> "SUBMITTED".equalsIgnoreCase(po.getStatus())).count();
        long approved = all.stream().filter(po -> "APPROVED".equalsIgnoreCase(po.getStatus())).count();
        long sent = all.stream().filter(po -> "SENT".equalsIgnoreCase(po.getStatus())).count();
        long received = all.stream().filter(po -> "RECEIVED".equalsIgnoreCase(po.getStatus())).count();
        long closed = all.stream().filter(po -> "CLOSED".equalsIgnoreCase(po.getStatus())).count();
        long cancelled = all.stream().filter(po -> "CANCELLED".equalsIgnoreCase(po.getStatus())).count();
        
        BigDecimal totalAmount = all.stream()
            .map(PurchaseOrder::getGrandTotal)
            .filter(bt -> bt != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "total", total,
            "draft", draft,
            "submitted", submitted,
            "approved", approved,
            "sent", sent,
            "received", received,
            "closed", closed,
            "cancelled", cancelled,
            "totalAmount", totalAmount
        );
    }

    public String exportCsv(List<PurchaseOrderDto> data) {
        String header = "PO Number,PO Date,Supplier,Status,Currency,Grand Total,Payment Terms,Delivery Date";
        String rows = data.stream()
            .map(po -> String.join(",",
                safe(po.poNumber()),
                safe(po.poDate() != null ? po.poDate().toString() : ""),
                safe(po.supplierName()),
                safe(po.status()),
                safe(po.currency()),
                safe(po.grandTotal() != null ? po.grandTotal().toString() : ""),
                safe(po.paymentTerms()),
                safe(po.deliveryDate() != null ? po.deliveryDate().toString() : "")
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    public void approve(String id) {
        PurchaseOrder po = purchaseOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        
        po.setStatus("APPROVED");
        po.setApprovedAt(OffsetDateTime.now());
        po.setApprovedBy("SYSTEM"); // TODO: Get from security context
        
        purchaseOrderRepository.save(po);
    }

    public void sendToSupplier(String id) {
        PurchaseOrder po = purchaseOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        
        po.setStatus("SENT");
        po.setSentToSupplierAt(OffsetDateTime.now());
        
        purchaseOrderRepository.save(po);
    }

    public void markAsReceived(String id) {
        PurchaseOrder po = purchaseOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        
        po.setStatus("RECEIVED");
        po.setReceivedAt(OffsetDateTime.now());
        
        purchaseOrderRepository.save(po);
    }

    public void close(String id) {
        PurchaseOrder po = purchaseOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        
        po.setStatus("CLOSED");
        po.setClosedAt(OffsetDateTime.now());
        
        purchaseOrderRepository.save(po);
    }

    public void cancel(String id) {
        PurchaseOrder po = purchaseOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        
        po.setStatus("CANCELLED");
        po.setCancelledAt(OffsetDateTime.now());
        
        purchaseOrderRepository.save(po);
    }

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid PO ID: " + id);
        }
    }

    private static String generatePoNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "PO-" + token;
    }

    private void calculateTotals(PurchaseOrder po) {
        BigDecimal subtotal = po.getLines().stream()
            .map(line -> line.getUnitPrice().multiply(line.getQuantity()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal discountAmount = po.getLines().stream()
            .map(line -> line.getDiscountAmount() != null ? line.getDiscountAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal taxAmount = po.getLines().stream()
            .map(line -> line.getTaxAmount() != null ? line.getTaxAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal shippingAmount = po.getShippingAmount() != null ? po.getShippingAmount() : BigDecimal.ZERO;
        
        BigDecimal grandTotal = subtotal
            .subtract(discountAmount)
            .add(taxAmount)
            .add(shippingAmount);
        
        po.setSubtotal(subtotal);
        po.setDiscountAmount(discountAmount);
        po.setTaxAmount(taxAmount);
        po.setShippingAmount(shippingAmount);
        po.setGrandTotal(grandTotal);
    }

    private void applyPayload(PurchaseOrder target, PurchaseOrderPayload payload, PurchaseOrder existing) {
        target.setSupplierId(parseId(payload.supplierId()));
        target.setSupplierName(payload.supplierName());
        target.setSupplierCode(payload.supplierCode());
        target.setCurrency(firstNonNull(payload.currency(), existing != null ? existing.getCurrency() : "INR"));
        target.setExchangeRate(firstNonNull(payload.exchangeRate(), existing != null ? existing.getExchangeRate() : BigDecimal.ONE));
        target.setPaymentTerms(firstNonNull(payload.paymentTerms(), existing != null ? existing.getPaymentTerms() : null));
        target.setDeliveryDate(firstNonNull(payload.deliveryDate(), existing != null ? existing.getDeliveryDate() : null));
        target.setDeliveryAddress(firstNonNull(payload.deliveryAddress(), existing != null ? existing.getDeliveryAddress() : null));
        target.setNotes(firstNonNull(payload.notes(), existing != null ? existing.getNotes() : null));
        
        // Handle lines
        if (payload.lines() != null) {
            target.getLines().clear();
            for (var linePayload : payload.lines()) {
                PurchaseOrderLine line = new PurchaseOrderLine();
                line.setId(UUID.randomUUID());
                line.setItemId(parseId(linePayload.itemId()));
                line.setItemCode(linePayload.itemCode());
                line.setItemDescription(linePayload.itemDescription());
                line.setQuantity(linePayload.quantity());
                line.setUnitPrice(linePayload.unitPrice());
                line.setDiscountPercent(linePayload.discountPercent());
                line.setTaxPercent(linePayload.taxPercent());
                
                // Calculate derived fields
                BigDecimal lineTotal = line.getUnitPrice().multiply(line.getQuantity());
                BigDecimal discountAmount = lineTotal.multiply(line.getDiscountPercent().divide(BigDecimal.valueOf(100)));
                BigDecimal taxAmount = lineTotal.multiply(line.getTaxPercent().divide(BigDecimal.valueOf(100)));
                
                line.setDiscountAmount(discountAmount);
                line.setTaxAmount(taxAmount);
                line.setLineTotal(lineTotal.subtract(discountAmount).add(taxAmount));
                line.setReceivedQuantity(BigDecimal.ZERO);
                line.setPendingQuantity(line.getQuantity());
                
                target.addLine(line);
            }
        }
    }

    private PurchaseOrderDto toDto(PurchaseOrder po) {
        var lineDtos = po.getLines().stream()
            .map(line -> new PurchaseOrderDto.PurchaseOrderLineDto(
                line.getId().toString(),
                line.getItemId().toString(),
                line.getItemCode(),
                line.getItemDescription(),
                line.getQuantity(),
                line.getUnitPrice(),
                line.getDiscountPercent(),
                line.getDiscountAmount(),
                line.getTaxPercent(),
                line.getTaxAmount(),
                line.getLineTotal(),
                line.getReceivedQuantity(),
                line.getPendingQuantity(),
                safeOffset(line.getCreatedAt()),
                safeOffset(line.getUpdatedAt())
            ))
            .collect(Collectors.toList());

        return new PurchaseOrderDto(
            po.getId().toString(),
            po.getPoNumber(),
            safeOffset(po.getPoDate()),
            po.getSupplierId().toString(),
            po.getSupplierName(),
            po.getSupplierCode(),
            po.getStatus(),
            po.getCurrency(),
            po.getExchangeRate(),
            po.getSubtotal(),
            po.getDiscountAmount(),
            po.getTaxAmount(),
            po.getShippingAmount(),
            po.getGrandTotal(),
            po.getPaymentTerms(),
            safeOffset(po.getDeliveryDate()),
            po.getDeliveryAddress(),
            po.getNotes(),
            po.getApprovedBy(),
            safeOffset(po.getApprovedAt()),
            safeOffset(po.getSentToSupplierAt()),
            safeOffset(po.getReceivedAt()),
            safeOffset(po.getClosedAt()),
            safeOffset(po.getCancelledAt()),
            safeOffset(po.getCreatedAt()),
            safeOffset(po.getUpdatedAt()),
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