package com.pcbxpress.erp.modules.engineering.revisions.controller;

import com.pcbxpress.erp.modules.engineering.revisions.dto.RevisionDto;
import com.pcbxpress.erp.modules.engineering.revisions.dto.RevisionPayload;
import com.pcbxpress.erp.modules.engineering.revisions.model.RevisionStatus;
import com.pcbxpress.erp.modules.engineering.revisions.service.RevisionService;
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
@RequestMapping("/api/engineering/revisions")
public class RevisionController {
    
    private final RevisionService revisionService;
    
    @Autowired
    public RevisionController(RevisionService revisionService) {
        this.revisionService = revisionService;
    }
    
    @GetMapping
    public ResponseEntity<List<RevisionDto>> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String partNumber,
            @RequestParam(required = false) String revision,
            @RequestParam(required = false) UUID jobId,
            @RequestParam(required = false) UUID changeRequestId,
            @RequestParam(required = false) RevisionStatus status) {
        
        List<RevisionDto> revisions = revisionService.list(
            query, partNumber, revision, jobId, changeRequestId, status);
        return ResponseEntity.ok(revisions);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<RevisionDto> getById(@PathVariable UUID id) {
        RevisionDto revision = revisionService.getById(id);
        return ResponseEntity.ok(revision);
    }
    
    @PostMapping
    public ResponseEntity<RevisionDto> create(@RequestBody RevisionPayload payload) {
        RevisionDto revision = revisionService.create(payload);
        return ResponseEntity.ok(revision);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<RevisionDto> update(
            @PathVariable UUID id,
            @RequestBody RevisionPayload payload) {
        
        RevisionDto revision = revisionService.update(id, payload);
        return ResponseEntity.ok(revision);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        revisionService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<UUID> ids) {
        revisionService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<RevisionDto> updateStatus(
            @PathVariable UUID id,
            @RequestBody RevisionStatus status) {
        
        RevisionDto revision = revisionService.updateStatus(id, status);
        return ResponseEntity.ok(revision);
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<RevisionDto> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedBy,
            @RequestParam String approvedByName) {
        
        RevisionDto revision = revisionService.approve(id, approvedBy, approvedByName);
        return ResponseEntity.ok(revision);
    }
    
    @PostMapping("/{id}/implement")
    public ResponseEntity<RevisionDto> implement(@PathVariable UUID id) {
        RevisionDto revision = revisionService.implement(id);
        return ResponseEntity.ok(revision);
    }
    
    @PostMapping("/{id}/obsolete")
    public ResponseEntity<RevisionDto> obsolete(@PathVariable UUID id) {
        RevisionDto revision = revisionService.obsolete(id);
        return ResponseEntity.ok(revision);
    }
    
    @PostMapping("/{id}/archive")
    public ResponseEntity<RevisionDto> archive(@PathVariable UUID id) {
        RevisionDto revision = revisionService.archive(id);
        return ResponseEntity.ok(revision);
    }
    
    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<RevisionDto>> getByJobId(@PathVariable UUID jobId) {
        List<RevisionDto> revisions = revisionService.getByJobId(jobId);
        return ResponseEntity.ok(revisions);
    }
    
    @GetMapping("/part/{partNumber}")
    public ResponseEntity<List<RevisionDto>> getByPartNumber(@PathVariable String partNumber) {
        List<RevisionDto> revisions = revisionService.getByPartNumber(partNumber);
        return ResponseEntity.ok(revisions);
    }
    
    @GetMapping("/part/{partNumber}/status/{status}")
    public ResponseEntity<List<RevisionDto>> getByPartNumberAndStatus(
            @PathVariable String partNumber,
            @PathVariable RevisionStatus status) {
        
        List<RevisionDto> revisions = revisionService.getByPartNumberAndStatus(partNumber, status);
        return ResponseEntity.ok(revisions);
    }
    
    @GetMapping("/eco-request/{changeRequestId}")
    public ResponseEntity<List<RevisionDto>> getByChangeRequestId(@PathVariable UUID changeRequestId) {
        List<RevisionDto> revisions = revisionService.getByChangeRequestId(changeRequestId);
        return ResponseEntity.ok(revisions);
    }
    
    @GetMapping("/part/{partNumber}/latest")
    public ResponseEntity<RevisionDto> getLatestRevisionByPartNumber(@PathVariable String partNumber) {
        RevisionDto revision = revisionService.getLatestRevisionByPartNumber(partNumber);
        return revision != null ? ResponseEntity.ok(revision) : ResponseEntity.notFound().build();
    }
    
    @GetMapping("/part/{partNumber}/latest/status/{status}")
    public ResponseEntity<RevisionDto> getLatestRevisionByPartNumberAndStatus(
            @PathVariable String partNumber,
            @PathVariable RevisionStatus status) {
        
        RevisionDto revision = revisionService.getLatestRevisionByPartNumberAndStatus(partNumber, status);
        return revision != null ? ResponseEntity.ok(revision) : ResponseEntity.notFound().build();
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<RevisionDto>> getActiveRevisions() {
        List<RevisionDto> revisions = revisionService.getActiveRevisions();
        return ResponseEntity.ok(revisions);
    }
    
    @GetMapping("/inactive")
    public ResponseEntity<List<RevisionDto>> getInactiveRevisions() {
        List<RevisionDto> revisions = revisionService.getInactiveRevisions();
        return ResponseEntity.ok(revisions);
    }
    
    @GetMapping("/count/status/{status}")
    public ResponseEntity<Long> countByStatus(@PathVariable RevisionStatus status) {
        long count = revisionService.countByStatus(status);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/active")
    public ResponseEntity<Long> countActive() {
        long count = revisionService.countActive();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/inactive")
    public ResponseEntity<Long> countInactive() {
        long count = revisionService.countInactive();
        return ResponseEntity.ok(count);
    }
}