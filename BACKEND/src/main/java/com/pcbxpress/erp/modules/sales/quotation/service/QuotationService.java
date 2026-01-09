package com.pcbxpress.erp.modules.sales.quotation.service;

import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.customer.service.CustomerService;
import com.pcbxpress.erp.modules.sales.quotation.dto.PcbSpecDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationLineDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationPayload;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationTotals;
import com.pcbxpress.erp.modules.sales.salesorder.service.SalesOrderService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class QuotationService {

    private final Map<String, QuotationDto> quotations = new ConcurrentHashMap<>();
    private final AtomicInteger sequence = new AtomicInteger(3);
    private final CustomerService customerService;
    private final SalesOrderService salesOrderService;

    public QuotationService(CustomerService customerService, SalesOrderService salesOrderService) {
        this.customerService = customerService;
        this.salesOrderService = salesOrderService;
    }

    public List<QuotationDto> list(String query, String status) {
        return quotations.values().stream()
            .filter(q -> query == null || matchesQuery(q, query))
            .filter(q -> status == null || status.isBlank() || status.equalsIgnoreCase("all")
                || q.status().equalsIgnoreCase(status))
            .sorted(Comparator.comparing(QuotationDto::createdAt).reversed())
            .toList();
    }

    public QuotationDto get(String id) {
        QuotationDto dto = quotations.get(id);
        if (dto == null) {
            throw new NoSuchElementException("Quotation not found: " + id);
        }
        return dto;
    }

    public QuotationDto create(QuotationPayload payload) {
        String id = UUID.randomUUID().toString();
        String quoteNo = payload.quoteNo() != null && !payload.quoteNo().isBlank()
            ? payload.quoteNo()
            : nextNumber();
        LocalDate quoteDate = payload.quoteDate() != null ? payload.quoteDate() : LocalDate.now();
        LocalDate validUntil = payload.validUntil() != null ? payload.validUntil() : quoteDate.plusDays(14);
        QuotationTotals totals = payload.totals() != null ? payload.totals() : calculateTotals(payload.lines());
        OffsetDateTime now = OffsetDateTime.now();
        QuotationDto dto = toDto(id, quoteNo, quoteDate, validUntil, totals, payload, now, now);
        quotations.put(id, dto);
        return dto;
    }

    public QuotationDto update(String id, QuotationPayload payload) {
        QuotationDto existing = get(id);
        String quoteNo = payload.quoteNo() != null ? payload.quoteNo() : existing.quoteNo();
        LocalDate quoteDate = payload.quoteDate() != null ? payload.quoteDate() : existing.quoteDate();
        LocalDate validUntil = payload.validUntil() != null ? payload.validUntil() : existing.validUntil();
        QuotationTotals totals = payload.totals() != null ? payload.totals() : existing.totals();
        QuotationDto updated = toDto(
            id,
            quoteNo,
            quoteDate,
            validUntil,
            totals,
            merge(existing, payload),
            existing.createdAt(),
            OffsetDateTime.now()
        );
        quotations.put(id, updated);
        return updated;
    }

    public void delete(String id) {
        quotations.remove(id);
    }

    public QuotationDto updateNote(String id, String note) {
        QuotationDto existing = get(id);
        QuotationPayload payload = new QuotationPayload(
            existing.quoteNo(),
            existing.quoteDate(),
            existing.validUntil(),
            existing.customerId(),
            existing.rfqRef(),
            existing.currency(),
            existing.incoterms(),
            existing.leadTime(),
            existing.paymentTerms(),
            existing.remarks(),
            existing.pcb(),
            existing.lines(),
            existing.totals(),
            existing.status(),
            note
        );
        return update(id, payload);
    }

    public QuotationDto markSent(String id) {
        QuotationDto existing = get(id);
        QuotationPayload payload = new QuotationPayload(
            existing.quoteNo(),
            existing.quoteDate(),
            existing.validUntil(),
            existing.customerId(),
            existing.rfqRef(),
            existing.currency(),
            existing.incoterms(),
            existing.leadTime(),
            existing.paymentTerms(),
            existing.remarks(),
            existing.pcb(),
            existing.lines(),
            existing.totals(),
            "Sent",
            existing.internalNote()
        );
        return update(id, payload);
    }

    public Map<String, Object> convertToSalesOrder(String id) {
        QuotationDto quotation = get(id);
        String salesOrderId = salesOrderService.createFromQuotation(quotation).id();
        return Map.of(
            "salesOrderId", salesOrderId,
            "quotationId", id
        );
    }

    public String exportCsv(List<QuotationDto> data) {
        String header = "Quote No,Customer,Date,Valid Until,Status,Total";
        String rows = data.stream()
            .map(q -> String.join(",",
                safe(q.quoteNo()),
                safe(q.customer() != null ? q.customer().name() : ""),
                q.quoteDate() != null ? q.quoteDate().toString() : "",
                q.validUntil() != null ? q.validUntil().toString() : "",
                safe(q.status()),
                String.valueOf(q.totals() != null && q.totals().grandTotal() != null ? q.totals().grandTotal() : 0)
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    public String nextNumber() {
        int num = sequence.getAndIncrement();
        int year = Year.now().getValue();
        return String.format("QT-%d-%03d", year, num);
    }

    private QuotationDto toDto(String id, String quoteNo, LocalDate quoteDate, LocalDate validUntil,
                               QuotationTotals totals, QuotationPayload payload,
                               OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        CustomerSummary customer = null;
        if (payload.customerId() != null) {
            try {
                customer = customerService.summary(payload.customerId());
            } catch (NoSuchElementException e) {
                // Customer not found, set customer to null and continue gracefully
                customer = null;
            }
        }
        String status = payload.status() != null ? payload.status() : "Draft";
        List<QuotationLineDto> lines = payload.lines() != null ? payload.lines() : List.of();
        QuotationTotals computed = totals != null ? totals : calculateTotals(lines);
        return new QuotationDto(
            id,
            quoteNo,
            quoteDate,
            validUntil,
            status,
            payload.currency() != null ? payload.currency() : "INR",
            payload.incoterms() != null ? payload.incoterms() : "Ex-Works",
            payload.leadTime() != null ? payload.leadTime() : "7-10 working days",
            payload.paymentTerms() != null ? payload.paymentTerms() : "Advance / Net 15",
            payload.remarks(),
            payload.rfqRef(),
            payload.customerId(),
            customer,
            payload.pcb(),
            lines,
            computed,
            payload.internalNote(),
            createdAt,
            updatedAt
        );
    }

    private static boolean matchesQuery(QuotationDto dto, String query) {
        String q = query.toLowerCase();
        return contains(dto.quoteNo(), q)
            || contains(dto.customer() != null ? dto.customer().name() : null, q)
            || contains(dto.status(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }

    private static QuotationTotals calculateTotals(List<QuotationLineDto> lines) {
        double subTotal = 0;
        double discountTotal = 0;
        double taxTotal = 0;

        if (lines != null) {
            for (QuotationLineDto line : lines) {
                int qty = line.qty() != null ? line.qty() : 0;
                double unitPrice = line.unitPrice() != null ? line.unitPrice() : 0;
                double base = qty * unitPrice;
                double discount = base * ((line.discountPct() != null ? line.discountPct() : 0) / 100d);
                double taxable = base - discount;
                double taxPct = (line.cgst() != null ? line.cgst() : 0)
                    + (line.sgst() != null ? line.sgst() : 0)
                    + (line.igst() != null ? line.igst() : 0);
                double tax = taxable * (taxPct / 100d);

                subTotal += base;
                discountTotal += discount;
                taxTotal += tax;
            }
        }
        double grandTotal = subTotal - discountTotal + taxTotal;
        return new QuotationTotals(subTotal, discountTotal, taxTotal, grandTotal);
    }

    private static QuotationPayload merge(QuotationDto existing, QuotationPayload payload) {
        return new QuotationPayload(
            first(payload.quoteNo(), existing.quoteNo()),
            first(payload.quoteDate(), existing.quoteDate()),
            first(payload.validUntil(), existing.validUntil()),
            first(payload.customerId(), existing.customerId()),
            first(payload.rfqRef(), existing.rfqRef()),
            first(payload.currency(), existing.currency()),
            first(payload.incoterms(), existing.incoterms()),
            first(payload.leadTime(), existing.leadTime()),
            first(payload.paymentTerms(), existing.paymentTerms()),
            first(payload.remarks(), existing.remarks()),
            payload.pcb() != null ? payload.pcb() : existing.pcb(),
            payload.lines() != null ? payload.lines() : existing.lines(),
            payload.totals() != null ? payload.totals() : existing.totals(),
            first(payload.status(), existing.status()),
            first(payload.internalNote(), existing.internalNote())
        );
    }


    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static <T> T first(T candidate, T fallback) {
        return candidate != null ? candidate : fallback;
    }
}
