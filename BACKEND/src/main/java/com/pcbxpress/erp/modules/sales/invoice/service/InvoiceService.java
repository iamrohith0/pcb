package com.pcbxpress.erp.modules.sales.invoice.service;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.customer.service.CustomerService;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceCharges;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceDto;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceItemDto;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoicePayload;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceTotals;
import com.pcbxpress.erp.modules.sales.invoice.model.Invoice;
import com.pcbxpress.erp.modules.sales.invoice.model.InvoiceItem;
import com.pcbxpress.erp.modules.sales.invoice.repository.InvoiceItemRepository;
import com.pcbxpress.erp.modules.sales.invoice.repository.InvoiceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

    private final CustomerService customerService;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;

    public InvoiceService(CustomerService customerService, InvoiceRepository invoiceRepository, InvoiceItemRepository invoiceItemRepository) {
        this.customerService = customerService;
        this.invoiceRepository = invoiceRepository;
        this.invoiceItemRepository = invoiceItemRepository;
    }

    public List<InvoiceDto> list(String query, String status, LocalDate from, LocalDate to) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Invoice> page = invoiceRepository.searchInvoices(query, status, from, to, pageable);
        return page.getContent().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public InvoiceDto get(String id) {
        Invoice invoice = invoiceRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + id));
        return toDto(invoice);
    }

    @Transactional
    public InvoiceDto create(InvoicePayload payload) {
        Invoice invoice = new Invoice();
        invoice.setId(UUID.randomUUID());
        invoice.setInvoiceNo(payload.invoiceNo() != null && !payload.invoiceNo().isBlank()
            ? payload.invoiceNo()
            : nextNumber());
        invoice.setInvoiceDate(payload.invoiceDate() != null ? payload.invoiceDate() : LocalDate.now());
        invoice.setDueDate(payload.dueDate() != null ? payload.dueDate() : invoice.getInvoiceDate().plusDays(30));
        invoice.setStatus(payload.sourceType() != null && payload.sourceType().equalsIgnoreCase("SALES_ORDER") ? "SENT" : "DRAFT");
        invoice.setCustomerId(payload.customerId() != null ? UUID.fromString(payload.customerId()) : null);
        invoice.setSourceType(payload.sourceType());
        invoice.setSourceOrderId(payload.sourceOrderId() != null ? UUID.fromString(payload.sourceOrderId()) : null);
        invoice.setCurrency(payload.currency() != null ? payload.currency() : "INR");
        invoice.setPlaceOfSupply(payload.placeOfSupply());
        
        // Set billing address
        if (payload.billing() != null) {
            invoice.setBillingName(payload.billing().name());
            invoice.setBillingAddressLine1(payload.billing().addressLine1());
            invoice.setBillingAddressLine2(payload.billing().addressLine2());
            invoice.setBillingCity(payload.billing().city());
            invoice.setBillingState(payload.billing().state());
            invoice.setBillingPincode(payload.billing().pincode());
            invoice.setBillingCountry(payload.billing().country());
            invoice.setBillingGstin(payload.billing().gstin());
        }
        
        // Set shipping address
        AddressDto shipping = payload.shipping() != null ? payload.shipping() : payload.billing();
        if (shipping != null) {
            invoice.setShippingName(shipping.name());
            invoice.setShippingAddressLine1(shipping.addressLine1());
            invoice.setShippingAddressLine2(shipping.addressLine2());
            invoice.setShippingCity(shipping.city());
            invoice.setShippingState(shipping.state());
            invoice.setShippingPincode(shipping.pincode());
            invoice.setShippingCountry(shipping.country());
            invoice.setShippingGstin(shipping.gstin());
        }
        
        // Set charges
        InvoiceCharges charges = payload.charges() != null ? payload.charges() : new InvoiceCharges(0.0, 0.0, 0.0);
        invoice.setChargesPacking(charges.packing() != null ? BigDecimal.valueOf(charges.packing()) : BigDecimal.ZERO);
        invoice.setChargesShipping(charges.shipping() != null ? BigDecimal.valueOf(charges.shipping()) : BigDecimal.ZERO);
        invoice.setChargesOther(charges.other() != null ? BigDecimal.valueOf(charges.other()) : BigDecimal.ZERO);
        invoice.setTcsPct(payload.tcsPct() != null ? BigDecimal.valueOf(payload.tcsPct()) : BigDecimal.ZERO);
        invoice.setRounding(payload.rounding() != null ? BigDecimal.valueOf(payload.rounding()) : BigDecimal.ZERO);
        
        invoice.setNotes(payload.notes());
        invoice.setTerms(payload.terms());
        
        // Calculate totals
        InvoiceTotals totals = payload.totals() != null ? payload.totals() : calculateTotals(payload.items(), charges, payload.tcsPct(), payload.rounding());
        invoice.setSubTotal(totals.subTotal() != null ? BigDecimal.valueOf(totals.subTotal()) : BigDecimal.ZERO);
        invoice.setDiscountTotal(totals.discountTotal() != null ? BigDecimal.valueOf(totals.discountTotal()) : BigDecimal.ZERO);
        invoice.setTaxableTotal(totals.taxableTotal() != null ? BigDecimal.valueOf(totals.taxableTotal()) : BigDecimal.ZERO);
        invoice.setTaxTotal(totals.taxTotal() != null ? BigDecimal.valueOf(totals.taxTotal()) : BigDecimal.ZERO);
        invoice.setChargeTotal(totals.chargeTotal() != null ? BigDecimal.valueOf(totals.chargeTotal()) : BigDecimal.ZERO);
        invoice.setTcs(totals.tcs() != null ? BigDecimal.valueOf(totals.tcs()) : BigDecimal.ZERO);
        invoice.setRoundingTotal(totals.rounding() != null ? BigDecimal.valueOf(totals.rounding()) : BigDecimal.ZERO);
        invoice.setGrandTotal(totals.grandTotal() != null ? BigDecimal.valueOf(totals.grandTotal()) : BigDecimal.ZERO);
        
        // Save invoice first
        invoice = invoiceRepository.save(invoice);
        
        // Save items
        if (payload.items() != null) {
            for (InvoiceItemDto itemDto : payload.items()) {
                InvoiceItem item = new InvoiceItem();
                item.setId(UUID.randomUUID());
                item.setInvoice(invoice);
                item.setDescription(itemDto.description());
                item.setHsn(itemDto.hsn());
                item.setQty(itemDto.qty());
                item.setUom(itemDto.uom());
                item.setUnitPrice(itemDto.unitPrice() != null ? BigDecimal.valueOf(itemDto.unitPrice()) : BigDecimal.ZERO);
                item.setDiscountPct(itemDto.discountPct() != null ? BigDecimal.valueOf(itemDto.discountPct()) : BigDecimal.ZERO);
                item.setTaxPct(itemDto.taxPct() != null ? BigDecimal.valueOf(itemDto.taxPct()) : BigDecimal.ZERO);
                invoiceItemRepository.save(item);
            }
        }
        
        return toDto(invoice);
    }

    @Transactional
    public InvoiceDto update(String id, InvoicePayload payload) {
        Invoice existing = invoiceRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + id));
        
        // Update basic fields
        if (payload.invoiceNo() != null) existing.setInvoiceNo(payload.invoiceNo());
        if (payload.invoiceDate() != null) existing.setInvoiceDate(payload.invoiceDate());
        if (payload.dueDate() != null) existing.setDueDate(payload.dueDate());
        if (payload.customerId() != null) existing.setCustomerId(UUID.fromString(payload.customerId()));
        if (payload.sourceType() != null) existing.setSourceType(payload.sourceType());
        if (payload.sourceOrderId() != null) existing.setSourceOrderId(UUID.fromString(payload.sourceOrderId()));
        if (payload.currency() != null) existing.setCurrency(payload.currency());
        if (payload.placeOfSupply() != null) existing.setPlaceOfSupply(payload.placeOfSupply());
        if (payload.notes() != null) existing.setNotes(payload.notes());
        if (payload.terms() != null) existing.setTerms(payload.terms());
        
        // Update billing address
        if (payload.billing() != null) {
            existing.setBillingName(payload.billing().name());
            existing.setBillingAddressLine1(payload.billing().addressLine1());
            existing.setBillingAddressLine2(payload.billing().addressLine2());
            existing.setBillingCity(payload.billing().city());
            existing.setBillingState(payload.billing().state());
            existing.setBillingPincode(payload.billing().pincode());
            existing.setBillingCountry(payload.billing().country());
            existing.setBillingGstin(payload.billing().gstin());
        }
        
        // Update shipping address
        AddressDto shipping = payload.shipping() != null ? payload.shipping() : payload.billing();
        if (shipping != null) {
            existing.setShippingName(shipping.name());
            existing.setShippingAddressLine1(shipping.addressLine1());
            existing.setShippingAddressLine2(shipping.addressLine2());
            existing.setShippingCity(shipping.city());
            existing.setShippingState(shipping.state());
            existing.setShippingPincode(shipping.pincode());
            existing.setShippingCountry(shipping.country());
            existing.setShippingGstin(shipping.gstin());
        }
        
        // Update charges
        InvoiceCharges charges = payload.charges() != null ? payload.charges() : new InvoiceCharges(0.0, 0.0, 0.0);
        existing.setChargesPacking(charges.packing() != null ? BigDecimal.valueOf(charges.packing()) : BigDecimal.ZERO);
        existing.setChargesShipping(charges.shipping() != null ? BigDecimal.valueOf(charges.shipping()) : BigDecimal.ZERO);
        existing.setChargesOther(charges.other() != null ? BigDecimal.valueOf(charges.other()) : BigDecimal.ZERO);
        existing.setTcsPct(payload.tcsPct() != null ? BigDecimal.valueOf(payload.tcsPct()) : BigDecimal.ZERO);
        existing.setRounding(payload.rounding() != null ? BigDecimal.valueOf(payload.rounding()) : BigDecimal.ZERO);
        
        // Recalculate totals
        InvoiceTotals totals = payload.totals() != null ? payload.totals() : calculateTotals(payload.items(), charges, payload.tcsPct(), payload.rounding());
        existing.setSubTotal(totals.subTotal() != null ? BigDecimal.valueOf(totals.subTotal()) : BigDecimal.ZERO);
        existing.setDiscountTotal(totals.discountTotal() != null ? BigDecimal.valueOf(totals.discountTotal()) : BigDecimal.ZERO);
        existing.setTaxableTotal(totals.taxableTotal() != null ? BigDecimal.valueOf(totals.taxableTotal()) : BigDecimal.ZERO);
        existing.setTaxTotal(totals.taxTotal() != null ? BigDecimal.valueOf(totals.taxTotal()) : BigDecimal.ZERO);
        existing.setChargeTotal(totals.chargeTotal() != null ? BigDecimal.valueOf(totals.chargeTotal()) : BigDecimal.ZERO);
        existing.setTcs(totals.tcs() != null ? BigDecimal.valueOf(totals.tcs()) : BigDecimal.ZERO);
        existing.setRoundingTotal(totals.rounding() != null ? BigDecimal.valueOf(totals.rounding()) : BigDecimal.ZERO);
        existing.setGrandTotal(totals.grandTotal() != null ? BigDecimal.valueOf(totals.grandTotal()) : BigDecimal.ZERO);
        
        // Update items
        if (payload.items() != null) {
            // Delete existing items
            invoiceItemRepository.deleteByInvoiceId(existing.getId());
            
            // Save new items
            for (InvoiceItemDto itemDto : payload.items()) {
                InvoiceItem item = new InvoiceItem();
                item.setId(UUID.randomUUID());
                item.setInvoice(existing);
                item.setDescription(itemDto.description());
                item.setHsn(itemDto.hsn());
                item.setQty(itemDto.qty());
                item.setUom(itemDto.uom());
                item.setUnitPrice(itemDto.unitPrice() != null ? BigDecimal.valueOf(itemDto.unitPrice()) : BigDecimal.ZERO);
                item.setDiscountPct(itemDto.discountPct() != null ? BigDecimal.valueOf(itemDto.discountPct()) : BigDecimal.ZERO);
                item.setTaxPct(itemDto.taxPct() != null ? BigDecimal.valueOf(itemDto.taxPct()) : BigDecimal.ZERO);
                invoiceItemRepository.save(item);
            }
        }
        
        existing = invoiceRepository.save(existing);
        return toDto(existing);
    }

    @Transactional
    public void delete(String id) {
        UUID invoiceId = UUID.fromString(id);
        invoiceItemRepository.deleteByInvoiceId(invoiceId);
        invoiceRepository.deleteById(invoiceId);
    }

    @Transactional
    public InvoiceDto markSent(String id) {
        Invoice invoice = invoiceRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + id));
        invoice.setStatus("SENT");
        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    @Transactional
    public InvoiceDto markPaid(String id) {
        Invoice invoice = invoiceRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + id));
        invoice.setStatus("PAID");
        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    @Transactional
    public InvoiceDto cancel(String id, String reason) {
        Invoice invoice = invoiceRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + id));
        invoice.setStatus("CANCELLED");
        if (reason != null) {
            invoice.setNotes(reason);
        }
        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    public Map<String, Object> stats() {
        long total = invoiceRepository.count();
        long sent = invoiceRepository.countByStatus("SENT");
        long paid = invoiceRepository.countByStatus("PAID");
        long cancelled = invoiceRepository.countByStatus("CANCELLED");
        return Map.of(
            "total", total,
            "sent", sent,
            "paid", paid,
            "cancelled", cancelled
        );
    }

    public String exportCsv(List<InvoiceDto> data) {
        String header = "Invoice No,Customer,Date,Status,Amount";
        String rows = data.stream()
            .map(inv -> String.join(",",
                safe(inv.invoiceNo()),
                safe(inv.customer() != null ? inv.customer().name() : ""),
                inv.invoiceDate() != null ? inv.invoiceDate().toString() : "",
                safe(inv.status()),
                String.valueOf(inv.totals() != null && inv.totals().grandTotal() != null ? inv.totals().grandTotal() : 0)
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    public String nextNumber() {
        // Simple implementation - in production you might want to use a sequence or check existing numbers
        int year = Year.now().getValue();
        return String.format("INV-%d-%03d", year, 1);
    }

    private InvoiceDto toDto(Invoice invoice) {
        CustomerSummary customer = invoice.getCustomerId() != null ? customerService.summary(invoice.getCustomerId().toString()) : null;
        List<InvoiceItemDto> items = invoice.getItems().stream()
            .map(item -> new InvoiceItemDto(
                item.getId().toString(),
                item.getDescription(),
                item.getHsn(),
                item.getQty(),
                item.getUom(),
                item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0.0,
                item.getDiscountPct() != null ? item.getDiscountPct().doubleValue() : 0.0,
                item.getTaxPct() != null ? item.getTaxPct().doubleValue() : 0.0
            ))
            .collect(Collectors.toList());
        
        InvoiceCharges charges = new InvoiceCharges(
            invoice.getChargesPacking() != null ? invoice.getChargesPacking().doubleValue() : 0.0,
            invoice.getChargesShipping() != null ? invoice.getChargesShipping().doubleValue() : 0.0,
            invoice.getChargesOther() != null ? invoice.getChargesOther().doubleValue() : 0.0
        );
        
        InvoiceTotals totals = new InvoiceTotals(
            invoice.getSubTotal() != null ? invoice.getSubTotal().doubleValue() : 0.0,
            invoice.getDiscountTotal() != null ? invoice.getDiscountTotal().doubleValue() : 0.0,
            invoice.getTaxableTotal() != null ? invoice.getTaxableTotal().doubleValue() : 0.0,
            invoice.getTaxTotal() != null ? invoice.getTaxTotal().doubleValue() : 0.0,
            invoice.getChargeTotal() != null ? invoice.getChargeTotal().doubleValue() : 0.0,
            invoice.getTcs() != null ? invoice.getTcs().doubleValue() : 0.0,
            invoice.getRoundingTotal() != null ? invoice.getRoundingTotal().doubleValue() : 0.0,
            invoice.getGrandTotal() != null ? invoice.getGrandTotal().doubleValue() : 0.0
        );
        
        AddressDto billing = new AddressDto(
            invoice.getBillingName(),
            invoice.getBillingAddressLine1(),
            invoice.getBillingAddressLine2(),
            invoice.getBillingCity(),
            invoice.getBillingState(),
            invoice.getBillingPincode(),
            invoice.getBillingCountry(),
            invoice.getBillingGstin()
        );
        
        AddressDto shipping = new AddressDto(
            invoice.getShippingName(),
            invoice.getShippingAddressLine1(),
            invoice.getShippingAddressLine2(),
            invoice.getShippingCity(),
            invoice.getShippingState(),
            invoice.getShippingPincode(),
            invoice.getShippingCountry(),
            invoice.getShippingGstin()
        );
        
        return new InvoiceDto(
            invoice.getId().toString(),
            invoice.getInvoiceNo(),
            invoice.getInvoiceDate(),
            invoice.getDueDate(),
            invoice.getStatus(),
            invoice.getCustomerId() != null ? invoice.getCustomerId().toString() : null,
            customer,
            invoice.getSourceType(),
            invoice.getSourceOrderId() != null ? invoice.getSourceOrderId().toString() : null,
            invoice.getCurrency(),
            invoice.getPlaceOfSupply(),
            billing,
            shipping,
            items,
            charges,
            invoice.getTcsPct() != null ? invoice.getTcsPct().doubleValue() : 0.0,
            invoice.getRounding() != null ? invoice.getRounding().doubleValue() : 0.0,
            invoice.getNotes(),
            invoice.getTerms(),
            totals,
            invoice.getCreatedAt(),
            invoice.getUpdatedAt()
        );
    }

    private static InvoiceTotals calculateTotals(List<InvoiceItemDto> items, InvoiceCharges charges,
                                                 Double tcsPct, Double rounding) {
        double subTotal = 0;
        double discountTotal = 0;
        double taxTotal = 0;

        if (items != null) {
            for (InvoiceItemDto it : items) {
                int qty = it.qty() != null ? it.qty() : 0;
                double unit = it.unitPrice() != null ? it.unitPrice() : 0;
                double base = qty * unit;
                double discount = base * ((it.discountPct() != null ? it.discountPct() : 0) / 100d);
                double taxable = base - discount;
                double tax = taxable * ((it.taxPct() != null ? it.taxPct() : 0) / 100d);

                subTotal += base;
                discountTotal += discount;
                taxTotal += tax;
            }
        }
        double chargeTotal = charges != null
            ? (charges.packing() != null ? charges.packing() : 0.0) +
              (charges.shipping() != null ? charges.shipping() : 0.0) +
              (charges.other() != null ? charges.other() : 0.0)
            : 0;
        double taxableTotal = subTotal - discountTotal;
        double beforeTcs = taxableTotal + taxTotal + chargeTotal;
        double tcs = beforeTcs * ((tcsPct != null ? tcsPct : 0) / 100d);
        double grandTotal = beforeTcs + tcs + (rounding != null ? rounding : 0);
        return new InvoiceTotals(subTotal, discountTotal, taxableTotal, taxTotal, chargeTotal, tcs, rounding, grandTotal);
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}
