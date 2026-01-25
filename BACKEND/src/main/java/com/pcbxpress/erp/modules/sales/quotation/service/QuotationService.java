package com.pcbxpress.erp.modules.sales.quotation.service;

import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.customer.service.CustomerService;
import com.pcbxpress.erp.modules.sales.quotation.dto.PcbSpecDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationLineDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationPayload;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationTotals;
import com.pcbxpress.erp.modules.sales.quotation.model.Quotation;
import com.pcbxpress.erp.modules.sales.quotation.model.QuotationLine;
import com.pcbxpress.erp.modules.sales.quotation.repository.QuotationRepository;
import com.pcbxpress.erp.modules.sales.salesorder.service.SalesOrderService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final CustomerService customerService;
    private final SalesOrderService salesOrderService;

    public QuotationService(
        QuotationRepository quotationRepository,
        CustomerService customerService,
        SalesOrderService salesOrderService
    ) {
        this.quotationRepository = quotationRepository;
        this.customerService = customerService;
        this.salesOrderService = salesOrderService;
    }

    public List<QuotationDto> list(String query, String status) {
        return quotationRepository.findAll().stream()
            .filter(q -> query == null || matchesQuery(q, query))
            .filter(q -> status == null || status.isBlank() || status.equalsIgnoreCase("all")
                || safe(q.getStatus()).equalsIgnoreCase(status))
            .sorted(Comparator.comparing(Quotation::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .toList();
    }

    public QuotationDto get(String id) {
        Quotation q = quotationRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Quotation not found: " + id));
        return toDto(q);
    }

    public QuotationDto create(QuotationPayload payload) {
        Quotation q = new Quotation();

        // quote no
        String quoteNo = payload.quoteNo() != null && !payload.quoteNo().isBlank()
            ? payload.quoteNo()
            : nextNumber();

        q.setQuoteNo(quoteNo);
        q.setQuoteDate(payload.quoteDate() != null ? payload.quoteDate() : LocalDate.now());
        q.setValidUntil(payload.validUntil() != null ? payload.validUntil() : q.getQuoteDate().plusDays(14));

        q.setStatus(payload.status() != null && !payload.status().isBlank() ? payload.status() : "Draft");
        q.setCurrency(payload.currency() != null && !payload.currency().isBlank() ? payload.currency() : "INR");
        q.setIncoterms(payload.incoterms());
        q.setLeadTime(payload.leadTime());
        q.setPaymentTerms(payload.paymentTerms());
        q.setRemarks(payload.remarks());
        q.setInternalNote(payload.internalNote());

        // rfq link
        if (payload.rfqRef() != null && !payload.rfqRef().isBlank()) {
            q.setRfqRef(payload.rfqRef());
        }
        // If your frontend sends rfqId later, you can add it; your payload currently doesn't include rfqId.
        // q.setRfqId(...)

        // customer
        if (payload.customerId() != null && !payload.customerId().isBlank()) {
            q.setCustomerId(UUID.fromString(payload.customerId()));
        }

        // PCB spec (flatten)
        applyPcb(q, payload.pcb());

        // Lines
        q.setLines(toLineEntities(payload.lines()));

        // Totals
        QuotationTotals totals = payload.totals() != null ? payload.totals() : calculateTotals(payload.lines());
        applyTotals(q, totals);

        Quotation saved = quotationRepository.save(q);
        return toDto(saved);
    }

    public QuotationDto update(String id, QuotationPayload payload) {
        Quotation q = quotationRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Quotation not found: " + id));

        if (payload.quoteNo() != null && !payload.quoteNo().isBlank()) q.setQuoteNo(payload.quoteNo());
        if (payload.quoteDate() != null) q.setQuoteDate(payload.quoteDate());
        if (payload.validUntil() != null) q.setValidUntil(payload.validUntil());

        if (payload.status() != null) q.setStatus(payload.status());
        if (payload.currency() != null) q.setCurrency(payload.currency());

        if (payload.incoterms() != null) q.setIncoterms(payload.incoterms());
        if (payload.leadTime() != null) q.setLeadTime(payload.leadTime());
        if (payload.paymentTerms() != null) q.setPaymentTerms(payload.paymentTerms());
        if (payload.remarks() != null) q.setRemarks(payload.remarks());
        if (payload.internalNote() != null) q.setInternalNote(payload.internalNote());

        if (payload.rfqRef() != null) q.setRfqRef(payload.rfqRef());
        if (payload.customerId() != null && !payload.customerId().isBlank()) {
            q.setCustomerId(UUID.fromString(payload.customerId()));
        }

        if (payload.pcb() != null) applyPcb(q, payload.pcb());

        if (payload.lines() != null) {
            q.setLines(toLineEntities(payload.lines()));
        }

        QuotationTotals totals = payload.totals() != null ? payload.totals() : calculateTotals(payload.lines());
        if (totals != null) applyTotals(q, totals);

        Quotation saved = quotationRepository.save(q);
        return toDto(saved);
    }

    public void delete(String id) {
        quotationRepository.deleteById(parseId(id));
    }

    public QuotationDto updateNote(String id, String note) {
        Quotation q = quotationRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Quotation not found: " + id));
        q.setInternalNote(note);
        return toDto(quotationRepository.save(q));
    }

    public QuotationDto markSent(String id) {
        Quotation q = quotationRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Quotation not found: " + id));
        q.setStatus("Sent");
        return toDto(quotationRepository.save(q));
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
            .reduce((a, b) -> a + "\n" + b)
            .orElse("");
        return header + "\n" + rows;
    }

    public String nextNumber() {
        // Simple approach: use year + random 3 digits if DB sequence isn't implemented.
        // Better: parse last quoteNo from DB and increment (optional improvement).
        int year = Year.now().getValue();
        int n = (int) (Math.random() * 900) + 100;
        String candidate = String.format("QT-%d-%03d", year, n);
        while (quotationRepository.existsByQuoteNoIgnoreCase(candidate)) {
            n = (int) (Math.random() * 900) + 100;
            candidate = String.format("QT-%d-%03d", year, n);
        }
        return candidate;
    }

    // ----------------- Mapping helpers -----------------

    private QuotationDto toDto(Quotation q) {
        CustomerSummary customer = null;
        if (q.getCustomerId() != null) {
            try {
                customer = customerService.summary(q.getCustomerId().toString());
            } catch (Exception ignored) {}
        }

        PcbSpecDto pcb = new PcbSpecDto(
            q.getPcbJobName(),
            q.getPcbBoardType(),
            q.getPcbLayerCount(),
            q.getPcbThickness(),
            q.getPcbCopperWeight(),
            q.getPcbSurfaceFinish(),
            q.getPcbSolderMask(),
            q.getPcbSilkscreen(),
            q.getPcbImpedanceControl(),
            q.getPcbViaType(),
            q.getPcbPanelization()
        );

        List<QuotationLineDto> lines = q.getLines() != null
            ? q.getLines().stream().map(this::toLineDto).toList()
            : List.of();

        QuotationTotals totals = new QuotationTotals(
            toDouble(q.getSubTotal()),
            toDouble(q.getDiscountTotal()),
            toDouble(q.getTaxTotal()),
            toDouble(q.getGrandTotal())
        );

        return new QuotationDto(
            q.getId().toString(),
            q.getQuoteNo(),
            q.getQuoteDate(),
            q.getValidUntil(),
            q.getStatus(),
            q.getCurrency(),
            q.getIncoterms(),
            q.getLeadTime(),
            q.getPaymentTerms(),
            q.getRemarks(),
            q.getRfqRef(),
            q.getCustomerId() != null ? q.getCustomerId().toString() : null,
            customer,
            pcb,
            lines,
            totals,
            q.getInternalNote(),
            q.getCreatedAt(),
            q.getUpdatedAt()
        );
    }

    private QuotationLineDto toLineDto(QuotationLine l) {
        return new QuotationLineDto(
            l.getId() != null ? l.getId().toString() : null,
            l.getDescription(),
            l.getHsn(),
            l.getQty(),
            toDouble(l.getUnitPrice()),
            toDouble(l.getDiscountPct()),
            toDouble(l.getCgst()),
            toDouble(l.getSgst()),
            toDouble(l.getIgst()),
            l.getSpec()
        );
    }

    private static List<QuotationLine> toLineEntities(List<QuotationLineDto> lines) {
        if (lines == null) return List.of();
        return lines.stream().map(dto -> {
            QuotationLine l = new QuotationLine();
            l.setDescription(dto.description());
            l.setHsn(dto.hsn());
            l.setQty(dto.qty());
            l.setUnitPrice(toBig(dto.unitPrice()));
            l.setDiscountPct(toBig(dto.discountPct()));
            l.setCgst(toBig(dto.cgst()));
            l.setSgst(toBig(dto.sgst()));
            l.setIgst(toBig(dto.igst()));
            l.setSpec(dto.spec());
            return l;
        }).toList();
    }

    private static void applyPcb(Quotation q, PcbSpecDto pcb) {
        if (pcb == null) return;
        q.setPcbJobName(pcb.jobName());
        q.setPcbBoardType(pcb.boardType());
        q.setPcbLayerCount(pcb.layerCount());
        q.setPcbThickness(pcb.thickness());
        q.setPcbCopperWeight(pcb.copperWeight());
        q.setPcbSurfaceFinish(pcb.surfaceFinish());
        q.setPcbSolderMask(pcb.solderMask());
        q.setPcbSilkscreen(pcb.silkscreen());
        q.setPcbImpedanceControl(pcb.impedanceControl());
        q.setPcbViaType(pcb.viaType());
        q.setPcbPanelization(pcb.panelization());
    }

    private static void applyTotals(Quotation q, QuotationTotals totals) {
        if (totals == null) return;
        q.setSubTotal(toBig(totals.subTotal()));
        q.setDiscountTotal(toBig(totals.discountTotal()));
        q.setTaxTotal(toBig(totals.taxTotal()));
        q.setGrandTotal(toBig(totals.grandTotal()));
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

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (Exception ex) {
            throw new NoSuchElementException("Quotation not found: " + id);
        }
    }

    private static boolean matchesQuery(Quotation q, String query) {
        String s = query.toLowerCase(Locale.ROOT);
        return contains(q.getQuoteNo(), s)
            || contains(q.getStatus(), s);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static BigDecimal toBig(Double d) {
        if (d == null) return null;
        return BigDecimal.valueOf(d).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private static Double toDouble(BigDecimal b) {
        return b != null ? b.doubleValue() : null;
    }
}
