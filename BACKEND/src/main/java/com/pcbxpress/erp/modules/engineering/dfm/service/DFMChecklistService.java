package com.pcbxpress.erp.modules.engineering.dfm.service;

import com.pcbxpress.erp.modules.engineering.dfm.dto.DFMChecklistDto;
import com.pcbxpress.erp.modules.engineering.dfm.dto.DFMChecklistPayload;
import com.pcbxpress.erp.modules.engineering.dfm.model.DFMChecklist;
import com.pcbxpress.erp.modules.engineering.dfm.model.DFMStatus;
import com.pcbxpress.erp.modules.engineering.dfm.repository.DFMChecklistRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DFMChecklistService {
    
    private final DFMChecklistRepository dfmChecklistRepository;
    
    public DFMChecklistService(DFMChecklistRepository dfmChecklistRepository) {
        this.dfmChecklistRepository = dfmChecklistRepository;
    }
    
    public List<DFMChecklistDto> list(String query, String status, UUID customerId, UUID jobId) {
        List<DFMChecklist> checklists = dfmChecklistRepository.findAll();
        
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            checklists = checklists.stream()
                .filter(c -> matchesQuery(c, q))
                .collect(Collectors.toList());
        }
        
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
            try {
                DFMStatus checklistStatus = DFMStatus.valueOf(status.toUpperCase());
                checklists = checklists.stream()
                    .filter(c -> c.getStatus() == checklistStatus)
                    .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // Invalid status, return empty list or handle as needed
            }
        }
        
        if (customerId != null) {
            checklists = checklists.stream()
                .filter(c -> c.getCustomerId().equals(customerId))
                .collect(Collectors.toList());
        }
        
        if (jobId != null) {
            checklists = checklists.stream()
                .filter(c -> c.getJobId().equals(jobId))
                .collect(Collectors.toList());
        }
        
        return checklists.stream()
            .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
            .map(DFMChecklistDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public DFMChecklistDto getById(UUID id) {
        DFMChecklist checklist = dfmChecklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("DFM checklist not found: " + id));
        return DFMChecklistDto.fromEntity(checklist);
    }
    
    public DFMChecklistDto getLatestByJobId(UUID jobId) {
        DFMChecklist checklist = dfmChecklistRepository.findLatestVersionByJobId(jobId);
        if (checklist == null) {
            throw new RuntimeException("No DFM checklist found for job: " + jobId);
        }
        return DFMChecklistDto.fromEntity(checklist);
    }
    
    public List<DFMChecklistDto> getByJobId(UUID jobId) {
        return dfmChecklistRepository.findByJobIdOrderByCreatedAtDesc(jobId).stream()
            .map(DFMChecklistDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<DFMChecklistDto> getByCustomerId(UUID customerId) {
        return dfmChecklistRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .map(DFMChecklistDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public DFMChecklistDto create(DFMChecklistPayload payload) {
        DFMChecklist checklist = new DFMChecklist();
        checklist.setId(UUID.randomUUID());
        checklist.setCreatedAt(OffsetDateTime.now());
        checklist.setUpdatedAt(OffsetDateTime.now());
        
        applyPayload(checklist, payload);
        
        // Set default status if not provided
        if (checklist.getStatus() == null) {
            checklist.setStatus(DFMStatus.DRAFT);
        }
        
        // Set version
        if (checklist.getVersion() == null) {
            Integer maxVersion = getMaxVersionByJobId(checklist.getJobId());
            checklist.setVersion(maxVersion != null ? maxVersion + 1 : 1);
        }
        
        // Set isLatest
        checklist.setLatest(true);
        updateLatestFlag(checklist.getJobId(), checklist.getId());
        
        DFMChecklist saved = dfmChecklistRepository.save(checklist);
        return DFMChecklistDto.fromEntity(saved);
    }
    
    public DFMChecklistDto update(UUID id, DFMChecklistPayload payload) {
        DFMChecklist existing = dfmChecklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("DFM checklist not found: " + id));
        
        applyPayload(existing, payload);
        existing.setUpdatedAt(OffsetDateTime.now());
        
        DFMChecklist saved = dfmChecklistRepository.save(existing);
        return DFMChecklistDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        DFMChecklist checklist = dfmChecklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("DFM checklist not found: " + id));
        dfmChecklistRepository.delete(checklist);
    }
    
    public void deleteBulk(List<UUID> ids) {
        List<DFMChecklist> checklists = dfmChecklistRepository.findAllById(ids);
        dfmChecklistRepository.deleteAll(checklists);
    }
    
    public DFMChecklistDto updateStatus(UUID id, DFMStatus status) {
        DFMChecklist checklist = dfmChecklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("DFM checklist not found: " + id));
        
        checklist.setStatus(status);
        checklist.setUpdatedAt(OffsetDateTime.now());
        
        DFMChecklist saved = dfmChecklistRepository.save(checklist);
        return DFMChecklistDto.fromEntity(saved);
    }
    
    public DFMChecklistDto approve(UUID id, UUID approvedBy, String approvedByName) {
        DFMChecklist checklist = dfmChecklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("DFM checklist not found: " + id));
        
        checklist.setStatus(DFMStatus.APPROVED);
        checklist.setApprovedBy(approvedBy);
        checklist.setApprovedByName(approvedByName);
        checklist.setApprovedAt(OffsetDateTime.now());
        checklist.setUpdatedAt(OffsetDateTime.now());
        
        DFMChecklist saved = dfmChecklistRepository.save(checklist);
        return DFMChecklistDto.fromEntity(saved);
    }
    
    public DFMChecklistDto reject(UUID id, UUID rejectedBy, String rejectedByName, String rejectedReason) {
        DFMChecklist checklist = dfmChecklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("DFM checklist not found: " + id));
        
        checklist.setStatus(DFMStatus.REJECTED);
        checklist.setRejectedBy(rejectedBy);
        checklist.setRejectedByName(rejectedByName);
        checklist.setRejectedAt(OffsetDateTime.now());
        checklist.setRejectedReason(rejectedReason);
        checklist.setUpdatedAt(OffsetDateTime.now());
        
        DFMChecklist saved = dfmChecklistRepository.save(checklist);
        return DFMChecklistDto.fromEntity(saved);
    }
    
    public long countByStatus(DFMStatus status) {
        return dfmChecklistRepository.countByStatus(status);
    }
    
    public long countByJobId(UUID jobId) {
        return dfmChecklistRepository.countByJobId(jobId);
    }
    
    public long countByCustomerId(UUID customerId) {
        return dfmChecklistRepository.countByIsLatestTrueAndCustomerId(customerId);
    }
    
    private void applyPayload(DFMChecklist checklist, DFMChecklistPayload payload) {
        checklist.setJobId(payload.jobId());
        checklist.setJobNumber(payload.jobNumber());
        checklist.setCustomerId(payload.customerId());
        checklist.setCustomerName(payload.customerName());
        checklist.setPartNumber(payload.partNumber());
        checklist.setRevision(payload.revision());
        checklist.setLayerCount(payload.layerCount());
        checklist.setBoardThickness(payload.boardThickness());
        checklist.setCopperThickness(payload.copperThickness());
        checklist.setMaterialType(payload.materialType());
        checklist.setSolderMask(payload.solderMask());
        checklist.setLegend(payload.legend());
        checklist.setSurfaceFinish(payload.surfaceFinish());
        checklist.setPanelSizeX(payload.panelSizeX());
        checklist.setPanelSizeY(payload.panelSizeY());
        checklist.setMinTraceWidth(payload.minTraceWidth());
        checklist.setMinTraceSpacing(payload.minTraceSpacing());
        checklist.setMinHoleSize(payload.minHoleSize());
        checklist.setMinAnnularRing(payload.minAnnularRing());
        checklist.setCopperClearance(payload.copperClearance());
        checklist.setSoldermaskClearance(payload.soldermaskClearance());
        checklist.setSilkscreenClearance(payload.silkscreenClearance());
        checklist.setViasInPads(payload.viasInPads());
        checklist.setBlindBuriedVias(payload.blindBuriedVias());
        checklist.setImpedanceControlled(payload.impedanceControlled());
        checklist.setControlledDepthRouting(payload.controlledDepthRouting());
        checklist.setCastellatedHoles(payload.castellatedHoles());
        checklist.setEdgePlating(payload.edgePlating());
        checklist.setBackdrilling(payload.backdrilling());
        checklist.setLaserDrilling(payload.laserDrilling());
        checklist.setRigidFlex(payload.rigidFlex());
        checklist.setHdi(payload.hdi());
        checklist.setFlexRigid(payload.flexRigid());
        checklist.setFlexCable(payload.flexCable());
        checklist.setRigidPcb(payload.rigidPcb());
        checklist.setMetalCore(payload.metalCore());
        checklist.setCeramicSubstrate(payload.ceramicSubstrate());
        checklist.setHighFreqMaterial(payload.highFreqMaterial());
        checklist.setHighTempMaterial(payload.highTempMaterial());
        checklist.setFlexibleMaterial(payload.flexibleMaterial());
        checklist.setRigidMaterial(payload.rigidMaterial());
        checklist.setStandardMaterial(payload.standardMaterial());
        checklist.setSpecialMaterial(payload.specialMaterial());
        checklist.setMaterialNotes(payload.materialNotes());
        checklist.setDesignNotes(payload.designNotes());
        checklist.setManufacturingNotes(payload.manufacturingNotes());
        checklist.setTestNotes(payload.testNotes());
        checklist.setAssemblyNotes(payload.assemblyNotes());
        checklist.setPackagingNotes(payload.packagingNotes());
        checklist.setShippingNotes(payload.shippingNotes());
        checklist.setCostNotes(payload.costNotes());
        checklist.setScheduleNotes(payload.scheduleNotes());
        checklist.setQualityNotes(payload.qualityNotes());
        checklist.setReliabilityNotes(payload.reliabilityNotes());
        checklist.setEnvironmentalNotes(payload.environmentalNotes());
        checklist.setComplianceNotes(payload.complianceNotes());
        checklist.setSafetyNotes(payload.safetyNotes());
        checklist.setRegulatoryNotes(payload.regulatoryNotes());
        checklist.setCustomerRequirements(payload.customerRequirements());
        checklist.setEngineeringRequirements(payload.engineeringRequirements());
        checklist.setManufacturingRequirements(payload.manufacturingRequirements());
        checklist.setTestRequirements(payload.testRequirements());
        checklist.setAssemblyRequirements(payload.assemblyRequirements());
        checklist.setPackagingRequirements(payload.packagingRequirements());
        checklist.setShippingRequirements(payload.shippingRequirements());
        checklist.setCostRequirements(payload.costRequirements());
        checklist.setScheduleRequirements(payload.scheduleRequirements());
        checklist.setQualityRequirements(payload.qualityRequirements());
        checklist.setReliabilityRequirements(payload.reliabilityRequirements());
        checklist.setEnvironmentalRequirements(payload.environmentalRequirements());
        checklist.setComplianceRequirements(payload.complianceRequirements());
        checklist.setSafetyRequirements(payload.safetyRequirements());
        checklist.setRegulatoryRequirements(payload.regulatoryRequirements());
        checklist.setStatus(payload.status());
        checklist.setCreatedBy(payload.createdBy());
        checklist.setCreatedByName(payload.createdByName());
        checklist.setApprovedBy(payload.approvedBy());
        checklist.setApprovedByName(payload.approvedByName());
        checklist.setRejectedBy(payload.rejectedBy());
        checklist.setRejectedByName(payload.rejectedByName());
        checklist.setRejectedReason(payload.rejectedReason());
        checklist.setVersion(payload.version());
        checklist.setLatest(payload.isLatest());
    }
    
    private Integer getMaxVersionByJobId(UUID jobId) {
        List<DFMChecklist> checklists = dfmChecklistRepository.findByJobIdOrderByCreatedAtDesc(jobId);
        if (checklists.isEmpty()) {
            return null;
        }
        return checklists.stream()
            .map(DFMChecklist::getVersion)
            .max(Integer::compare)
            .orElse(null);
    }
    
    private void updateLatestFlag(UUID jobId, UUID excludeId) {
        List<DFMChecklist> checklists = dfmChecklistRepository.findByJobIdOrderByCreatedAtDesc(jobId);
        for (DFMChecklist checklist : checklists) {
            if (!checklist.getId().equals(excludeId)) {
                checklist.setLatest(false);
                dfmChecklistRepository.save(checklist);
            }
        }
    }
    
    private boolean matchesQuery(DFMChecklist checklist, String query) {
        return checklist.getJobNumber().toLowerCase().contains(query) ||
               checklist.getPartNumber().toLowerCase().contains(query) ||
               checklist.getCustomerName().toLowerCase().contains(query) ||
               (checklist.getMaterialType() != null && checklist.getMaterialType().toLowerCase().contains(query)) ||
               (checklist.getDesignNotes() != null && checklist.getDesignNotes().toLowerCase().contains(query));
    }
}