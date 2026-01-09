package com.pcbxpress.erp.modules.sales.salesorder.service;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.customer.service.CustomerService;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationLineDto;
import com.pcbxpress.erp.modules.sales.salesorder.dto.ContactDto;
import com.pcbxpress.erp.modules.sales.salesorder.dto.JobInfo;
import com.pcbxpress.erp.modules.sales.salesorder.dto.PoInfo;
import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderAddresses;
import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderDto;
import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderItemDto;
import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderPayload;
import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderTotalsDto;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
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
public class SalesOrderService {

    private final Map<String, SalesOrderDto> orders = new ConcurrentHashMap<>();
    private final AtomicInteger sequence = new AtomicInteger(3);
    private final CustomerService customerService;

    public SalesOrderService(CustomerService customerService) {
        this.customerService = customerService;
    }

    public List<SalesOrderDto> list(String query, String status, LocalDate from, LocalDate to) {
        return orders.values().stream()
            .filter(o -> query == null || matchesQuery(o, query))
            .filter(o -> status == null || status.isBlank() || "all".equalsIgnoreCase(status)
                || o.status().equalsIgnoreCase(status))
            .filter(o -> from == null || (o.orderDate() != null && !o.orderDate().isBefore(from)))
            .filter(o -> to == null || (o.orderDate() != null && !o.orderDate().isAfter(to)))
            .sorted(Comparator.comparing(SalesOrderDto::createdAt).reversed())
            .toList();
    }

    public SalesOrderDto get(String id) {
        SalesOrderDto dto = orders.get(id);
        if (dto == null) {
            throw new NoSuchElementException("Sales Order not found: " + id);
        }
        return dto;
    }

    public SalesOrderDto create(SalesOrderPayload payload) {
        String id = UUID.randomUUID().toString();
        String orderNo = payload.orderNo() != null && !payload.orderNo().isBlank()
            ? payload.orderNo()
            : nextNumber();
        LocalDate orderDate = payload.orderDate() != null ? payload.orderDate() : LocalDate.now();
        SalesOrderTotalsDto totals = payload.totals() != null ? payload.totals() : calculateTotals(payload.items());
        OffsetDateTime now = OffsetDateTime.now();
        SalesOrderDto dto = toDto(id, orderNo, orderDate, totals, payload, now, now);
        orders.put(id, dto);
        return dto;
    }

    public SalesOrderDto update(String id, SalesOrderPayload payload) {
        SalesOrderDto existing = get(id);
        String orderNo = payload.orderNo() != null ? payload.orderNo() : existing.orderNo();
        LocalDate orderDate = payload.orderDate() != null ? payload.orderDate() : existing.orderDate();
        SalesOrderTotalsDto totals = payload.totals() != null ? payload.totals() : existing.totals();

        SalesOrderDto updated = toDto(
            id,
            orderNo,
            orderDate,
            totals,
            merge(existing, payload),
            existing.createdAt(),
            OffsetDateTime.now()
        );
        orders.put(id, updated);
        return updated;
    }

    public void delete(String id) {
        orders.remove(id);
    }

    public SalesOrderDto updateStatus(String id, String status) {
        SalesOrderDto existing = get(id);
        SalesOrderPayload payload = new SalesOrderPayload(
            existing.orderNo(),
            existing.orderDate(),
            existing.customerId(),
            existing.contact(),
            existing.po(),
            existing.job(),
            existing.addresses(),
            existing.notes(),
            existing.items(),
            existing.totals(),
            status,
            existing.currency()
        );
        return update(id, payload);
    }

    public List<SalesOrderItemDto> items(String id) {
        return get(id).items();
    }

    public SalesOrderDto addItem(String id, SalesOrderItemDto item) {
        SalesOrderDto existing = get(id);
        List<SalesOrderItemDto> next = new ArrayList<>(existing.items());
        next.add(item);
        SalesOrderTotalsDto totals = calculateTotals(next);
        SalesOrderPayload payload = new SalesOrderPayload(
            existing.orderNo(),
            existing.orderDate(),
            existing.customerId(),
            existing.contact(),
            existing.po(),
            existing.job(),
            existing.addresses(),
            existing.notes(),
            next,
            totals,
            existing.status(),
            existing.currency()
        );
        return update(id, payload);
    }

    public SalesOrderDto updateItem(String orderId, String itemId, SalesOrderItemDto item) {
        SalesOrderDto existing = get(orderId);
        List<SalesOrderItemDto> next = existing.items().stream()
            .map(it -> it.id().equals(itemId) ? item : it)
            .toList();
        SalesOrderTotalsDto totals = calculateTotals(next);
        SalesOrderPayload payload = new SalesOrderPayload(
            existing.orderNo(),
            existing.orderDate(),
            existing.customerId(),
            existing.contact(),
            existing.po(),
            existing.job(),
            existing.addresses(),
            existing.notes(),
            next,
            totals,
            existing.status(),
            existing.currency()
        );
        return update(orderId, payload);
    }

    public SalesOrderDto removeItem(String orderId, String itemId) {
        SalesOrderDto existing = get(orderId);
        List<SalesOrderItemDto> next = existing.items().stream()
            .filter(it -> !it.id().equals(itemId))
            .toList();
        SalesOrderTotalsDto totals = calculateTotals(next);
        SalesOrderPayload payload = new SalesOrderPayload(
            existing.orderNo(),
            existing.orderDate(),
            existing.customerId(),
            existing.contact(),
            existing.po(),
            existing.job(),
            existing.addresses(),
            existing.notes(),
            next,
            totals,
            existing.status(),
            existing.currency()
        );
        return update(orderId, payload);
    }

    public List<Map<String, Object>> history(String id) {
        SalesOrderDto order = get(id);
        return List.of(
            Map.of(
                "id", UUID.randomUUID().toString(),
                "type", "STATUS",
                "status", order.status(),
                "at", order.updatedAt(),
                "by", "system",
                "notes", "Current status: " + order.status()
            ),
            Map.of(
                "id", UUID.randomUUID().toString(),
                "type", "CREATED",
                "at", order.createdAt(),
                "by", "system",
                "notes", "Sales order created"
            )
        );
    }

    public Map<String, Object> stats() {
        long total = orders.size();
        long draft = orders.values().stream().filter(o -> o.status().toLowerCase(Locale.ROOT).contains("draft")).count();
        long confirmed = orders.values().stream().filter(o -> o.status().toLowerCase(Locale.ROOT).contains("confirm")).count();
        long production = orders.values().stream().filter(o -> o.status().toLowerCase(Locale.ROOT).contains("production")).count();
        return Map.of(
            "total", total,
            "draft", draft,
            "confirmed", confirmed,
            "inProduction", production
        );
    }

    public String exportCsv(List<SalesOrderDto> data) {
        String header = "Order No,Customer,Date,Status,Grand Total";
        String rows = data.stream()
            .map(o -> String.join(",",
                safe(o.orderNo()),
                safe(o.customer() != null ? o.customer().name() : ""),
                o.orderDate() != null ? o.orderDate().toString() : "",
                safe(o.status()),
                String.valueOf(o.totals() != null && o.totals().grandTotal() != null ? o.totals().grandTotal() : 0)
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    public SalesOrderDto createFromQuotation(QuotationDto quotation) {
        List<QuotationLineDto> quoteLines = quotation.lines() != null ? quotation.lines() : List.of();
        List<SalesOrderItemDto> items = quoteLines.stream()
            .map(line -> new SalesOrderItemDto(
                UUID.randomUUID().toString(),
                null,
                line.description(),
                line.qty(),
                "pcs",
                line.unitPrice(),
                (line.cgst() != null ? line.cgst() : 0)
                    + (line.sgst() != null ? line.sgst() : 0)
                    + (line.igst() != null ? line.igst() : 0),
                null
            ))
            .toList();
        SalesOrderTotalsDto totals = calculateTotals(items);
        SalesOrderPayload payload = new SalesOrderPayload(
            null,
            LocalDate.now(),
            quotation.customerId(),
            new ContactDto(quotation.customer() != null ? quotation.customer().contactName() : null,
                quotation.customer() != null ? quotation.customer().phone() : null,
                quotation.customer() != null ? quotation.customer().email() : null),
            new PoInfo(null, null),
            new JobInfo(quotation.pcb() != null ? quotation.pcb().jobName() : "Converted from quotation", "Normal", null),
            new SalesOrderAddresses(new AddressDto(null, null, null, null, null, null, "India", null),
                new AddressDto(null, null, null, null, null, null, "India", null)),
            quotation.remarks(),
            items,
            totals,
            "Confirmed",
            quotation.currency()
        );
        return create(payload);
    }

    public String nextNumber() {
        int num = sequence.getAndIncrement();
        int year = Year.now().getValue();
        return String.format("SO-%d-%03d", year, num);
    }

    private SalesOrderDto toDto(String id, String orderNo, LocalDate orderDate, SalesOrderTotalsDto totals,
                                SalesOrderPayload payload, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        CustomerSummary customer = payload.customerId() != null ? customerService.summary(payload.customerId()) : null;
        List<SalesOrderItemDto> items = payload.items() != null ? payload.items() : List.of();
        SalesOrderTotalsDto computedTotals = totals != null ? totals : calculateTotals(items);
        return new SalesOrderDto(
            id,
            orderNo,
            orderDate,
            payload.status() != null ? payload.status() : "Draft",
            payload.currency() != null ? payload.currency() : "INR",
            payload.customerId(),
            customer,
            payload.contact(),
            payload.po(),
            payload.job(),
            payload.addresses(),
            items,
            computedTotals,
            payload.notes(),
            List.of(),
            createdAt,
            updatedAt
        );
    }

    private static SalesOrderTotalsDto calculateTotals(List<SalesOrderItemDto> items) {
        double sub = 0;
        double tax = 0;
        if (items != null) {
            for (SalesOrderItemDto item : items) {
                int qty = item.qty() != null ? item.qty() : 0;
                double unit = item.unitPrice() != null ? item.unitPrice() : 0;
                double base = qty * unit;
                double taxPct = item.taxPct() != null ? item.taxPct() : 0;
                sub += base;
                tax += base * (taxPct / 100d);
            }
        }
        double grand = sub + tax;
        return new SalesOrderTotalsDto(sub, tax, grand);
    }

    private static boolean matchesQuery(SalesOrderDto dto, String query) {
        String q = query.toLowerCase(Locale.ROOT);
        return contains(dto.orderNo(), q)
            || contains(dto.customer() != null ? dto.customer().name() : null, q)
            || contains(dto.status(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static SalesOrderPayload merge(SalesOrderDto existing, SalesOrderPayload payload) {
        return new SalesOrderPayload(
            first(payload.orderNo(), existing.orderNo()),
            first(payload.orderDate(), existing.orderDate()),
            first(payload.customerId(), existing.customerId()),
            payload.contact() != null ? payload.contact() : existing.contact(),
            payload.po() != null ? payload.po() : existing.po(),
            payload.job() != null ? payload.job() : existing.job(),
            payload.addresses() != null ? payload.addresses() : existing.addresses(),
            first(payload.notes(), existing.notes()),
            payload.items() != null ? payload.items() : existing.items(),
            payload.totals() != null ? payload.totals() : existing.totals(),
            first(payload.status(), existing.status()),
            first(payload.currency(), existing.currency())
        );
    }

    private static <T> T first(T candidate, T fallback) {
        return candidate != null ? candidate : fallback;
    }
}
