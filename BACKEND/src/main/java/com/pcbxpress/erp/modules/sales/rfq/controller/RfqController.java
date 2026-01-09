package com.pcbxpress.erp.modules.sales.rfq.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqDto;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqPayload;
import com.pcbxpress.erp.modules.sales.rfq.service.RfqService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/sales/rfqs")
public class RfqController {

    private final RfqService rfqService;
    private final ObjectMapper objectMapper;

    public RfqController(RfqService rfqService, ObjectMapper objectMapper) {
        this.rfqService = rfqService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<RfqDto> list(@RequestParam Map<String, String> params) {
        return rfqService.list();
    }

    @GetMapping("/next-number")
    public Map<String, String> nextNumber() {
        return Map.of("next", rfqService.nextNumber());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RfqDto> create(@RequestBody RfqPayload payload) {
        RfqDto created = rfqService.create(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RfqDto> createMultipart(
        @RequestPart("data") String data,
        @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws JsonProcessingException {
        RfqPayload payload = objectMapper.readValue(data, RfqPayload.class);
        return create(payload);
    }

    @GetMapping("/{id}")
    public RfqDto get(@PathVariable String id) {
        return rfqService.get(id);
    }

    @PutMapping("/{id}")
    public RfqDto update(@PathVariable String id, @RequestBody RfqPayload payload) {
        return rfqService.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        rfqService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    public ResponseEntity<ByteArrayResource> exportCsv() {
        String csv = rfqService.exportCsv();
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rfqs.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }

    @PostMapping("/{rfqId}/convert-to-quotation")
    public Map<String, String> convertToQuotation(
        @PathVariable String rfqId,
        @RequestBody(required = false) Map<String, Object> quotationData
    ) {
        return rfqService.convertToQuotation(rfqId);
    }
}
