package com.pcbxpress.erp.modules.sales.salesorder.service;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.customer.service.CustomerService;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationLineDto;
import com.pcbxpress.erp.modules.sales.salesorder.dto.*;
import com.pcbxpress.erp.modules.sales.salesorder.model.SalesOrder;
import com.pcbxpress.erp.modules.sales.salesorder.model.SalesOrderItem;
import com.pcbxpress.erp.modules.sales.salesorder.repository.SalesOrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SalesOrderService {

    private final SalesOrderRepository orderRepo;
    private final CustomerService customerService;

    public SalesOrderService(SalesOrderRepository orderRepo, CustomerService customerService) {
        this.orderRepo = orderRepo;
        this.customerService = customerService;
    }

    public List<SalesOrderDto> list(String query, String status, LocalDate from, LocalDate to) {
        // Simple approach: load all & filter in memory (OK for now).
        // Later: replace with Specification / QueryDSL.
        return orderRepo.findAll().stream()
            .map(this::toDto)
            .filter(o -> query == null || matchesQuery(o, query))
            .filter(o -> status == null || status.isBlank() || "all".equalsIgnoreCase(status)
                || (o.status() != null && o.status().equalsIgnoreCase(status)))
            .filter(o -> from == null || (o.orderDate() != null && !o.orderDate().isBefore(from)))
            .filter(o -> to == null || (o.orderDate() != null && !o.orderDate().isAfter(to)))
            .sorted(Comparator.comparing(SalesOrderDto::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .toList();
    }

    public SalesOrderDto get(String id) {
        UUID uuid = UUID.fromString(id);
        SalesOrder entity = orderRepo.findById(uuid)
            .orElseThrow(() -> new NoSuchElementException("Sales Order not found: " + id));
        return toDto(entity);
    }

    @Transactional
    public SalesOrderDto create(SalesOrderPayload payload) {
        SalesOrder entity = new SalesOrder();

        String orderNo = (payload.orderNo() != null && !payload.orderNo().isBlank())
            ? payload.orderNo()
            : nextNumber();

        entity.setOrderNo(orderNo);
        entity.setOrderDate(payload.orderDate() != null ? payload.orderDate() : LocalDate.now());
        entity.setStatus(payload.status() != null ? payload.status() : "Draft");
        entity.setCurrency(payload.currency() != null ? payload.currency() : "INR");

        // customer id
        if (payload.customerId() != null && !payload.customerId().isBlank()) {
            entity.setCustomerId(UUID.fromString(payload.customerId()));
        }

        // contact
        if (payload.contact() != null) {
            entity.setContactName(payload.contact().name());
            entity.setContactPhone(payload.contact().phone());
            entity.setContactEmail(payload.contact().email());
        }

        // PO
        if (payload.po() != null) {
            entity.setPoNumber(payload.po().number());
            entity.setPoDate(payload.po().date());
        }

        // job
        if (payload.job() != null) {
            entity.setJobName(payload.job().name());
            entity.setJobPriority(payload.job().priority());
            entity.setRequestedDelivery(payload.job().requestedDelivery());
        }

        // addresses (shipping & billing)
        if (payload.addresses() != null) {
            applyShipping(entity, payload.addresses().shipping());
            applyBilling(entity, payload.addresses().billing());
        }

        entity.setNotes(payload.notes());

        // attachments (you can extend payload later if needed)
        entity.setAttachments(List.of()); // keep empty for now

        // items
        List<SalesOrderItem> items = toItems(payload.items());
        entity.setItemsWithBackRef(items);

        // totals (compute if missing)
        SalesOrderTotalsDto totals = payload.totals() != null ? payload.totals() : calculateTotals(toItemDtos(entity.getItems()));
        applyTotals(entity, totals);

        SalesOrder saved = orderRepo.save(entity);
        return toDto(saved);
    }

    @Transactional
    public SalesOrderDto update(String id, SalesOrderPayload payload) {
        UUID uuid = UUID.fromString(id);
        SalesOrder entity = orderRepo.findById(uuid)
            .orElseThrow(() -> new NoSuchElementException("Sales Order not found: " + id));

        if (payload.orderNo() != null && !payload.orderNo().isBlank()) entity.setOrderNo(payload.orderNo());
        if (payload.orderDate() != null) entity.setOrderDate(payload.orderDate());
        if (payload.status() != null) entity.setStatus(payload.status());
        if (payload.currency() != null) entity.setCurrency(payload.currency());

        if (payload.customerId() != null && !payload.customerId().isBlank()) {
            entity.setCustomerId(UUID.fromString(payload.customerId()));
        }

        if (payload.contact() != null) {
            entity.setContactName(payload.contact().name());
            entity.setContactPhone(payload.contact().phone());
            entity.setContactEmail(payload.contact().email());
        }

        if (payload.po() != null) {
            entity.setPoNumber(payload.po().number());
            entity.setPoDate(payload.po().date());
        }

        if (payload.job() != null) {
            entity.setJobName(payload.job().name());
            entity.setJobPriority(payload.job().priority());
            entity.setRequestedDelivery(payload.job().requestedDelivery());
        }

        if (payload.addresses() != null) {
            applyShipping(entity, payload.addresses().shipping());
            applyBilling(entity, payload.addresses().billing());
        }

        if (payload.notes() != null) entity.setNotes(payload.notes());

        if (payload.items() != null) {
            entity.setItemsWithBackRef(toItems(payload.items()));
        }

        SalesOrderTotalsDto totals = payload.totals() != null ? payload.totals() : calculateTotals(toItemDtos(entity.getItems()));
        applyTotals(entity, totals);

        SalesOrder saved = orderRepo.save(entity);
        return toDto(saved);
    }

    @Transactional
    public void delete(String id) {
        orderRepo.deleteById(UUID.fromString(id));
    }

    @Transactional
    public SalesOrderDto updateStatus(String id, String status) {
        UUID uuid = UUID.fromString(id);
        SalesOrder entity = orderRepo.findById(uuid)
            .orElseThrow(() -> new NoSuchElementException("Sales Order not found: " + id));
        entity.setStatus(status != null ? status : "Draft");
        return toDto(orderRepo.save(entity));
    }

    public List<SalesOrderItemDto> items(String id) {
        return get(id).items();
    }

    @Transactional
    public SalesOrderDto addItem(String id, SalesOrderItemDto item) {
        UUID uuid = UUID.fromString(id);
        SalesOrder entity = orderRepo.findById(uuid)
            .orElseThrow(() -> new NoSuchElementException("Sales Order not found: " + id));

        SalesOrderItem it = new SalesOrderItem();
        it.setSku(item.sku());
        it.setDescription(item.description());
        it.setQty(item.qty());
        it.setUom(item.uom());
        it.setUnitPrice(toBig(item.unitPrice()));
        it.setTaxPct(toBig(item.taxPct()));
        it.setLeadTimeDays(item.leadTimeDays());
        it.setOrder(entity);

        entity.getItems().add(it);

        SalesOrderTotalsDto totals = calculateTotals(toItemDtos(entity.getItems()));
        applyTotals(entity, totals);

        SalesOrder saved = orderRepo.save(entity);
        return toDto(saved);
    }

    @Transactional
    public SalesOrderDto updateItem(String orderId, String itemId, SalesOrderItemDto item) {
        UUID oid = UUID.fromString(orderId);
        UUID iid = UUID.fromString(itemId);

        SalesOrder entity = orderRepo.findById(oid)
            .orElseThrow(() -> new NoSuchElementException("Sales Order not found: " + orderId));

        SalesOrderItem target = entity.getItems().stream()
            .filter(x -> x.getId() != null && x.getId().equals(iid))
            .findFirst()
            .orElseThrow(() -> new NoSuchElementException("Sales Order item not found: " + itemId));

        target.setSku(item.sku());
        target.setDescription(item.description());
        target.setQty(item.qty());
        target.setUom(item.uom());
        target.setUnitPrice(toBig(item.unitPrice()));
        target.setTaxPct(toBig(item.taxPct()));
        target.setLeadTimeDays(item.leadTimeDays());

        SalesOrderTotalsDto totals = calculateTotals(toItemDtos(entity.getItems()));
        applyTotals(entity, totals);

        SalesOrder saved = orderRepo.save(entity);
        return toDto(saved);
    }

    @Transactional
    public SalesOrderDto removeItem(String orderId, String itemId) {
        UUID oid = UUID.fromString(orderId);
        UUID iid = UUID.fromString(itemId);

        SalesOrder entity = orderRepo.findById(oid)
            .orElseThrow(() -> new NoSuchElementException("Sales Order not found: " + orderId));

        entity.getItems().removeIf(x -> x.getId() != null && x.getId().equals(iid));

        SalesOrderTotalsDto totals = calculateTotals(toItemDtos(entity.getItems()));
        applyTotals(entity, totals);

        SalesOrder saved = orderRepo.save(entity);
        return toDto(saved);
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
        List<SalesOrderDto> all = orderRepo.findAll().stream().map(this::toDto).toList();
        long total = all.size();
        long draft = all.stream().filter(o -> o.status() != null && o.status().toLowerCase(Locale.ROOT).contains("draft")).count();
        long confirmed = all.stream().filter(o -> o.status() != null && o.status().toLowerCase(Locale.ROOT).contains("confirm")).count();
        long production = all.stream().filter(o -> o.status() != null && o.status().toLowerCase(Locale.ROOT).contains("production")).count();
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

    @Transactional
    public SalesOrderDto createFromQuotation(QuotationDto quotation) {
        List<QuotationLineDto> quoteLines = quotation.lines() != null ? quotation.lines() : List.of();
        List<SalesOrderItemDto> items = quoteLines.stream()
            .map(line -> new SalesOrderItemDto(
                null, // let DB generate UUID
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
            new ContactDto(
                quotation.customer() != null ? quotation.customer().contactName() : null,
                quotation.customer() != null ? quotation.customer().phone() : null,
                quotation.customer() != null ? quotation.customer().email() : null
            ),
            new PoInfo(null, null),
            new JobInfo(quotation.pcb() != null ? quotation.pcb().jobName() : "Converted from quotation", "Normal", null),
            new SalesOrderAddresses(
                new AddressDto(null, null, null, null, null, null, "India", null),
                new AddressDto(null, null, null, null, null, null, "India", null)
            ),
            quotation.remarks(),
            items,
            totals,
            "Confirmed",
            quotation.currency()
        );

        return create(payload);
    }

    public String nextNumber() {
        // Quick safe method: SO-YYYY-###
        // NOTE: In real multi-user scenarios use DB sequence / unique retry.
        int year = Year.now().getValue();
        long countThisYear = orderRepo.findAll().stream()
            .filter(o -> o.getOrderNo() != null && o.getOrderNo().startsWith("SO-" + year + "-"))
            .count();
        return String.format("SO-%d-%03d", year, countThisYear + 1);
    }

    // ---------- Mapping helpers ----------

    private SalesOrderDto toDto(SalesOrder e) {
        CustomerSummary customer = null;
        if (e.getCustomerId() != null) {
            try {
                customer = customerService.summary(e.getCustomerId().toString());
            } catch (Exception ignored) {}
        }

        ContactDto contact = new ContactDto(e.getContactName(), e.getContactPhone(), e.getContactEmail());
        PoInfo po = new PoInfo(e.getPoNumber(), e.getPoDate());
        JobInfo job = new JobInfo(e.getJobName(), e.getJobPriority(), e.getRequestedDelivery());

        SalesOrderAddresses addresses = new SalesOrderAddresses(
            new AddressDto(
                e.getShippingName(),
                e.getShippingAddressLine1(),
                e.getShippingAddressLine2(),
                e.getShippingCity(),
                e.getShippingState(),
                e.getShippingPincode(),
                e.getShippingCountry(),
                e.getShippingGstin()
            ),
            new AddressDto(
                e.getBillingName(),
                e.getBillingAddressLine1(),
                e.getBillingAddressLine2(),
                e.getBillingCity(),
                e.getBillingState(),
                e.getBillingPincode(),
                e.getBillingCountry(),
                e.getBillingGstin()
            )
        );

        List<SalesOrderItemDto> items = toItemDtos(e.getItems());

        SalesOrderTotalsDto totals = new SalesOrderTotalsDto(
            e.getSubTotal() != null ? e.getSubTotal().doubleValue() : 0d,
            e.getTaxTotal() != null ? e.getTaxTotal().doubleValue() : 0d,
            e.getGrandTotal() != null ? e.getGrandTotal().doubleValue() : 0d
        );

        return new SalesOrderDto(
            e.getId() != null ? e.getId().toString() : null,
            e.getOrderNo(),
            e.getOrderDate(),
            e.getStatus(),
            e.getCurrency(),
            e.getCustomerId() != null ? e.getCustomerId().toString() : null,
            customer,
            contact,
            po,
            job,
            addresses,
            items,
            totals,
            e.getNotes(),
            e.getAttachments() != null ? e.getAttachments() : List.of(),
            e.getCreatedAt(),
            e.getUpdatedAt()
        );
    }

    private static List<SalesOrderItem> toItems(List<SalesOrderItemDto> dtos) {
        if (dtos == null) return List.of();
        List<SalesOrderItem> list = new ArrayList<>();
        for (SalesOrderItemDto d : dtos) {
            SalesOrderItem it = new SalesOrderItem();
            // id is DB generated; ignore dto.id()
            it.setSku(d.sku());
            it.setDescription(d.description());
            it.setQty(d.qty());
            it.setUom(d.uom());
            it.setUnitPrice(toBig(d.unitPrice()));
            it.setTaxPct(toBig(d.taxPct()));
            it.setLeadTimeDays(d.leadTimeDays());
            list.add(it);
        }
        return list;
    }

    private static List<SalesOrderItemDto> toItemDtos(List<SalesOrderItem> items) {
        if (items == null) return List.of();
        return items.stream().map(it -> new SalesOrderItemDto(
            it.getId() != null ? it.getId().toString() : null,
            it.getSku(),
            it.getDescription(),
            it.getQty(),
            it.getUom(),
            it.getUnitPrice() != null ? it.getUnitPrice().doubleValue() : null,
            it.getTaxPct() != null ? it.getTaxPct().doubleValue() : null,
            it.getLeadTimeDays()
        )).toList();
    }

    private static void applyTotals(SalesOrder e, SalesOrderTotalsDto t) {
        if (t == null) return;
        e.setSubTotal(toBig(t.subTotal()));
        e.setTaxTotal(toBig(t.taxTotal()));
        e.setGrandTotal(toBig(t.grandTotal()));
    }

    private static void applyShipping(SalesOrder e, AddressDto a) {
        if (a == null) return;
        e.setShippingName(a.name());
        e.setShippingAddressLine1(a.addressLine1());
        e.setShippingAddressLine2(a.addressLine2());
        e.setShippingCity(a.city());
        e.setShippingState(a.state());
        e.setShippingPincode(a.pincode());
        e.setShippingCountry(a.country() != null ? a.country() : "India");
        e.setShippingGstin(a.gstin());
    }

    private static void applyBilling(SalesOrder e, AddressDto a) {
        if (a == null) return;
        e.setBillingName(a.name());
        e.setBillingAddressLine1(a.addressLine1());
        e.setBillingAddressLine2(a.addressLine2());
        e.setBillingCity(a.city());
        e.setBillingState(a.state());
        e.setBillingPincode(a.pincode());
        e.setBillingCountry(a.country() != null ? a.country() : "India");
        e.setBillingGstin(a.gstin());
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

    private static BigDecimal toBig(Double v) {
        return v == null ? null : BigDecimal.valueOf(v);
    }
}
