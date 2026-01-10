package com.pcbxpress.erp.modules.engineering.cam.service;

import com.pcbxpress.erp.modules.engineering.cam.dto.CamJobDto;
import com.pcbxpress.erp.modules.engineering.cam.dto.CamJobPayload;
import com.pcbxpress.erp.modules.engineering.cam.model.CamJob;
import com.pcbxpress.erp.modules.engineering.cam.model.CamJobStatus;
import com.pcbxpress.erp.modules.engineering.cam.model.CamJobStatus;
import com.pcbxpress.erp.modules.engineering.cam.repository.CamJobRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CamJobService {
    
    private final CamJobRepository camJobRepository;
    
    public CamJobService(CamJobRepository camJobRepository) {
        this.camJobRepository = camJobRepository;
    }
    
    public List<CamJobDto> list(String query, String status, UUID customerId) {
        List<CamJob> jobs = camJobRepository.findAll();
        
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            jobs = jobs.stream()
                .filter(j -> matchesQuery(j, q))
                .collect(Collectors.toList());
        }
        
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
            try {
                CamJobStatus jobStatus = CamJobStatus.valueOf(status.toUpperCase());
                jobs = jobs.stream()
                    .filter(j -> j.getStatus() == jobStatus)
                    .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // Invalid status, return empty list or handle as needed
            }
        }
        
        if (customerId != null) {
            jobs = jobs.stream()
                .filter(j -> j.getCustomerId().equals(customerId))
                .collect(Collectors.toList());
        }
        
        return jobs.stream()
            .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
            .map(CamJobDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public CamJobDto getById(UUID id) {
        CamJob job = camJobRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM job not found: " + id));
        return CamJobDto.fromEntity(job);
    }
    
    public CamJobDto create(CamJobPayload payload) {
        CamJob job = new CamJob();
        job.setId(UUID.randomUUID());
        job.setCreatedAt(OffsetDateTime.now());
        job.setUpdatedAt(OffsetDateTime.now());
        
        applyPayload(job, payload);
        
        // Set default status if not provided
        if (job.getStatus() == null) {
            job.setStatus(CamJobStatus.DRAFT);
        }
        
        // Generate job number if not provided
        if (job.getJobNumber() == null || job.getJobNumber().trim().isEmpty()) {
            job.setJobNumber(generateJobNumber());
        }
        
        CamJob saved = camJobRepository.save(job);
        return CamJobDto.fromEntity(saved);
    }
    
    public CamJobDto update(UUID id, CamJobPayload payload) {
        CamJob existing = camJobRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM job not found: " + id));
        
        applyPayload(existing, payload);
        existing.setUpdatedAt(OffsetDateTime.now());
        
        CamJob saved = camJobRepository.save(existing);
        return CamJobDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        CamJob job = camJobRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM job not found: " + id));
        camJobRepository.delete(job);
    }
    
    public void deleteBulk(List<UUID> ids) {
        List<CamJob> jobs = camJobRepository.findAllById(ids);
        camJobRepository.deleteAll(jobs);
    }
    
    public CamJobDto updateStatus(UUID id, CamJobStatus status) {
        CamJob job = camJobRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM job not found: " + id));
        
        job.setStatus(status);
        if (status == CamJobStatus.COMPLETED) {
            job.setCompletedAt(OffsetDateTime.now());
        }
        job.setUpdatedAt(OffsetDateTime.now());
        
        CamJob saved = camJobRepository.save(job);
        return CamJobDto.fromEntity(saved);
    }
    
    public List<CamJobDto> getByStatus(CamJobStatus status) {
        return camJobRepository.findByStatus(status).stream()
            .map(CamJobDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<CamJobDto> getByCustomerId(UUID customerId) {
        return camJobRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .map(CamJobDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public long countByStatus(CamJobStatus status) {
        return camJobRepository.countByStatus(status);
    }
    
    private void applyPayload(CamJob job, CamJobPayload payload) {
        job.setJobNumber(payload.jobNumber());
        job.setCustomerId(payload.customerId());
        job.setCustomerName(payload.customerName());
        job.setPartNumber(payload.partNumber());
        job.setRevision(payload.revision());
        job.setDescription(payload.description());
        job.setLayerCount(payload.layerCount());
        job.setBoardThickness(payload.boardThickness());
        job.setCopperThickness(payload.copperThickness());
        job.setMaterialType(payload.materialType());
        job.setSolderMask(payload.solderMask());
        job.setLegend(payload.legend());
        job.setSurfaceFinish(payload.surfaceFinish());
        job.setPanelSizeX(payload.panelSizeX());
        job.setPanelSizeY(payload.panelSizeY());
        job.setPanelizationType(payload.panelizationType());
        job.setRoutingType(payload.routingType());
        job.setVScore(payload.vScore());
        job.setTabRout(payload.tabRout());
        job.setCastellatedHoles(payload.castellatedHoles());
        job.setEdgePlating(payload.edgePlating());
        job.setImpedanceControl(payload.impedanceControl());
        job.setTestPoints(payload.testPoints());
        job.setFiducials(payload.fiducials());
        job.setToolingHoles(payload.toolingHoles());
        job.setReferenceDesignators(payload.referenceDesignators());
        job.setComponentOutlines(payload.componentOutlines());
        job.setAssemblyVariants(payload.assemblyVariants());
        job.setSpecialInstructions(payload.specialInstructions());
        job.setStatus(payload.status());
        job.setGerberFiles(payload.gerberFiles());
        job.setAssignedTo(payload.assignedTo());
        job.setAssignedName(payload.assignedName());
        job.setPriority(payload.priority());
        job.setEstimatedHours(payload.estimatedHours());
        job.setActualHours(payload.actualHours());
        job.setNotes(payload.notes());
    }
    
    private String generateJobNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "CAM-" + token;
    }
    
    private boolean matchesQuery(CamJob job, String query) {
        return job.getJobNumber().toLowerCase().contains(query) ||
               job.getPartNumber().toLowerCase().contains(query) ||
               job.getCustomerName().toLowerCase().contains(query) ||
               (job.getDescription() != null && job.getDescription().toLowerCase().contains(query));
    }
}