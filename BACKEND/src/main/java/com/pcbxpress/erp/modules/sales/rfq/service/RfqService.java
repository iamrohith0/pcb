package com.pcbxpress.erp.modules.sales.rfq.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqDto;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqLineDto;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqPayload;
import com.pcbxpress.erp.modules.sales.rfq.model.Rfq;
import com.pcbxpress.erp.modules.sales.rfq.model.RfqLine;
import com.pcbxpress.erp.modules.sales.rfq.repository.RfqRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RfqService {

    private final RfqRepository rfqRepository;
    private final ObjectMapper objectMapper;

    public RfqService(RfqRepository rfqRepository, ObjectMapper objectMapper) {
        this.rfqRepository = rfqRepository;
        this.objectMapper = objectMapper;
    }

    public List<RfqDto> list() {
        return rfqRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .map(this::toDto)
            .toList();
    }

    public RfqDto get(String id) {
        Rfq rfq = rfqRepository.findById(parseUuid(id))
            .orElseThrow(() -> new NoSuchElementException("RFQ not found: " + id));
        return toDto(rfq);
    }

    public String nextNumber() {
        int year = Year.now().getValue();
        String prefix = "RFQ-" + year + "-";

        // Find the latest RFQ for this year, then increment last 3 digits
        int nextSeq = rfqRepository.findTopByRfqNoStartingWithOrderByRfqNoDesc(prefix)
            .map(r -> parseLast3(r.getRfqNo()))
            .orElse(0) + 1;

        return String.format("RFQ-%d-%03d", year, nextSeq);
    }

    public RfqDto create(RfqPayload payload) {
        Rfq rfq = new Rfq();

        String rfqNo = (payload.rfqNo() == null || payload.rfqNo().isBlank()) ? nextNumber() : payload.rfqNo();
        if (rfqRepository.existsByRfqNoIgnoreCase(rfqNo)) {
            throw new IllegalArgumentException("RFQ number already exists: " + rfqNo);
        }

        rfq.setRfqNo(rfqNo);
        rfq.setRfqDate(payload.rfqDate() != null ? payload.rfqDate() : LocalDate.now());
        rfq.setStatus(payload.status() != null ? payload.status() : "Open");
        rfq.setPriority(payload.priority() != null ? payload.priority() : "Normal");
        rfq.setCurrency(payload.currency() != null ? payload.currency() : "INR");
        rfq.setSpecialInstructions(payload.specialInstructions());

        // Customer mapping (your payload uses CustomerSummary)
        applyCustomer(rfq, payload.customer());

        // attachments jsonb
        rfq.setAttachments(toJsonAttachments(payload.attachments()));

        // Lines
        List<RfqLineDto> lineDtos = payload.lines() != null ? payload.lines() : Collections.emptyList();
        rfq.clearLines();
        for (int i = 0; i < lineDtos.size(); i++) {
            RfqLineDto dto = lineDtos.get(i);
            RfqLine line = new RfqLine();
            line.setLineNo(i + 1);
            line.setPcbType(dto.pcbType());
            line.setLayers(dto.layers());
            line.setThicknessMm(toBigDecimal(dto.thicknessMm()));
            line.setCopperOz(toBigDecimal(dto.copperOz()));
            line.setFinish(dto.finish());
            line.setSolderMask(dto.solderMask());
            line.setSilkscreen(dto.silkscreen());
            line.setPanelization(dto.panelization());
            line.setQty(dto.qty());
            line.setUnit(dto.unit());
            line.setDeliveryDays(dto.deliveryDays());
            line.setNotes(dto.notes());

            rfq.addLine(line);
        }

        // Derived totals
        rfq.setTotalQty(payload.totalQty() != null ? payload.totalQty() : calculateTotalQty(lineDtos));
        rfq.setLinesCount(payload.linesCount() != null ? payload.linesCount() : lineDtos.size());
        rfq.setMaxLayers(payload.maxLayers() != null ? payload.maxLayers() : calculateMaxLayers(lineDtos));

        Rfq saved = rfqRepository.save(rfq);
        return toDto(saved);
    }

    public RfqDto update(String id, RfqPayload payload) {
        Rfq rfq = rfqRepository.findById(parseUuid(id))
            .orElseThrow(() -> new NoSuchElementException("RFQ not found: " + id));

        if (payload.rfqNo() != null && !payload.rfqNo().isBlank() && !payload.rfqNo().equalsIgnoreCase(rfq.getRfqNo())) {
            if (rfqRepository.existsByRfqNoIgnoreCase(payload.rfqNo())) {
                throw new IllegalArgumentException("RFQ number already exists: " + payload.rfqNo());
            }
            rfq.setRfqNo(payload.rfqNo());
        }

        if (payload.rfqDate() != null) rfq.setRfqDate(payload.rfqDate());
        if (payload.status() != null) rfq.setStatus(payload.status());
        if (payload.priority() != null) rfq.setPriority(payload.priority());
        if (payload.currency() != null) rfq.setCurrency(payload.currency());
        if (payload.specialInstructions() != null) rfq.setSpecialInstructions(payload.specialInstructions());

        if (payload.customer() != null) applyCustomer(rfq, payload.customer());

        if (payload.attachments() != null) {
            rfq.setAttachments(toJsonAttachments(payload.attachments()));
        }

        // Update lines: simplest = replace all (works well with orphanRemoval=true)
        if (payload.lines() != null) {
            List<RfqLineDto> lineDtos = payload.lines();
            rfq.clearLines();

            for (int i = 0; i < lineDtos.size(); i++) {
                RfqLineDto dto = lineDtos.get(i);
                RfqLine line = new RfqLine();
                line.setLineNo(i + 1);
                line.setPcbType(dto.pcbType());
                line.setLayers(dto.layers());
                line.setThicknessMm(toBigDecimal(dto.thicknessMm()));
                line.setCopperOz(toBigDecimal(dto.copperOz()));
                line.setFinish(dto.finish());
                line.setSolderMask(dto.solderMask());
                line.setSilkscreen(dto.silkscreen());
                line.setPanelization(dto.panelization());
                line.setQty(dto.qty());
                line.setUnit(dto.unit());
                line.setDeliveryDays(dto.deliveryDays());
                line.setNotes(dto.notes());
                rfq.addLine(line);
            }

            rfq.setTotalQty(payload.totalQty() != null ? payload.totalQty() : calculateTotalQty(lineDtos));
            rfq.setLinesCount(payload.linesCount() != null ? payload.linesCount() : lineDtos.size());
            rfq.setMaxLayers(payload.maxLayers() != null ? payload.maxLayers() : calculateMaxLayers(lineDtos));
        }

        Rfq saved = rfqRepository.save(rfq);
        return toDto(saved);
    }

    public void delete(String id) {
        rfqRepository.deleteById(parseUuid(id));
    }

    public String exportCsv() {
        List<RfqDto> data = list();
        String header = "RFQ No,Customer,Date,Status,Total Qty";
        String rows = data.stream()
            .map(r -> String.join(",",
                safe(r.rfqNo()),
                safe(r.customer() != null ? r.customer().name() : ""),
                r.rfqDate() != null ? r.rfqDate().toString() : "",
                safe(r.status()),
                String.valueOf(r.totalQty() != null ? r.totalQty() : 0)
            ))
            .reduce((a, b) -> a + "\n" + b)
            .orElse("");
        return header + "\n" + rows;
    }

    public Map<String, String> convertToQuotation(String id) {
        Rfq rfq = rfqRepository.findById(parseUuid(id))
            .orElseThrow(() -> new NoSuchElementException("RFQ not found: " + id));

        String quotationNo = "QT-" + (rfq.getRfqNo() != null ? rfq.getRfqNo().replace("RFQ-", "") : nextNumber());
        return Map.of("quotationNo", quotationNo, "sourceRfqId", id);
    }

    // ---------------- helpers ----------------

    private void applyCustomer(Rfq rfq, CustomerSummary customer) {
        if (customer == null) return;

        // CustomerSummary in your project uses strings; safely parse UUID
        UUID customerId = null;
        try {
            if (customer.id() != null && !customer.id().isBlank()) customerId = UUID.fromString(customer.id());
        } catch (Exception ignored) {}

        rfq.setCustomerId(customerId);
        rfq.setCustomerName(customer.name());

        // You don't have contact fields in payload now -> keep null (works with your schema)
        // Later you can add contact fields into RfqPayload and set here.
    }

    private RfqDto toDto(Rfq rfq) {
        CustomerSummary customer = null;
        if (rfq.getCustomerId() != null || (rfq.getCustomerName() != null && !rfq.getCustomerName().isBlank())) {
            customer = new CustomerSummary(
                rfq.getCustomerId() != null ? rfq.getCustomerId().toString() : null,
                rfq.getCustomerName(),
                null,
                null,
                null
            );
        }

        List<RfqLineDto> lines = rfq.getLines().stream()
            .sorted(Comparator.comparing(l -> l.getLineNo() == null ? 0 : l.getLineNo()))
            .map(l -> new RfqLineDto(
                l.getId() != null ? l.getId().toString() : null,
                l.getPcbType(),
                l.getLayers(),
                l.getThicknessMm() != null ? l.getThicknessMm().doubleValue() : null,
                l.getCopperOz() != null ? l.getCopperOz().doubleValue() : null,
                l.getFinish(),
                l.getSolderMask(),
                l.getSilkscreen(),
                l.getPanelization(),
                l.getQty(),
                l.getUnit(),
                l.getDeliveryDays(),
                l.getNotes()
            ))
            .toList();

        return new RfqDto(
            rfq.getId() != null ? rfq.getId().toString() : null,
            rfq.getRfqNo(),
            rfq.getRfqDate(),
            rfq.getStatus(),
            rfq.getPriority(),
            customer,
            rfq.getCurrency(),
            rfq.getTotalQty(),
            rfq.getLinesCount(),
            rfq.getMaxLayers(),
            lines,
            rfq.getSpecialInstructions(),
            jsonAttachmentsToList(rfq.getAttachments()),
            rfq.getCreatedAt(),
            rfq.getUpdatedAt()
        );
    }

    private JsonNode toJsonAttachments(List<String> attachments) {
        try {
            return objectMapper.valueToTree(attachments != null ? attachments : List.of());
        } catch (Exception ex) {
            return objectMapper.createArrayNode();
        }
    }

    private List<String> jsonAttachmentsToList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        try {
            return objectMapper.convertValue(node, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return List.of();
        }
    }

    private static UUID parseUuid(String id) {
        try {
            return UUID.fromString(id);
        } catch (Exception ex) {
            throw new NoSuchElementException("Invalid UUID: " + id);
        }
    }

    private static int parseLast3(String rfqNo) {
        if (rfqNo == null) return 0;
        int idx = rfqNo.lastIndexOf("-");
        if (idx < 0) return 0;
        String last = rfqNo.substring(idx + 1);
        try {
            return Integer.parseInt(last);
        } catch (Exception e) {
            return 0;
        }
    }

    private static BigDecimal toBigDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }

    private static int calculateTotalQty(List<RfqLineDto> lines) {
        return lines.stream().map(RfqLineDto::qty).filter(q -> q != null).mapToInt(Integer::intValue).sum();
    }

    private static int calculateMaxLayers(List<RfqLineDto> lines) {
        return lines.stream().map(RfqLineDto::layers).filter(l -> l != null).mapToInt(Integer::intValue).max().orElse(0);
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}
