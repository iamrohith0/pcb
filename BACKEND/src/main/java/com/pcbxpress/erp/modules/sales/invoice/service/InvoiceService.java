package com.pcbxpress.erp.modules.sales.invoice.service;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.customer.service.CustomerService;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceCharges;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceDto;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceItemDto;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoicePayload;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceTotals;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class InvoiceService {

    private final Map<String, InvoiceDto> invoices = new ConcurrentHashMap<>();
    private final AtomicInteger sequence = new AtomicInteger(3);
    private final CustomerService customerService;

    public InvoiceService(CustomerService customerService) {
        this.customerService = customerService;
    }

    public List<InvoiceDto> list(String query, String status, LocalDate from, LocalDate to) {
        return invoices.values().stream()
            .filter(inv -> query == null || matchesQuery(inv, query))
            .filter(inv -> status == null || status.isBlank() || inv.status().equalsIgnoreCase(status))
            .filter(inv -> from == null || (inv.invoiceDate() != null && !inv.invoiceDate().isBefore(from)))
            .filter(inv -> to == null || (inv.invoiceDate() != null && !inv.invoiceDate().isAfter(to)))
            .sorted(Comparator.comparing(InvoiceDto::createdAt).reversed())
            .toList();
    }

    public InvoiceDto get(String id) {
        InvoiceDto dto = invoices.get(id);
        if (dto == null) {
            throw new NoSuchElementException("Invoice not found: " + id);
        }
        return dto;
    }

    public InvoiceDto create(InvoicePayload payload) {
        String id = UUID.randomUUID().toString();
        String invoiceNo = payload.invoiceNo() != null && !payload.invoiceNo().isBlank()
            ? payload.invoiceNo()
            : nextNumber();
        LocalDate invoiceDate = payload.invoiceDate() != null ? payload.invoiceDate() : LocalDate.now();
        LocalDate dueDate = payload.dueDate() != null ? payload.dueDate() : invoiceDate.plusDays(30);
        InvoiceTotals totals = payload.totals() != null ? payload.totals() : calculateTotals(payload.items(), payload.charges(), payload.tcsPct(), payload.rounding());
        OffsetDateTime now = OffsetDateTime.now();
        InvoiceDto dto = toDto(id, invoiceNo, invoiceDate, dueDate, totals, payload, now, now);
        invoices.put(id, dto);
        return dto;
    }

    public InvoiceDto update(String id, InvoicePayload payload) {
        InvoiceDto existing = get(id);
        String invoiceNo = payload.invoiceNo() != null ? payload.invoiceNo() : existing.invoiceNo();
        LocalDate invoiceDate = payload.invoiceDate() != null ? payload.invoiceDate() : existing.invoiceDate();
        LocalDate dueDate = payload.dueDate() != null ? payload.dueDate() : existing.dueDate();
        InvoiceTotals totals = payload.totals() != null ? payload.totals() : existing.totals();
        InvoiceDto updated = toDto(
            id,
            invoiceNo,
            invoiceDate,
            dueDate,
            totals,
            merge(existing, payload),
            existing.createdAt(),
            OffsetDateTime.now()
        );
        invoices.put(id, updated);
        return updated;
    }

    public void delete(String id) {
        invoices.remove(id);
    }

    public InvoiceDto markSent(String id) {
        InvoiceDto existing = get(id);
        InvoiceDto updated = new InvoiceDto(
            existing.id(),
            existing.invoiceNo(),
            existing.invoiceDate(),
            existing.dueDate(),
            "SENT",
            existing.customerId(),
            existing.customer(),
            existing.sourceType(),
            existing.sourceOrderId(),
            existing.currency(),
            existing.placeOfSupply(),
            existing.billing(),
            existing.shipping(),
            existing.items(),
            existing.charges(),
            existing.tcsPct(),
            existing.rounding(),
            existing.notes(),
            existing.terms(),
            existing.totals(),
            existing.createdAt(),
            OffsetDateTime.now()
        );
        invoices.put(id, updated);
        return updated;
    }

    public InvoiceDto markPaid(String id) {
        InvoiceDto existing = get(id);
        InvoiceDto updated = new InvoiceDto(
            existing.id(),
            existing.invoiceNo(),
            existing.invoiceDate(),
            existing.dueDate(),
            "PAID",
            existing.customerId(),
            existing.customer(),
            existing.sourceType(),
            existing.sourceOrderId(),
            existing.currency(),
            existing.placeOfSupply(),
            existing.billing(),
            existing.shipping(),
            existing.items(),
            existing.charges(),
            existing.tcsPct(),
            existing.rounding(),
            existing.notes(),
            existing.terms(),
            existing.totals(),
            existing.createdAt(),
            OffsetDateTime.now()
        );
        invoices.put(id, updated);
        return updated;
    }

    public InvoiceDto cancel(String id, String reason) {
        InvoiceDto existing = get(id);
        InvoiceDto updated = new InvoiceDto(
            existing.id(),
            existing.invoiceNo(),
            existing.invoiceDate(),
            existing.dueDate(),
            "CANCELLED",
            existing.customerId(),
            existing.customer(),
            existing.sourceType(),
            existing.sourceOrderId(),
            existing.currency(),
            existing.placeOfSupply(),
            existing.billing(),
            existing.shipping(),
            existing.items(),
            existing.charges(),
            existing.tcsPct(),
            existing.rounding(),
            reason != null ? reason : existing.notes(),
            existing.terms(),
            existing.totals(),
            existing.createdAt(),
            OffsetDateTime.now()
        );
        invoices.put(id, updated);
        return updated;
    }

    public Map<String, Object> stats() {
        long total = invoices.size();
        long sent = invoices.values().stream().filter(i -> "SENT".equalsIgnoreCase(i.status())).count();
        long paid = invoices.values().stream().filter(i -> "PAID".equalsIgnoreCase(i.status())).count();
        long cancelled = invoices.values().stream().filter(i -> "CANCELLED".equalsIgnoreCase(i.status())).count();
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
        int num = sequence.getAndIncrement();
        int year = Year.now().getValue();
        return String.format("INV-%d-%03d", year, num);
    }

    private InvoiceDto toDto(String id, String invoiceNo, LocalDate invoiceDate, LocalDate dueDate,
                             InvoiceTotals totals, InvoicePayload payload,
                             OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        CustomerSummary customer = payload.customerId() != null ? customerService.summary(payload.customerId()) : null;
        List<InvoiceItemDto> items = payload.items() != null ? payload.items() : List.of();
        InvoiceCharges charges = payload.charges() != null ? payload.charges() : new InvoiceCharges(0.0, 0.0, 0.0);
        InvoiceTotals computedTotals = totals != null ? totals : calculateTotals(items, charges, payload.tcsPct(), payload.rounding());
        AddressDto billing = payload.billing() != null ? payload.billing() : new AddressDto(null, null, null, null, null, null, "India", null);
        AddressDto shipping = payload.shipping() != null ? payload.shipping() : billing;
        return new InvoiceDto(
            id,
            invoiceNo,
            invoiceDate,
            dueDate,
            payload.sourceType() != null && payload.sourceType().equalsIgnoreCase("SALES_ORDER") ? "SENT" : "DRAFT",
            payload.customerId(),
            customer,
            payload.sourceType(),
            payload.sourceOrderId(),
            payload.currency() != null ? payload.currency() : "INR",
            payload.placeOfSupply(),
            billing,
            shipping,
            items,
            charges,
            payload.tcsPct() != null ? payload.tcsPct() : 0.0,
            payload.rounding() != null ? payload.rounding() : 0.0,
            payload.notes(),
            payload.terms(),
            computedTotals,
            createdAt,
            updatedAt
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
            ? (value(charges.packing()) + value(charges.shipping()) + value(charges.other()))
            : 0;
        double taxableTotal = subTotal - discountTotal;
        double beforeTcs = taxableTotal + taxTotal + chargeTotal;
        double tcs = beforeTcs * ((tcsPct != null ? tcsPct : 0) / 100d);
        double grandTotal = beforeTcs + tcs + (rounding != null ? rounding : 0);
        return new InvoiceTotals(subTotal, discountTotal, taxableTotal, taxTotal, chargeTotal, tcs, rounding, grandTotal);
    }

    private static boolean matchesQuery(InvoiceDto invoice, String query) {
        String q = query.toLowerCase(Locale.ROOT);
        return contains(invoice.invoiceNo(), q)
            || contains(invoice.customer() != null ? invoice.customer().name() : null, q)
            || contains(invoice.status(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static InvoicePayload merge(InvoiceDto existing, InvoicePayload payload) {
        return new InvoicePayload(
            first(payload.invoiceNo(), existing.invoiceNo()),
            first(payload.invoiceDate(), existing.invoiceDate()),
            first(payload.dueDate(), existing.dueDate()),
            first(payload.customerId(), existing.customerId()),
            first(payload.sourceType(), existing.sourceType()),
            first(payload.sourceOrderId(), existing.sourceOrderId()),
            first(payload.currency(), existing.currency()),
            first(payload.placeOfSupply(), existing.placeOfSupply()),
            payload.billing() != null ? payload.billing() : existing.billing(),
            payload.shipping() != null ? payload.shipping() : existing.shipping(),
            payload.items() != null ? payload.items() : existing.items(),
            payload.charges() != null ? payload.charges() : existing.charges(),
            payload.tcsPct() != null ? payload.tcsPct() : existing.tcsPct(),
            payload.rounding() != null ? payload.rounding() : existing.rounding(),
            first(payload.notes(), existing.notes()),
            first(payload.terms(), existing.terms()),
            payload.totals() != null ? payload.totals() : existing.totals()
        );
    }

    private static double value(Double v) {
        return v != null ? v : 0;
    }

    private static <T> T first(T candidate, T fallback) {
        return candidate != null ? candidate : fallback;
    }
}
