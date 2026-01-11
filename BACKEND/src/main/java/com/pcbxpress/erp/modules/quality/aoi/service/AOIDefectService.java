package com.pcbxpress.erp.modules.quality.aoi.service;

import com.pcbxpress.erp.modules.quality.aoi.dto.AOIDefectDto;
import com.pcbxpress.erp.modules.quality.aoi.dto.AOIDefectPayload;
import com.pcbxpress.erp.modules.quality.aoi.model.AOIDefect;
import com.pcbxpress.erp.modules.quality.aoi.repository.AOIDefectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AOIDefectService {
    
    @Autowired
    private AOIDefectRepository defectRepository;
    
    public Page<AOIDefectDto> findAllDefects(String search, Boolean status, Pageable pageable) {
        Page<AOIDefect> defects = defectRepository.findBySearchAndStatus(
            search != null ? search.toLowerCase() : null,
            status,
            pageable
        );
        
        return defects.map(AOIDefectDto::new);
    }
    
    public List<AOIDefectDto> findAllActiveDefects() {
        List<AOIDefect> defects = defectRepository.findAllActive();
        return defects.stream().map(AOIDefectDto::new).collect(Collectors.toList());
    }
    
    public Optional<AOIDefectDto> findDefectById(Long id) {
        return defectRepository.findById(id).map(AOIDefectDto::new);
    }
    
    public Optional<AOIDefectDto> findDefectByCode(String code) {
        return defectRepository.findByCode(code).map(AOIDefectDto::new);
    }
    
    @Transactional
    public AOIDefectDto createDefect(AOIDefectPayload payload) {
        if (defectRepository.existsByCode(payload.getCode())) {
            throw new RuntimeException("Defect code already exists: " + payload.getCode());
        }
        
        AOIDefect defect = new AOIDefect();
        updateDefectFromPayload(defect, payload);
        
        AOIDefect saved = defectRepository.save(defect);
        return new AOIDefectDto(saved);
    }
    
    @Transactional
    public AOIDefectDto updateDefect(Long id, AOIDefectPayload payload) {
        AOIDefect defect = defectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Defect not found with id: " + id));
        
        // Check if code is being changed and if new code already exists
        if (!defect.getCode().equals(payload.getCode()) && defectRepository.existsByCode(payload.getCode())) {
            throw new RuntimeException("Defect code already exists: " + payload.getCode());
        }
        
        updateDefectFromPayload(defect, payload);
        
        AOIDefect saved = defectRepository.save(defect);
        return new AOIDefectDto(saved);
    }
    
    @Transactional
    public void deleteDefect(Long id) {
        if (!defectRepository.existsById(id)) {
            throw new RuntimeException("Defect not found with id: " + id);
        }
        defectRepository.deleteById(id);
    }
    
    private void updateDefectFromPayload(AOIDefect defect, AOIDefectPayload payload) {
        defect.setCode(payload.getCode());
        defect.setName(payload.getName());
        defect.setCategory(payload.getCategory());
        
        if (payload.getSeverity() != null) {
            defect.setSeverity(AOIDefect.Severity.valueOf(payload.getSeverity().toUpperCase()));
        }
        
        if (payload.getSide() != null) {
            defect.setSide(AOIDefect.Side.valueOf(payload.getSide().toUpperCase()));
        }
        
        defect.setIsActive(payload.getIsActive());
        defect.setDescription(payload.getDescription());
    }
}