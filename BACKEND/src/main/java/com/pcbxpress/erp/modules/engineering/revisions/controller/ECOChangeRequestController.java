package com.pcbxpress.erp.modules.engineering.revisions.controller;

import com.pcbxpress.erp.modules.engineering.revisions.dto.ECOChangeRequestDto;
import com.pcbxpress.erp.modules.engineering.revisions.dto.ECOChangeRequestPayload;
import com.pcbxpress.erp.modules.engineering.revisions.model.ECOStatus;
import com.pcbxpress.erp.modules.engineering.revisions.service.ECOChangeRequestService;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/engineering/revisions/eco-requests")
public class ECOChangeRequestController {
    
    private final ECOChangeRequestService ecoChangeRequestService;
    
    @Autowired
    public ECOChangeRequestController(ECOChangeRequestService ecoChangeRequestService) {
        this.ecoChangeRequestService = ecoChangeRequestService;
    }
    
    @GetMapping
    public ResponseEntity<List<ECOChangeRequestDto>> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String changeType,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) UUID jobId,
            @RequestParam(required = false) UUID requestedBy,
            @RequestParam(required = false) UUID assignedTo,
            @RequestParam(required = false) ECOStatus status) {
        
        List<ECOChangeRequestDto> requests = ecoChangeRequestService.list(
            query, changeType, priority, jobId, requestedBy, assignedTo, status);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ECOChangeRequestDto> getById(@PathVariable UUID id) {
        ECOChangeRequestDto request = ecoChangeRequestService.getById(id);
        return ResponseEntity.ok(request);
    }
    
    @PostMapping
    public ResponseEntity<ECOChangeRequestDto> create(@RequestBody ECOChangeRequestPayload payload) {
        ECOChangeRequestDto request = ecoChangeRequestService.create(payload);
        return ResponseEntity.ok(request);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ECOChangeRequestDto> update(
            @PathVariable UUID id,
            @RequestBody ECOChangeRequestPayload payload) {
        
        ECOChangeRequestDto request = ecoChangeRequestService.update(id, payload);
        return ResponseEntity.ok(request);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        ecoChangeRequestService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<UUID> ids) {
        ecoChangeRequestService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ECOChangeRequestDto> updateStatus(
            @PathVariable UUID id,
            @RequestBody ECOStatus status) {
        
        ECOChangeRequestDto request = ecoChangeRequestService.updateStatus(id, status);
        return ResponseEntity.ok(request);
    }
    
    @PostMapping("/{id}/submit")
    public ResponseEntity<ECOChangeRequestDto> submitForReview(@PathVariable UUID id) {
        ECOChangeRequestDto request = ecoChangeRequestService.submitForReview(id);
        return ResponseEntity.ok(request);
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<ECOChangeRequestDto> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedBy,
            @RequestParam String approvedByName) {
        
        ECOChangeRequestDto request = ecoChangeRequestService.approve(id, approvedBy, approvedByName);
        return ResponseEntity.ok(request);
    }
    
    @PostMapping("/{id}/reject")
    public ResponseEntity<ECOChangeRequestDto> reject(
            @PathVariable UUID id,
            @RequestParam UUID rejectedBy,
            @RequestParam String rejectedByName,
            @RequestParam String rejectedReason) {
        
        ECOChangeRequestDto request = ecoChangeRequestService.reject(id, rejectedBy, rejectedByName, rejectedReason);
        return ResponseEntity.ok(request);
    }
    
    @PostMapping("/{id}/implement")
    public ResponseEntity<ECOChangeRequestDto> implement(@PathVariable UUID id) {
        ECOChangeRequestDto request = ecoChangeRequestService.implement(id);
        return ResponseEntity.ok(request);
    }
    
    @PostMapping("/{id}/complete-implementation")
    public ResponseEntity<ECOChangeRequestDto> completeImplementation(@PathVariable UUID id) {
        ECOChangeRequestDto request = ecoChangeRequestService.completeImplementation(id);
        return ResponseEntity.ok(request);
    }
    
    @PostMapping("/{id}/close")
    public ResponseEntity<ECOChangeRequestDto> close(
            @PathVariable UUID id,
            @RequestParam UUID closedBy,
            @RequestParam String closedByName,
            @RequestParam(required = false) String closureNotes) {
        
        ECOChangeRequestDto request = ecoChangeRequestService.close(id, closedBy, closedByName, closureNotes);
        return ResponseEntity.ok(request);
    }
    
    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<ECOChangeRequestDto>> getByJobId(@PathVariable UUID jobId) {
        List<ECOChangeRequestDto> requests = ecoChangeRequestService.getByJobId(jobId);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/requested-by/{requestedBy}")
    public ResponseEntity<List<ECOChangeRequestDto>> getByRequestedBy(@PathVariable UUID requestedBy) {
        List<ECOChangeRequestDto> requests = ecoChangeRequestService.getByRequestedBy(requestedBy);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/assigned-to/{assignedTo}")
    public ResponseEntity<List<ECOChangeRequestDto>> getByAssignedTo(@PathVariable UUID assignedTo) {
        List<ECOChangeRequestDto> requests = ecoChangeRequestService.getByAssignedTo(assignedTo);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ECOChangeRequestDto>> getByStatus(@PathVariable ECOStatus status) {
        List<ECOChangeRequestDto> requests = ecoChangeRequestService.getByStatus(status);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/overdue")
    public ResponseEntity<List<ECOChangeRequestDto>> getOverdueRequests() {
        List<ECOChangeRequestDto> requests = ecoChangeRequestService.getOverdueRequests();
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/count/status/{status}")
    public ResponseEntity<Long> countByStatus(@PathVariable ECOStatus status) {
        long count = ecoChangeRequestService.countByStatus(status);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/active")
    public ResponseEntity<Long> countActive() {
        long count = ecoChangeRequestService.countActive();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/inactive")
    public ResponseEntity<Long> countInactive() {
        long count = ecoChangeRequestService.countInactive();
        return ResponseEntity.ok(count);
    }
}