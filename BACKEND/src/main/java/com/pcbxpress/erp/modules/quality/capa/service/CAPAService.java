package com.pcbxpress.erp.modules.quality.capa.service;

import com.pcbxpress.erp.modules.quality.capa.dto.CAPADto;
import com.pcbxpress.erp.modules.quality.capa.dto.CAPAPayload;
import com.pcbxpress.erp.modules.quality.capa.model.CAPA;
import com.pcbxpress.erp.modules.quality.capa.repository.CAPARepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CAPAService {
    
    @Autowired
    private CAPARepository capaRepository;
    
    public Page<CAPADto> findAllCAPAs(String search, String status, String severity, String sourceType, 
                                     String owner, String from, String to, Pageable pageable) {
        CAPA.Status statusEnum = null;
        CAPA.Severity severityEnum = null;
        CAPA.SourceType sourceTypeEnum = null;
        
        if (status != null) {
            statusEnum = CAPA.Status.valueOf(status.toUpperCase());
        }
        if (severity != null) {
            severityEnum = CAPA.Severity.valueOf(severity.toUpperCase());
        }
        if (sourceType != null) {
            sourceTypeEnum = CAPA.SourceType.valueOf(sourceType.toUpperCase());
        }
        
        LocalDateTime fromDate = null;
        LocalDateTime toDate = null;
        
        if (from != null && !from.trim().isEmpty()) {
            fromDate = LocalDateTime.parse(from + "T00:00:00");
        }
        if (to != null && !to.trim().isEmpty()) {
            toDate = LocalDateTime.parse(to + "T23:59:59");
        }
        
        Page<CAPA> capas = capaRepository.findByFilters(
            search != null ? search.toLowerCase() : null,
            statusEnum,
            severityEnum,
            sourceTypeEnum,
            owner != null ? owner.toLowerCase() : null,
            fromDate,
            toDate,
            pageable
        );
        
        return capas.map(CAPADto::new);
    }
    
    public Optional<CAPADto> findCAPAById(Long id) {
        return capaRepository.findById(id).map(CAPADto::new);
    }
    
    public Optional<CAPADto> findCAPAByCapaNo(String capaNo) {
        return capaRepository.findByCapaNo(capaNo).map(CAPADto::new);
    }
    
    @Transactional
    public CAPADto createCAPA(CAPAPayload payload, String createdBy) {
        if (capaRepository.existsByCapaNo(payload.getCapaNo())) {
            throw new RuntimeException("CAPA number already exists: " + payload.getCapaNo());
        }
        
        CAPA capa = new CAPA();
        updateCAPAFromPayload(capa, payload);
        capa.setCreatedBy(createdBy);
        
        CAPA saved = capaRepository.save(capa);
        return new CAPADto(saved);
    }
    
    @Transactional
    public CAPADto updateCAPA(Long id, CAPAPayload payload) {
        CAPA capa = capaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAPA not found with id: " + id));
        
        // Check if capaNo is being changed and if new capaNo already exists
        if (!capa.getCapaNo().equals(payload.getCapaNo()) && capaRepository.existsByCapaNo(payload.getCapaNo())) {
            throw new RuntimeException("CAPA number already exists: " + payload.getCapaNo());
        }
        
        updateCAPAFromPayload(capa, payload);
        
        CAPA saved = capaRepository.save(capa);
        return new CAPADto(saved);
    }
    
    @Transactional
    public void deleteCAPA(Long id) {
        if (!capaRepository.existsById(id)) {
            throw new RuntimeException("CAPA not found with id: " + id);
        }
        capaRepository.deleteById(id);
    }
    
    @Transactional
    public CAPADto updateStatus(Long id, String status) {
        CAPA capa = capaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAPA not found with id: " + id));
        
        capa.setStatus(CAPA.Status.valueOf(status.toUpperCase()));
        
        CAPA saved = capaRepository.save(capa);
        return new CAPADto(saved);
    }
    
    public List<CAPADto> findOverdueCAPAs() {
        LocalDateTime now = LocalDateTime.now();
        List<CAPA.Status> excludedStatuses = List.of(CAPA.Status.CLOSED, CAPA.Status.REJECTED);
        
        List<CAPA> overdue = capaRepository.findOverdueCAPAs(now, excludedStatuses);
        return overdue.stream().map(CAPADto::new).collect(Collectors.toList());
    }
    
    private void updateCAPAFromPayload(CAPA capa, CAPAPayload payload) {
        capa.setCapaNo(payload.getCapaNo());
        capa.setSourceType(payload.getSourceType() != null ? CAPA.SourceType.valueOf(payload.getSourceType().toUpperCase()) : null);
        capa.setReferenceNo(payload.getReferenceNo());
        capa.setSeverity(payload.getSeverity() != null ? CAPA.Severity.valueOf(payload.getSeverity().toUpperCase()) : null);
        capa.setStatus(payload.getStatus() != null ? CAPA.Status.valueOf(payload.getStatus().toUpperCase()) : null);
        capa.setTitle(payload.getTitle());
        capa.setProblemStatement(payload.getProblemStatement());
        capa.setAffectedProcess(payload.getAffectedProcess());
        capa.setPartNo(payload.getPartNo());
        capa.setJobNo(payload.getJobNo());
        capa.setLotNo(payload.getLotNo());
        capa.setContainmentAction(payload.getContainmentAction());
        capa.setRootCauseMethod(payload.getRootCauseMethod() != null ? CAPA.RootCauseMethod.valueOf(payload.getRootCauseMethod().toUpperCase()) : null);
        capa.setRootCause(payload.getRootCause());
        capa.setCorrectiveAction(payload.getCorrectiveAction());
        capa.setPreventiveAction(payload.getPreventiveAction());
        capa.setOwnerName(payload.getOwnerName());
        capa.setOwnerDepartment(payload.getOwnerDepartment());
        
        if (payload.getDueDate() != null && !payload.getDueDate().trim().isEmpty()) {
            capa.setDueDate(LocalDateTime.parse(payload.getDueDate() + "T00:00:00"));
        }
        
        capa.setEffectivenessCriteria(payload.getEffectivenessCriteria());
        capa.setNotes(payload.getNotes());
    }
}