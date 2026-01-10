package com.pcbxpress.erp.modules.engineering.panelization.service;

import com.pcbxpress.erp.modules.engineering.panelization.dto.PanelTemplateDto;
import com.pcbxpress.erp.modules.engineering.panelization.dto.PanelTemplatePayload;
import com.pcbxpress.erp.modules.engineering.panelization.model.PanelTemplate;
import com.pcbxpress.erp.modules.engineering.panelization.model.PanelStatus;
import com.pcbxpress.erp.modules.engineering.panelization.repository.PanelTemplateRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PanelTemplateService {
    
    private final PanelTemplateRepository panelTemplateRepository;
    
    public PanelTemplateService(PanelTemplateRepository panelTemplateRepository) {
        this.panelTemplateRepository = panelTemplateRepository;
    }
    
    public List<PanelTemplateDto> list(String query, String panelType, String panelizationStyle, UUID customerId, UUID jobId) {
        List<PanelTemplate> templates = panelTemplateRepository.findAll();
        
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            templates = templates.stream()
                .filter(t -> matchesQuery(t, q))
                .collect(Collectors.toList());
        }
        
        if (panelType != null && !panelType.trim().isEmpty()) {
            templates = templates.stream()
                .filter(t -> t.getPanelType() != null && t.getPanelType().toLowerCase().contains(panelType.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (panelizationStyle != null && !panelizationStyle.trim().isEmpty()) {
            templates = templates.stream()
                .filter(t -> t.getPanelizationStyle() != null && t.getPanelizationStyle().toLowerCase().contains(panelizationStyle.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (customerId != null) {
            templates = templates.stream()
                .filter(t -> t.getCustomerId().equals(customerId))
                .collect(Collectors.toList());
        }
        
        if (jobId != null) {
            templates = templates.stream()
                .filter(t -> t.getJobId().equals(jobId))
                .collect(Collectors.toList());
        }
        
        return templates.stream()
            .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
            .map(PanelTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public PanelTemplateDto getById(UUID id) {
        PanelTemplate template = panelTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Panel template not found: " + id));
        return PanelTemplateDto.fromEntity(template);
    }
    
    public PanelTemplateDto create(PanelTemplatePayload payload) {
        PanelTemplate template = new PanelTemplate();
        template.setId(UUID.randomUUID());
        template.setCreatedAt(OffsetDateTime.now());
        template.setUpdatedAt(OffsetDateTime.now());
        
        applyPayload(template, payload);
        
        // Set default status if not provided
        if (template.getStatus() == null) {
            template.setStatus(PanelStatus.DRAFT);
        }
        
        // Set default values
        if (!template.isActive()) {
            template.setActive(true);
        }
        
        if (template.isDefault() == false) {
            template.setDefault(false);
        }
        
        PanelTemplate saved = panelTemplateRepository.save(template);
        return PanelTemplateDto.fromEntity(saved);
    }
    
    public PanelTemplateDto update(UUID id, PanelTemplatePayload payload) {
        PanelTemplate existing = panelTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Panel template not found: " + id));
        
        applyPayload(existing, payload);
        existing.setUpdatedAt(OffsetDateTime.now());
        
        PanelTemplate saved = panelTemplateRepository.save(existing);
        return PanelTemplateDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        PanelTemplate template = panelTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Panel template not found: " + id));
        panelTemplateRepository.delete(template);
    }
    
    public void deleteBulk(List<UUID> ids) {
        List<PanelTemplate> templates = panelTemplateRepository.findAllById(ids);
        panelTemplateRepository.deleteAll(templates);
    }
    
    public PanelTemplateDto updateStatus(UUID id, PanelStatus status) {
        PanelTemplate template = panelTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Panel template not found: " + id));
        
        template.setStatus(status);
        template.setUpdatedAt(OffsetDateTime.now());
        
        PanelTemplate saved = panelTemplateRepository.save(template);
        return PanelTemplateDto.fromEntity(saved);
    }
    
    public List<PanelTemplateDto> getByJobId(UUID jobId) {
        return panelTemplateRepository.findByJobIdOrderByCreatedAtDesc(jobId).stream()
            .map(PanelTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<PanelTemplateDto> getByCustomerId(UUID customerId) {
        return panelTemplateRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .map(PanelTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<PanelTemplateDto> getActiveTemplates() {
        return panelTemplateRepository.findByIsActiveTrue().stream()
            .map(PanelTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<PanelTemplateDto> getDefaultTemplates() {
        return panelTemplateRepository.findByIsDefaultTrue().stream()
            .map(PanelTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public long countByJobId(UUID jobId) {
        return panelTemplateRepository.countByJobId(jobId);
    }
    
    public long countByCustomerId(UUID customerId) {
        return panelTemplateRepository.countByCustomerId(customerId);
    }
    
    public long countActive() {
        return panelTemplateRepository.countByIsActiveTrue();
    }
    
    private void applyPayload(PanelTemplate template, PanelTemplatePayload payload) {
        template.setName(payload.name());
        template.setJobId(payload.jobId());
        template.setJobNumber(payload.jobNumber());
        template.setCustomerId(payload.customerId());
        template.setCustomerName(payload.customerName());
        template.setPartNumber(payload.partNumber());
        template.setRevision(payload.revision());
        template.setDescription(payload.description());
        template.setPanelSizeX(payload.panelSizeX());
        template.setPanelSizeY(payload.panelSizeY());
        template.setPanelThickness(payload.panelThickness());
        template.setPanelMaterial(payload.panelMaterial());
        template.setPanelType(payload.panelType());
        template.setRoutingType(payload.routingType());
        template.setVScore(payload.vScore());
        template.setTabRout(payload.tabRout());
        template.setCastellatedHoles(payload.castellatedHoles());
        template.setEdgePlating(payload.edgePlating());
        template.setFiducials(payload.fiducials());
        template.setToolingHoles(payload.toolingHoles());
        template.setReferenceDesignators(payload.referenceDesignators());
        template.setComponentOutlines(payload.componentOutlines());
        template.setPanelizationStyle(payload.panelizationStyle());
        template.setArrayX(payload.arrayX());
        template.setArrayY(payload.arrayY());
        template.setBoardX(payload.boardX());
        template.setBoardY(payload.boardY());
        template.setSpacingX(payload.spacingX());
        template.setSpacingY(payload.spacingY());
        template.setRailWidthLeft(payload.railWidthLeft());
        template.setRailWidthRight(payload.railWidthRight());
        template.setRailWidthTop(payload.railWidthTop());
        template.setRailWidthBottom(payload.railWidthBottom());
        template.setRailToolingHoles(payload.railToolingHoles());
        template.setRailFiducials(payload.railFiducials());
        template.setRailText(payload.railText());
        template.setBreakawayCorners(payload.breakawayCorners());
        template.setCornerRadius(payload.cornerRadius());
        template.setMouseBites(payload.mouseBites());
        template.setVScoreWidth(payload.vScoreWidth());
        template.setVScoreAngle(payload.vScoreAngle());
        template.setTabWidth(payload.tabWidth());
        template.setTabLength(payload.tabLength());
        template.setTabSpacing(payload.tabSpacing());
        template.setCastellatedHoleSize(payload.castellatedHoleSize());
        template.setCastellatedHoleSpacing(payload.castellatedHoleSpacing());
        template.setEdgePlatingThickness(payload.edgePlatingThickness());
        template.setFiducialSize(payload.fiducialSize());
        template.setFiducialClearance(payload.fiducialClearance());
        template.setToolingHoleSize(payload.toolingHoleSize());
        template.setToolingHoleClearance(payload.toolingHoleClearance());
        template.setReferenceTextSize(payload.referenceTextSize());
        template.setReferenceTextClearance(payload.referenceTextClearance());
        template.setNotes(payload.notes());
        template.setStatus(payload.status());
        template.setCreatedBy(payload.createdBy());
        template.setCreatedByName(payload.createdByName());
        template.setApprovedBy(payload.approvedBy());
        template.setApprovedByName(payload.approvedByName());
        template.setVersion(payload.version());
        template.setActive(payload.isActive());
        template.setDefault(payload.isDefault());
    }
    
    private boolean matchesQuery(PanelTemplate template, String query) {
        return template.getName().toLowerCase().contains(query) ||
               (template.getDescription() != null && template.getDescription().toLowerCase().contains(query)) ||
               (template.getPanelType() != null && template.getPanelType().toLowerCase().contains(query)) ||
               (template.getPanelizationStyle() != null && template.getPanelizationStyle().toLowerCase().contains(query)) ||
               (template.getCustomerName() != null && template.getCustomerName().toLowerCase().contains(query));
    }
}