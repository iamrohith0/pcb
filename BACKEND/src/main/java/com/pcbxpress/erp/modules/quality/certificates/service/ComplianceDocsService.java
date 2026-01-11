package com.pcbxpress.erp.modules.quality.certificates.service;

import com.pcbxpress.erp.modules.quality.certificates.dto.ComplianceDocsDto;
import com.pcbxpress.erp.modules.quality.certificates.dto.ComplianceDocsPayload;
import com.pcbxpress.erp.modules.quality.certificates.model.ComplianceDocs;
import com.pcbxpress.erp.modules.quality.certificates.repository.ComplianceDocsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ComplianceDocsService {
    
    @Autowired
    private ComplianceDocsRepository complianceDocsRepository;
    
    /**
     * Create a new compliance document
     */
    @Transactional
    public ComplianceDocsDto createComplianceDoc(ComplianceDocsPayload payload) {
        ComplianceDocs complianceDoc = new ComplianceDocs();
        updateComplianceDocFromPayload(complianceDoc, payload);
        
        // Generate document number if not provided
        if (complianceDoc.getDocumentNo() == null || complianceDoc.getDocumentNo().isEmpty()) {
            complianceDoc.setDocumentNo(generateDocumentNumber());
        }
        
        // Set status to DRAFT by default
        if (complianceDoc.getStatus() == null) {
            complianceDoc.setStatus(ComplianceDocs.Status.DRAFT);
        }
        
        complianceDoc = complianceDocsRepository.save(complianceDoc);
        return new ComplianceDocsDto(complianceDoc);
    }
    
    /**
     * Get compliance document by ID
     */
    public Optional<ComplianceDocsDto> getComplianceDocById(Long id) {
        return complianceDocsRepository.findById(id).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance document by document number
     */
    public Optional<ComplianceDocsDto> getComplianceDocByDocumentNo(String documentNo) {
        return complianceDocsRepository.findByDocumentNo(documentNo).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get all compliance documents with pagination
     */
    public Page<ComplianceDocsDto> getAllComplianceDocs(Pageable pageable) {
        return complianceDocsRepository.findAll(pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by status with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByStatus(ComplianceDocs.Status status, Pageable pageable) {
        return complianceDocsRepository.findByStatus(status, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by customer
     */
    public List<ComplianceDocsDto> getComplianceDocsByCustomer(String customer) {
        return complianceDocsRepository.findByCustomer(customer).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by customer with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByCustomer(String customer, Pageable pageable) {
        return complianceDocsRepository.findByCustomer(customer, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by lot number
     */
    public List<ComplianceDocsDto> getComplianceDocsByLotNo(String lotNo) {
        return complianceDocsRepository.findByLotNo(lotNo).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by lot number with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByLotNo(String lotNo, Pageable pageable) {
        return complianceDocsRepository.findByLotNo(lotNo, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by work order number
     */
    public List<ComplianceDocsDto> getComplianceDocsByWorkOrderNo(String workOrderNo) {
        return complianceDocsRepository.findByWorkOrderNo(workOrderNo).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by work order number with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByWorkOrderNo(String workOrderNo, Pageable pageable) {
        return complianceDocsRepository.findByWorkOrderNo(workOrderNo, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by shipment ID
     */
    public List<ComplianceDocsDto> getComplianceDocsByShipmentId(String shipmentId) {
        return complianceDocsRepository.findByShipmentId(shipmentId).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by shipment ID with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByShipmentId(String shipmentId, Pageable pageable) {
        return complianceDocsRepository.findByShipmentId(shipmentId, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by date range
     */
    public List<ComplianceDocsDto> getComplianceDocsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return complianceDocsRepository.findByCreatedAtBetween(startDate, endDate).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by date range with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return complianceDocsRepository.findByCreatedAtBetween(startDate, endDate, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by customer and date range
     */
    public List<ComplianceDocsDto> getComplianceDocsByCustomerAndDateRange(String customer, LocalDateTime startDate, LocalDateTime endDate) {
        return complianceDocsRepository.findByCustomerAndCreatedAtBetween(customer, startDate, endDate).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by customer and date range with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByCustomerAndDateRange(String customer, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return complianceDocsRepository.findByCustomerAndCreatedAtBetween(customer, startDate, endDate, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by generated by user
     */
    public List<ComplianceDocsDto> getComplianceDocsByGeneratedBy(String generatedBy) {
        return complianceDocsRepository.findByGeneratedBy(generatedBy).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by generated by user with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByGeneratedBy(String generatedBy, Pageable pageable) {
        return complianceDocsRepository.findByGeneratedBy(generatedBy, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by sent to user
     */
    public List<ComplianceDocsDto> getComplianceDocsBySentTo(String sentTo) {
        return complianceDocsRepository.findBySentTo(sentTo).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by sent to user with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsBySentTo(String sentTo, Pageable pageable) {
        return complianceDocsRepository.findBySentTo(sentTo, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by carrier
     */
    public List<ComplianceDocsDto> getComplianceDocsByCarrier(String carrier) {
        return complianceDocsRepository.findByCarrier(carrier).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by carrier with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByCarrier(String carrier, Pageable pageable) {
        return complianceDocsRepository.findByCarrier(carrier, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by AWB
     */
    public List<ComplianceDocsDto> getComplianceDocsByAwb(String awb) {
        return complianceDocsRepository.findByAwb(awb).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by AWB with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByAwb(String awb, Pageable pageable) {
        return complianceDocsRepository.findByAwb(awb, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by ship date
     */
    public List<ComplianceDocsDto> getComplianceDocsByShipDate(LocalDateTime shipDate) {
        return complianceDocsRepository.findByShipDate(shipDate).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by ship date with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByShipDate(LocalDateTime shipDate, Pageable pageable) {
        return complianceDocsRepository.findByShipDate(shipDate, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by ship date range
     */
    public List<ComplianceDocsDto> getComplianceDocsByShipDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return complianceDocsRepository.findByShipDateBetween(startDate, endDate).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by ship date range with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByShipDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return complianceDocsRepository.findByShipDateBetween(startDate, endDate, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by document type
     */
    public List<ComplianceDocsDto> getComplianceDocsByDocumentType(String documentType) {
        return complianceDocsRepository.findByDocumentType(documentType).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by document type with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByDocumentType(String documentType, Pageable pageable) {
        return complianceDocsRepository.findByDocumentType(documentType, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by document title
     */
    public List<ComplianceDocsDto> getComplianceDocsByDocumentTitle(String documentTitle) {
        return complianceDocsRepository.findByDocumentTitle(documentTitle).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by document title with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByDocumentTitle(String documentTitle, Pageable pageable) {
        return complianceDocsRepository.findByDocumentTitle(documentTitle, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by document version
     */
    public List<ComplianceDocsDto> getComplianceDocsByDocumentVersion(String documentVersion) {
        return complianceDocsRepository.findByDocumentVersion(documentVersion).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by document version with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByDocumentVersion(String documentVersion, Pageable pageable) {
        return complianceDocsRepository.findByDocumentVersion(documentVersion, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by document author
     */
    public List<ComplianceDocsDto> getComplianceDocsByDocumentAuthor(String documentAuthor) {
        return complianceDocsRepository.findByDocumentAuthor(documentAuthor).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by document author with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByDocumentAuthor(String documentAuthor, Pageable pageable) {
        return complianceDocsRepository.findByDocumentAuthor(documentAuthor, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by document approver
     */
    public List<ComplianceDocsDto> getComplianceDocsByDocumentApprover(String documentApprover) {
        return complianceDocsRepository.findByDocumentApprover(documentApprover).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by document approver with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByDocumentApprover(String documentApprover, Pageable pageable) {
        return complianceDocsRepository.findByDocumentApprover(documentApprover, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by compliance standard
     */
    public List<ComplianceDocsDto> getComplianceDocsByComplianceStandard(String complianceStandard) {
        return complianceDocsRepository.findByComplianceStandard(complianceStandard).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by compliance standard with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByComplianceStandard(String complianceStandard, Pageable pageable) {
        return complianceDocsRepository.findByComplianceStandard(complianceStandard, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by compliance level
     */
    public List<ComplianceDocsDto> getComplianceDocsByComplianceLevel(String complianceLevel) {
        return complianceDocsRepository.findByComplianceLevel(complianceLevel).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by compliance level with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByComplianceLevel(String complianceLevel, Pageable pageable) {
        return complianceDocsRepository.findByComplianceLevel(complianceLevel, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by compliance scope
     */
    public List<ComplianceDocsDto> getComplianceDocsByComplianceScope(String complianceScope) {
        return complianceDocsRepository.findByComplianceScope(complianceScope).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by compliance scope with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByComplianceScope(String complianceScope, Pageable pageable) {
        return complianceDocsRepository.findByComplianceScope(complianceScope, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by compliance status
     */
    public List<ComplianceDocsDto> getComplianceDocsByComplianceStatus(String complianceStatus) {
        return complianceDocsRepository.findByComplianceStatus(complianceStatus).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by compliance status with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByComplianceStatus(String complianceStatus, Pageable pageable) {
        return complianceDocsRepository.findByComplianceStatus(complianceStatus, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by compliance reviewer
     */
    public List<ComplianceDocsDto> getComplianceDocsByComplianceReviewer(String complianceReviewer) {
        return complianceDocsRepository.findByComplianceReviewer(complianceReviewer).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by compliance reviewer with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByComplianceReviewer(String complianceReviewer, Pageable pageable) {
        return complianceDocsRepository.findByComplianceReviewer(complianceReviewer, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by is public
     */
    public List<ComplianceDocsDto> getComplianceDocsByIsPublic(Boolean isPublic) {
        return complianceDocsRepository.findByIsPublic(isPublic).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by is public with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByIsPublic(Boolean isPublic, Pageable pageable) {
        return complianceDocsRepository.findByIsPublic(isPublic, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by is archived
     */
    public List<ComplianceDocsDto> getComplianceDocsByIsArchived(Boolean isArchived) {
        return complianceDocsRepository.findByIsArchived(isArchived).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by is archived with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByIsArchived(Boolean isArchived, Pageable pageable) {
        return complianceDocsRepository.findByIsArchived(isArchived, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by archive reason
     */
    public List<ComplianceDocsDto> getComplianceDocsByArchiveReason(String archiveReason) {
        return complianceDocsRepository.findByArchiveReason(archiveReason).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by archive reason with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByArchiveReason(String archiveReason, Pageable pageable) {
        return complianceDocsRepository.findByArchiveReason(archiveReason, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Get compliance documents by archive location
     */
    public List<ComplianceDocsDto> getComplianceDocsByArchiveLocation(String archiveLocation) {
        return complianceDocsRepository.findByArchiveLocation(archiveLocation).stream().map(ComplianceDocsDto::new).toList();
    }
    
    /**
     * Get compliance documents by archive location with pagination
     */
    public Page<ComplianceDocsDto> getComplianceDocsByArchiveLocation(String archiveLocation, Pageable pageable) {
        return complianceDocsRepository.findByArchiveLocation(archiveLocation, pageable).map(ComplianceDocsDto::new);
    }
    
    /**
     * Update compliance document
     */
    @Transactional
    public Optional<ComplianceDocsDto> updateComplianceDoc(Long id, ComplianceDocsPayload payload) {
        return complianceDocsRepository.findById(id).map(existingComplianceDoc -> {
            updateComplianceDocFromPayload(existingComplianceDoc, payload);
            existingComplianceDoc = complianceDocsRepository.save(existingComplianceDoc);
            return new ComplianceDocsDto(existingComplianceDoc);
        });
    }
    
    /**
     * Update compliance document status
     */
    @Transactional
    public Optional<ComplianceDocsDto> updateComplianceDocStatus(Long id, ComplianceDocs.Status status) {
        return complianceDocsRepository.findById(id).map(existingComplianceDoc -> {
            existingComplianceDoc.setStatus(status);
            existingComplianceDoc = complianceDocsRepository.save(existingComplianceDoc);
            return new ComplianceDocsDto(existingComplianceDoc);
        });
    }
    
    /**
     * Update compliance document as generated
     */
    @Transactional
    public Optional<ComplianceDocsDto> markAsGenerated(Long id, String generatedBy) {
        return complianceDocsRepository.findById(id).map(existingComplianceDoc -> {
            existingComplianceDoc.setStatus(ComplianceDocs.Status.READY);
            existingComplianceDoc.setGeneratedBy(generatedBy);
            existingComplianceDoc.setGeneratedAt(LocalDateTime.now());
            existingComplianceDoc = complianceDocsRepository.save(existingComplianceDoc);
            return new ComplianceDocsDto(existingComplianceDoc);
        });
    }
    
    /**
     * Update compliance document as sent
     */
    @Transactional
    public Optional<ComplianceDocsDto> markAsSent(Long id, String sentTo) {
        return complianceDocsRepository.findById(id).map(existingComplianceDoc -> {
            existingComplianceDoc.setStatus(ComplianceDocs.Status.SENT);
            existingComplianceDoc.setSentTo(sentTo);
            existingComplianceDoc.setSentAt(LocalDateTime.now());
            existingComplianceDoc = complianceDocsRepository.save(existingComplianceDoc);
            return new ComplianceDocsDto(existingComplianceDoc);
        });
    }
    
    /**
     * Cancel compliance document
     */
    @Transactional
    public Optional<ComplianceDocsDto> cancelComplianceDoc(Long id) {
        return complianceDocsRepository.findById(id).map(existingComplianceDoc -> {
            existingComplianceDoc.setStatus(ComplianceDocs.Status.CANCELLED);
            existingComplianceDoc = complianceDocsRepository.save(existingComplianceDoc);
            return new ComplianceDocsDto(existingComplianceDoc);
        });
    }
    
    /**
     * Archive compliance document
     */
    @Transactional
    public Optional<ComplianceDocsDto> archiveComplianceDoc(Long id, String archiveReason) {
        return complianceDocsRepository.findById(id).map(existingComplianceDoc -> {
            existingComplianceDoc.setStatus(ComplianceDocs.Status.ARCHIVED);
            existingComplianceDoc.setIsArchived(true);
            existingComplianceDoc.setArchiveDate(LocalDateTime.now());
            existingComplianceDoc.setArchiveReason(archiveReason);
            existingComplianceDoc = complianceDocsRepository.save(existingComplianceDoc);
            return new ComplianceDocsDto(existingComplianceDoc);
        });
    }
    
    /**
     * Delete compliance document
     */
    @Transactional
    public boolean deleteComplianceDoc(Long id) {
        if (complianceDocsRepository.existsById(id)) {
            complianceDocsRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    /**
     * Count compliance documents by status
     */
    public long countByStatus(ComplianceDocs.Status status) {
        return complianceDocsRepository.countByStatus(status);
    }
    
    /**
     * Count compliance documents by customer
     */
    public long countByCustomer(String customer) {
        return complianceDocsRepository.countByCustomer(customer);
    }
    
    /**
     * Count compliance documents by generated by user
     */
    public long countByGeneratedBy(String generatedBy) {
        return complianceDocsRepository.countByGeneratedBy(generatedBy);
    }
    
    /**
     * Count compliance documents by sent to user
     */
    public long countBySentTo(String sentTo) {
        return complianceDocsRepository.countBySentTo(sentTo);
    }
    
    /**
     * Count compliance documents by carrier
     */
    public long countByCarrier(String carrier) {
        return complianceDocsRepository.countByCarrier(carrier);
    }
    
    /**
     * Count compliance documents by AWB
     */
    public long countByAwb(String awb) {
        return complianceDocsRepository.countByAwb(awb);
    }
    
    /**
     * Count compliance documents by document type
     */
    public long countByDocumentType(String documentType) {
        return complianceDocsRepository.countByDocumentType(documentType);
    }
    
    /**
     * Count compliance documents by compliance standard
     */
    public long countByComplianceStandard(String complianceStandard) {
        return complianceDocsRepository.countByComplianceStandard(complianceStandard);
    }
    
    /**
     * Count compliance documents by compliance level
     */
    public long countByComplianceLevel(String complianceLevel) {
        return complianceDocsRepository.countByComplianceLevel(complianceLevel);
    }
    
    /**
     * Count compliance documents by compliance status
     */
    public long countByComplianceStatus(String complianceStatus) {
        return complianceDocsRepository.countByComplianceStatus(complianceStatus);
    }
    
    /**
     * Count compliance documents by is public
     */
    public long countByIsPublic(Boolean isPublic) {
        return complianceDocsRepository.countByIsPublic(isPublic);
    }
    
    /**
     * Count compliance documents by is archived
     */
    public long countByIsArchived(Boolean isArchived) {
        return complianceDocsRepository.countByIsArchived(isArchived);
    }
    
    /**
     * Generate document number
     */
    private String generateDocumentNumber() {
        // Get the latest document number with prefix format like "DOC-YYYY-XXXX"
        String year = String.valueOf(LocalDateTime.now().getYear());
        String prefix = "DOC-" + year + "-";
        
        String latestDocumentNo = complianceDocsRepository.findLatestDocumentNoByPrefix(prefix);
        
        int nextNumber = 1;
        if (latestDocumentNo != null && !latestDocumentNo.isEmpty()) {
            try {
                String numberPart = latestDocumentNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                // If parsing fails, start from 1
                nextNumber = 1;
            }
        }
        
        return prefix + String.format("%04d", nextNumber);
    }
    
    /**
     * Update compliance document entity from payload
     */
    private void updateComplianceDocFromPayload(ComplianceDocs complianceDoc, ComplianceDocsPayload payload) {
        complianceDoc.setOrderNo(payload.getOrderNo());
        complianceDoc.setCustomer(payload.getCustomer());
        complianceDoc.setPoNo(payload.getPoNo());
        complianceDoc.setPcbType(payload.getPcbType());
        complianceDoc.setFinish(payload.getFinish());
        complianceDoc.setQuantity(payload.getQuantity());
        complianceDoc.setLotNo(payload.getLotNo());
        complianceDoc.setWorkOrderNo(payload.getWorkOrderNo());
        complianceDoc.setShipmentId(payload.getShipmentId());
        complianceDoc.setCarrier(payload.getCarrier());
        complianceDoc.setAwb(payload.getAwb());
        complianceDoc.setShipDate(payload.getShipDate());
        complianceDoc.setStatus(payload.getStatus());
        complianceDoc.setTemplateId(payload.getTemplateId());
        complianceDoc.setIncludeTestReports(payload.getIncludeTestReports());
        complianceDoc.setIncludeAOISummary(payload.getIncludeAOISummary());
        complianceDoc.setIncludeEtchCoupons(payload.getIncludeEtchCoupons());
        complianceDoc.setNotes(payload.getNotes());
        complianceDoc.setGeneratedBy(payload.getGeneratedBy());
        complianceDoc.setSentTo(payload.getSentTo());
        
        // Compliance Docs specific fields
        complianceDoc.setDocumentType(payload.getDocumentType());
        complianceDoc.setDocumentTitle(payload.getDocumentTitle());
        complianceDoc.setDocumentVersion(payload.getDocumentVersion());
        complianceDoc.setDocumentDate(payload.getDocumentDate());
        complianceDoc.setDocumentAuthor(payload.getDocumentAuthor());
        complianceDoc.setDocumentApprover(payload.getDocumentApprover());
        complianceDoc.setApprovalDate(payload.getApprovalDate());
        complianceDoc.setComplianceStandard(payload.getComplianceStandard());
        complianceDoc.setComplianceReference(payload.getComplianceReference());
        complianceDoc.setComplianceLevel(payload.getComplianceLevel());
        complianceDoc.setComplianceScope(payload.getComplianceScope());
        complianceDoc.setComplianceRequirements(payload.getComplianceRequirements());
        complianceDoc.setComplianceEvidence(payload.getComplianceEvidence());
        complianceDoc.setComplianceStatus(payload.getComplianceStatus());
        complianceDoc.setComplianceReviewDate(payload.getComplianceReviewDate());
        complianceDoc.setComplianceReviewer(payload.getComplianceReviewer());
        complianceDoc.setComplianceComments(payload.getComplianceComments());
        complianceDoc.setDocumentUrl(payload.getDocumentUrl());
        complianceDoc.setDocumentPath(payload.getDocumentPath());
        complianceDoc.setDocumentSize(payload.getDocumentSize());
        complianceDoc.setDocumentFormat(payload.getDocumentFormat());
        complianceDoc.setIsPublic(payload.getIsPublic());
        complianceDoc.setIsArchived(payload.getIsArchived());
        complianceDoc.setArchiveDate(payload.getArchiveDate());
        complianceDoc.setArchiveReason(payload.getArchiveReason());
        complianceDoc.setArchiveLocation(payload.getArchiveLocation());
    }
}