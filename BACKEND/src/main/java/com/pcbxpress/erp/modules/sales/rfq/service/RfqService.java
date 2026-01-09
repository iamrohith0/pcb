package com.pcbxpress.erp.modules.sales.rfq.service;

import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqDto;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqLineDto;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqPayload;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.Collections;
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
public class RfqService {

    private final Map<String, RfqDto> rfqs = new ConcurrentHashMap<>();
    private final AtomicInteger sequence = new AtomicInteger(3);

    public RfqService() {
    }

    public List<RfqDto> list() {
        return rfqs.values().stream()
            .sorted(Comparator.comparing(RfqDto::createdAt).reversed())
            .toList();
    }

    public RfqDto get(String id) {
        RfqDto rfq = rfqs.get(id);
        if (rfq == null) {
            throw new NoSuchElementException("RFQ not found: " + id);
        }
        return rfq;
    }

    public String nextNumber() {
        int next = sequence.getAndIncrement();
        int year = Year.now().getValue();
        return String.format("RFQ-%d-%03d", year, next);
    }

    public RfqDto create(RfqPayload payload) {
        String id = UUID.randomUUID().toString();
        String rfqNo = payload.rfqNo() != null ? payload.rfqNo() : nextNumber();
        LocalDate rfqDate = payload.rfqDate() != null ? payload.rfqDate() : LocalDate.now();
        List<RfqLineDto> lines = payload.lines() != null ? payload.lines() : Collections.emptyList();
        int totalQty = payload.totalQty() != null ? payload.totalQty() : calculateTotalQty(lines);
        int linesCount = payload.linesCount() != null ? payload.linesCount() : lines.size();
        int maxLayers = payload.maxLayers() != null ? payload.maxLayers() : calculateMaxLayers(lines);
        OffsetDateTime now = OffsetDateTime.now();

        RfqDto rfq = new RfqDto(
            id,
            rfqNo,
            rfqDate,
            payload.status() != null ? payload.status() : "Open",
            payload.priority() != null ? payload.priority() : "Normal",
            payload.customer(),
            payload.currency() != null ? payload.currency() : "INR",
            totalQty,
            linesCount,
            maxLayers,
            lines,
            payload.specialInstructions(),
            payload.attachments() != null ? payload.attachments() : Collections.emptyList(),
            now,
            now
        );
        rfqs.put(id, rfq);
        return rfq;
    }

    public RfqDto update(String id, RfqPayload payload) {
        RfqDto existing = get(id);
        List<RfqLineDto> lines = payload.lines() != null ? payload.lines() : existing.lines();
        int totalQty = payload.totalQty() != null ? payload.totalQty() : calculateTotalQty(lines);
        int linesCount = payload.linesCount() != null ? payload.linesCount() : lines.size();
        int maxLayers = payload.maxLayers() != null ? payload.maxLayers() : calculateMaxLayers(lines);
        OffsetDateTime now = OffsetDateTime.now();

        RfqDto updated = new RfqDto(
            existing.id(),
            payload.rfqNo() != null ? payload.rfqNo() : existing.rfqNo(),
            payload.rfqDate() != null ? payload.rfqDate() : existing.rfqDate(),
            payload.status() != null ? payload.status() : existing.status(),
            payload.priority() != null ? payload.priority() : existing.priority(),
            payload.customer() != null ? payload.customer() : existing.customer(),
            payload.currency() != null ? payload.currency() : existing.currency(),
            totalQty,
            linesCount,
            maxLayers,
            lines,
            payload.specialInstructions() != null ? payload.specialInstructions() : existing.specialInstructions(),
            payload.attachments() != null ? payload.attachments() : existing.attachments(),
            existing.createdAt(),
            now
        );
        rfqs.put(id, updated);
        return updated;
    }

    public void delete(String id) {
        rfqs.remove(id);
    }

    public String exportCsv() {
        List<RfqDto> data = new ArrayList<>(list());
        String header = "RFQ No,Customer,Date,Status,Total Qty";
        String rows = data.stream()
            .map(rfq -> String.join(",",
                safe(rfq.rfqNo()),
                safe(rfq.customer() != null ? rfq.customer().name() : ""),
                rfq.rfqDate() != null ? rfq.rfqDate().toString() : "",
                safe(rfq.status()),
                String.valueOf(rfq.totalQty() != null ? rfq.totalQty() : 0)
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    public Map<String, String> convertToQuotation(String id) {
        RfqDto rfq = get(id);
        String quotationNo = "QT-" + (rfq.rfqNo() != null ? rfq.rfqNo().replace("RFQ-", "") : nextNumber());
        return Map.of(
            "quotationNo", quotationNo,
            "sourceRfqId", id
        );
    }

    private static int calculateTotalQty(List<RfqLineDto> lines) {
        return lines.stream()
            .map(RfqLineDto::qty)
            .filter(qty -> qty != null)
            .mapToInt(Integer::intValue)
            .sum();
    }

    private static int calculateMaxLayers(List<RfqLineDto> lines) {
        return lines.stream()
            .map(RfqLineDto::layers)
            .filter(layers -> layers != null)
            .mapToInt(Integer::intValue)
            .max()
            .orElse(0);
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

}
