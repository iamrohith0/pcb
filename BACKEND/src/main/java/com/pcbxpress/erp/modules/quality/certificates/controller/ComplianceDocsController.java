package com.pcbxpress.erp.modules.quality.certificates.controller;

import com.pcbxpress.erp.modules.quality.certificates.dto.ComplianceDocsDto;
import com.pcbxpress.erp.modules.quality.certificates.dto.ComplianceDocsPayload;
import com.pcbxpress.erp.modules.quality.certificates.model.ComplianceDocs;
import com.pcbxpress.erp.modules.quality.certificates.service.ComplianceDocsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/quality/certificates/compliance-docs")
@CrossOrigin(origins = "*")
public class ComplianceDocsController {
    
    @Autowired
    private ComplianceDocsService complianceDocsService;
    
    /**
     * Create a new compliance document
     */
    @PostMapping
    public ResponseEntity<ComplianceDocsDto> createComplianceDoc(@RequestBody ComplianceDocsPayload payload) {
        ComplianceDocsDto createdComplianceDoc = complianceDocsService.createComplianceDoc(payload);
        return new ResponseEntity<>(createdComplianceDoc, HttpStatus.CREATED);
    }
    
    /**
     * Get compliance document by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ComplianceDocsDto> getComplianceDocById(@PathVariable Long id) {
        Optional<ComplianceDocsDto> complianceDoc = complianceDocsService.getComplianceDocById(id);
        return complianceDoc.map(ResponseEntity::ok)
                           .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get compliance document by document number
     */
    @GetMapping("/number/{documentNo}")
    public ResponseEntity<ComplianceDocsDto> getComplianceDocByDocumentNo(@PathVariable String documentNo) {
        Optional<ComplianceDocsDto> complianceDoc = complianceDocsService.getComplianceDocByDocumentNo(documentNo);
        return complianceDoc.map(ResponseEntity::ok)
                           .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all compliance documents with pagination
     */
    @GetMapping
    public ResponseEntity<Page<ComplianceDocsDto>> getAllComplianceDocs(Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getAllComplianceDocs(pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by status with pagination
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByStatus(@PathVariable ComplianceDocs.Status status, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByStatus(status, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by customer
     */
    @GetMapping("/customer/{customer}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByCustomer(@PathVariable String customer) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByCustomer(customer);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by customer with pagination
     */
    @GetMapping("/customer/{customer}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByCustomerWithPagination(@PathVariable String customer, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByCustomer(customer, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by lot number
     */
    @GetMapping("/lot/{lotNo}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByLotNo(@PathVariable String lotNo) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByLotNo(lotNo);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by work order number
     */
    @GetMapping("/work-order/{workOrderNo}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByWorkOrderNo(@PathVariable String workOrderNo) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByWorkOrderNo(workOrderNo);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by shipment ID
     */
    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByShipmentId(@PathVariable String shipmentId) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByShipmentId(shipmentId);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDateRange(startDate, endDate);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by date range with pagination
     */
    @GetMapping("/date-range/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByDateRangeWithPagination(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by customer and date range
     */
    @GetMapping("/customer/{customer}/date-range")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByCustomerAndDateRange(
            @PathVariable String customer,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByCustomerAndDateRange(customer, startDate, endDate);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by customer and date range with pagination
     */
    @GetMapping("/customer/{customer}/date-range/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByCustomerAndDateRangeWithPagination(
            @PathVariable String customer,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByCustomerAndDateRange(customer, startDate, endDate, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by generated by user
     */
    @GetMapping("/generated-by/{generatedBy}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByGeneratedBy(@PathVariable String generatedBy) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByGeneratedBy(generatedBy);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by generated by user with pagination
     */
    @GetMapping("/generated-by/{generatedBy}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByGeneratedByWithPagination(@PathVariable String generatedBy, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByGeneratedBy(generatedBy, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by sent to user
     */
    @GetMapping("/sent-to/{sentTo}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsBySentTo(@PathVariable String sentTo) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsBySentTo(sentTo);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by sent to user with pagination
     */
    @GetMapping("/sent-to/{sentTo}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsBySentToWithPagination(@PathVariable String sentTo, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsBySentTo(sentTo, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by carrier
     */
    @GetMapping("/carrier/{carrier}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByCarrier(@PathVariable String carrier) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByCarrier(carrier);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by carrier with pagination
     */
    @GetMapping("/carrier/{carrier}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByCarrierWithPagination(@PathVariable String carrier, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByCarrier(carrier, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by AWB
     */
    @GetMapping("/awb/{awb}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByAwb(@PathVariable String awb) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByAwb(awb);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by AWB with pagination
     */
    @GetMapping("/awb/{awb}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByAwbWithPagination(@PathVariable String awb, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByAwb(awb, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by ship date
     */
    @GetMapping("/ship-date/{shipDate}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByShipDate(@PathVariable LocalDateTime shipDate) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByShipDate(shipDate);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by ship date with pagination
     */
    @GetMapping("/ship-date/{shipDate}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByShipDateWithPagination(@PathVariable LocalDateTime shipDate, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByShipDate(shipDate, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by ship date range
     */
    @GetMapping("/ship-date-range")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByShipDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByShipDateRange(startDate, endDate);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by ship date range with pagination
     */
    @GetMapping("/ship-date-range/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByShipDateRangeWithPagination(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByShipDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document type
     */
    @GetMapping("/document-type/{documentType}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByDocumentType(@PathVariable String documentType) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentType(documentType);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document type with pagination
     */
    @GetMapping("/document-type/{documentType}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByDocumentTypeWithPagination(@PathVariable String documentType, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentType(documentType, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document title
     */
    @GetMapping("/document-title/{documentTitle}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByDocumentTitle(@PathVariable String documentTitle) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentTitle(documentTitle);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document title with pagination
     */
    @GetMapping("/document-title/{documentTitle}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByDocumentTitleWithPagination(@PathVariable String documentTitle, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentTitle(documentTitle, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document version
     */
    @GetMapping("/document-version/{documentVersion}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByDocumentVersion(@PathVariable String documentVersion) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentVersion(documentVersion);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document version with pagination
     */
    @GetMapping("/document-version/{documentVersion}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByDocumentVersionWithPagination(@PathVariable String documentVersion, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentVersion(documentVersion, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document author
     */
    @GetMapping("/document-author/{documentAuthor}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByDocumentAuthor(@PathVariable String documentAuthor) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentAuthor(documentAuthor);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document author with pagination
     */
    @GetMapping("/document-author/{documentAuthor}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByDocumentAuthorWithPagination(@PathVariable String documentAuthor, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentAuthor(documentAuthor, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document approver
     */
    @GetMapping("/document-approver/{documentApprover}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByDocumentApprover(@PathVariable String documentApprover) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentApprover(documentApprover);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by document approver with pagination
     */
    @GetMapping("/document-approver/{documentApprover}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByDocumentApproverWithPagination(@PathVariable String documentApprover, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByDocumentApprover(documentApprover, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance standard
     */
    @GetMapping("/compliance-standard/{complianceStandard}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByComplianceStandard(@PathVariable String complianceStandard) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceStandard(complianceStandard);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance standard with pagination
     */
    @GetMapping("/compliance-standard/{complianceStandard}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByComplianceStandardWithPagination(@PathVariable String complianceStandard, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceStandard(complianceStandard, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance level
     */
    @GetMapping("/compliance-level/{complianceLevel}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByComplianceLevel(@PathVariable String complianceLevel) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceLevel(complianceLevel);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance level with pagination
     */
    @GetMapping("/compliance-level/{complianceLevel}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByComplianceLevelWithPagination(@PathVariable String complianceLevel, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceLevel(complianceLevel, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance scope
     */
    @GetMapping("/compliance-scope/{complianceScope}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByComplianceScope(@PathVariable String complianceScope) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceScope(complianceScope);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance scope with pagination
     */
    @GetMapping("/compliance-scope/{complianceScope}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByComplianceScopeWithPagination(@PathVariable String complianceScope, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceScope(complianceScope, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance status
     */
    @GetMapping("/compliance-status/{complianceStatus}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByComplianceStatus(@PathVariable String complianceStatus) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceStatus(complianceStatus);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance status with pagination
     */
    @GetMapping("/compliance-status/{complianceStatus}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByComplianceStatusWithPagination(@PathVariable String complianceStatus, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceStatus(complianceStatus, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance reviewer
     */
    @GetMapping("/compliance-reviewer/{complianceReviewer}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByComplianceReviewer(@PathVariable String complianceReviewer) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceReviewer(complianceReviewer);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by compliance reviewer with pagination
     */
    @GetMapping("/compliance-reviewer/{complianceReviewer}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByComplianceReviewerWithPagination(@PathVariable String complianceReviewer, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByComplianceReviewer(complianceReviewer, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by is public
     */
    @GetMapping("/is-public/{isPublic}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByIsPublic(@PathVariable Boolean isPublic) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByIsPublic(isPublic);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by is public with pagination
     */
    @GetMapping("/is-public/{isPublic}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByIsPublicWithPagination(@PathVariable Boolean isPublic, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByIsPublic(isPublic, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by is archived
     */
    @GetMapping("/is-archived/{isArchived}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByIsArchived(@PathVariable Boolean isArchived) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByIsArchived(isArchived);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by is archived with pagination
     */
    @GetMapping("/is-archived/{isArchived}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByIsArchivedWithPagination(@PathVariable Boolean isArchived, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByIsArchived(isArchived, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by archive reason
     */
    @GetMapping("/archive-reason/{archiveReason}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByArchiveReason(@PathVariable String archiveReason) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByArchiveReason(archiveReason);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by archive reason with pagination
     */
    @GetMapping("/archive-reason/{archiveReason}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByArchiveReasonWithPagination(@PathVariable String archiveReason, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByArchiveReason(archiveReason, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by archive location
     */
    @GetMapping("/archive-location/{archiveLocation}")
    public ResponseEntity<List<ComplianceDocsDto>> getComplianceDocsByArchiveLocation(@PathVariable String archiveLocation) {
        List<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByArchiveLocation(archiveLocation);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Get compliance documents by archive location with pagination
     */
    @GetMapping("/archive-location/{archiveLocation}/page")
    public ResponseEntity<Page<ComplianceDocsDto>> getComplianceDocsByArchiveLocationWithPagination(@PathVariable String archiveLocation, Pageable pageable) {
        Page<ComplianceDocsDto> complianceDocs = complianceDocsService.getComplianceDocsByArchiveLocation(archiveLocation, pageable);
        return ResponseEntity.ok(complianceDocs);
    }
    
    /**
     * Update compliance document
     */
    @PutMapping("/{id}")
    public ResponseEntity<ComplianceDocsDto> updateComplianceDoc(@PathVariable Long id, @RequestBody ComplianceDocsPayload payload) {
        Optional<ComplianceDocsDto> updatedComplianceDoc = complianceDocsService.updateComplianceDoc(id, payload);
        return updatedComplianceDoc.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Update compliance document status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplianceDocsDto> updateComplianceDocStatus(@PathVariable Long id, @RequestBody ComplianceDocs.Status status) {
        Optional<ComplianceDocsDto> updatedComplianceDoc = complianceDocsService.updateComplianceDocStatus(id, status);
        return updatedComplianceDoc.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark compliance document as generated
     */
    @PutMapping("/{id}/generate")
    public ResponseEntity<ComplianceDocsDto> markAsGenerated(@PathVariable Long id, @RequestParam String generatedBy) {
        Optional<ComplianceDocsDto> updatedComplianceDoc = complianceDocsService.markAsGenerated(id, generatedBy);
        return updatedComplianceDoc.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark compliance document as sent
     */
    @PutMapping("/{id}/send")
    public ResponseEntity<ComplianceDocsDto> markAsSent(@PathVariable Long id, @RequestParam String sentTo) {
        Optional<ComplianceDocsDto> updatedComplianceDoc = complianceDocsService.markAsSent(id, sentTo);
        return updatedComplianceDoc.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Cancel compliance document
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ComplianceDocsDto> cancelComplianceDoc(@PathVariable Long id) {
        Optional<ComplianceDocsDto> updatedComplianceDoc = complianceDocsService.cancelComplianceDoc(id);
        return updatedComplianceDoc.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Archive compliance document
     */
    @PutMapping("/{id}/archive")
    public ResponseEntity<ComplianceDocsDto> archiveComplianceDoc(@PathVariable Long id, @RequestParam String archiveReason) {
        Optional<ComplianceDocsDto> updatedComplianceDoc = complianceDocsService.archiveComplianceDoc(id, archiveReason);
        return updatedComplianceDoc.map(ResponseEntity::ok)
                                  .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Delete compliance document
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplianceDoc(@PathVariable Long id) {
        boolean deleted = complianceDocsService.deleteComplianceDoc(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Count compliance documents by status
     */
    @GetMapping("/count/status/{status}")
    public ResponseEntity<Long> countByStatus(@PathVariable ComplianceDocs.Status status) {
        long count = complianceDocsService.countByStatus(status);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by customer
     */
    @GetMapping("/count/customer/{customer}")
    public ResponseEntity<Long> countByCustomer(@PathVariable String customer) {
        long count = complianceDocsService.countByCustomer(customer);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by generated by user
     */
    @GetMapping("/count/generated-by/{generatedBy}")
    public ResponseEntity<Long> countByGeneratedBy(@PathVariable String generatedBy) {
        long count = complianceDocsService.countByGeneratedBy(generatedBy);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by sent to user
     */
    @GetMapping("/count/sent-to/{sentTo}")
    public ResponseEntity<Long> countBySentTo(@PathVariable String sentTo) {
        long count = complianceDocsService.countBySentTo(sentTo);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by carrier
     */
    @GetMapping("/count/carrier/{carrier}")
    public ResponseEntity<Long> countByCarrier(@PathVariable String carrier) {
        long count = complianceDocsService.countByCarrier(carrier);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by AWB
     */
    @GetMapping("/count/awb/{awb}")
    public ResponseEntity<Long> countByAwb(@PathVariable String awb) {
        long count = complianceDocsService.countByAwb(awb);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by document type
     */
    @GetMapping("/count/document-type/{documentType}")
    public ResponseEntity<Long> countByDocumentType(@PathVariable String documentType) {
        long count = complianceDocsService.countByDocumentType(documentType);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by compliance standard
     */
    @GetMapping("/count/compliance-standard/{complianceStandard}")
    public ResponseEntity<Long> countByComplianceStandard(@PathVariable String complianceStandard) {
        long count = complianceDocsService.countByComplianceStandard(complianceStandard);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by compliance level
     */
    @GetMapping("/count/compliance-level/{complianceLevel}")
    public ResponseEntity<Long> countByComplianceLevel(@PathVariable String complianceLevel) {
        long count = complianceDocsService.countByComplianceLevel(complianceLevel);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by compliance status
     */
    @GetMapping("/count/compliance-status/{complianceStatus}")
    public ResponseEntity<Long> countByComplianceStatus(@PathVariable String complianceStatus) {
        long count = complianceDocsService.countByComplianceStatus(complianceStatus);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by is public
     */
    @GetMapping("/count/is-public/{isPublic}")
    public ResponseEntity<Long> countByIsPublic(@PathVariable Boolean isPublic) {
        long count = complianceDocsService.countByIsPublic(isPublic);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count compliance documents by is archived
     */
    @GetMapping("/count/is-archived/{isArchived}")
    public ResponseEntity<Long> countByIsArchived(@PathVariable Boolean isArchived) {
        long count = complianceDocsService.countByIsArchived(isArchived);
        return ResponseEntity.ok(count);
    }
}