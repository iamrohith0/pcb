package com.pcbxpress.erp.modules.sales.rfq.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pcbxpress.erp.modules.sales.rfq.dto.RfqDraftDto;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqDraftPayload;
import com.pcbxpress.erp.modules.sales.rfq.service.RfqDraftService;

@RestController
@RequestMapping("/sales/rfqs/drafts")
public class RfqDraftController {

    private final RfqDraftService rfqDraftService;

    public RfqDraftController(RfqDraftService rfqDraftService) {
        this.rfqDraftService = rfqDraftService;
    }

    @GetMapping
    public List<RfqDraftDto> list(@RequestParam String userId) {
        return rfqDraftService.listByUser(userId);
    }

    @PostMapping
    public ResponseEntity<RfqDraftDto> save(@RequestParam String userId, @RequestBody RfqDraftPayload payload) {
        RfqDraftDto saved = rfqDraftService.save(userId, payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public RfqDraftDto get(@PathVariable String id) {
        return rfqDraftService.get(id);
    }

    @PutMapping("/{id}")
    public RfqDraftDto update(@PathVariable String id, @RequestParam String userId, @RequestBody RfqDraftPayload payload) {
        // update = save same draft name for same user (unique constraint in DB)
        // id isn't needed for DB upsert because unique key is (user_id, draft_name)
        return rfqDraftService.save(userId, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        rfqDraftService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
