package com.pcbxpress.erp.modules.engineering.cam.service;

import com.pcbxpress.erp.modules.engineering.cam.dto.CamOutputDto;
import com.pcbxpress.erp.modules.engineering.cam.model.CamOutput;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputStatus;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputType;
import com.pcbxpress.erp.modules.engineering.cam.repository.CamOutputRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CamOutputService {
    
    private final CamOutputRepository camOutputRepository;
    
    public CamOutputService(CamOutputRepository camOutputRepository) {
        this.camOutputRepository = camOutputRepository;
    }
    
    public List<CamOutputDto> getByCamJobId(UUID camJobId) {
        return camOutputRepository.findByCamJobIdOrderByCreatedAtDesc(camJobId).stream()
            .map(CamOutputDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<CamOutputDto> getByCamJobIdAndType(UUID camJobId, OutputType outputType) {
        return camOutputRepository.findByCamJobIdAndOutputTypeOrderByCreatedAtDesc(camJobId, outputType).stream()
            .map(CamOutputDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<CamOutputDto> getByCamJobIdAndStatus(UUID camJobId, OutputStatus status) {
        return camOutputRepository.findByCamJobIdAndStatusOrderByCreatedAtDesc(camJobId, status).stream()
            .map(CamOutputDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<CamOutputDto> getByCreatedBy(UUID createdBy) {
        return camOutputRepository.findByCreatedByOrderByCreatedAtDesc(createdBy).stream()
            .map(CamOutputDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public CamOutputDto getById(UUID id) {
        CamOutput output = camOutputRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM output not found: " + id));
        return CamOutputDto.fromEntity(output);
    }
    
    public CamOutputDto create(CamOutput output) {
        output.setId(UUID.randomUUID());
        output.setCreatedAt(OffsetDateTime.now());
        output.setUpdatedAt(OffsetDateTime.now());
        
        // Set version
        if (output.getVersion() == null) {
            Integer maxVersion = camOutputRepository.findMaxVersionByCamJobIdAndOutputType(
                output.getCamJobId(), output.getOutputType());
            output.setVersion(maxVersion != null ? maxVersion + 1 : 1);
        }
        
        CamOutput saved = camOutputRepository.save(output);
        return CamOutputDto.fromEntity(saved);
    }
    
    public CamOutputDto update(UUID id, CamOutput output) {
        CamOutput existing = camOutputRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM output not found: " + id));
        
        existing.setFileName(output.getFileName());
        existing.setFilePath(output.getFilePath());
        existing.setFileSize(output.getFileSize());
        existing.setFileFormat(output.getFileFormat());
        existing.setLayers(output.getLayers());
        existing.setResolution(output.getResolution());
        existing.setUnits(output.getUnits());
        existing.setScale(output.getScale());
        existing.setMirrored(output.isMirrored());
        existing.setPositive(output.isPositive());
        existing.setApertureFormat(output.getApertureFormat());
        existing.setCoordinateFormat(output.getCoordinateFormat());
        existing.setZeroSuppression(output.getZeroSuppression());
        existing.setLeadingZero(output.isLeadingZero());
        existing.setTrailingZero(output.isTrailingZero());
        existing.setDecimalPlaces(output.getDecimalPlaces());
        existing.setIntegerPlaces(output.getIntegerPlaces());
        existing.setCreatedBy(output.getCreatedBy());
        existing.setCreatedByName(output.getCreatedByName());
        existing.setStatus(output.getStatus());
        existing.setGeneratedAt(output.getGeneratedAt());
        existing.setDownloadCount(output.getDownloadCount());
        existing.setLastDownloadedAt(output.getLastDownloadedAt());
        existing.setChecksum(output.getChecksum());
        existing.setVersion(output.getVersion());
        existing.setNotes(output.getNotes());
        
        existing.setUpdatedAt(OffsetDateTime.now());
        
        CamOutput saved = camOutputRepository.save(existing);
        return CamOutputDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        CamOutput output = camOutputRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM output not found: " + id));
        camOutputRepository.delete(output);
    }
    
    public void deleteByCamJobId(UUID camJobId) {
        List<CamOutput> outputs = camOutputRepository.findByCamJobIdOrderByCreatedAtDesc(camJobId);
        camOutputRepository.deleteAll(outputs);
    }
    
    public void updateStatus(UUID id, OutputStatus status) {
        CamOutput output = camOutputRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM output not found: " + id));
        
        output.setStatus(status);
        output.setUpdatedAt(OffsetDateTime.now());
        
        camOutputRepository.save(output);
    }
    
    public void incrementDownloadCount(UUID id) {
        CamOutput output = camOutputRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("CAM output not found: " + id));
        
        output.setDownloadCount(output.getDownloadCount() != null ? output.getDownloadCount() + 1 : 1);
        output.setLastDownloadedAt(OffsetDateTime.now());
        output.setUpdatedAt(OffsetDateTime.now());
        
        camOutputRepository.save(output);
    }
    
    public List<CamOutputDto> getByOutputType(OutputType outputType) {
        return camOutputRepository.findByOutputType(outputType).stream()
            .map(CamOutputDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<CamOutputDto> getByStatus(OutputStatus status) {
        return camOutputRepository.findByStatus(status).stream()
            .map(CamOutputDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public long countByCamJobId(UUID camJobId) {
        return camOutputRepository.countByCamJobId(camJobId);
    }
    
    public long countByOutputType(OutputType outputType) {
        return camOutputRepository.countByOutputType(outputType);
    }
    
    public long countByStatus(OutputStatus status) {
        return camOutputRepository.countByStatus(status);
    }
}