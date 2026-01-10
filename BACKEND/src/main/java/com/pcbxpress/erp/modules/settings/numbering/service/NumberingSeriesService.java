package com.pcbxpress.erp.modules.settings.numbering.service;

import com.pcbxpress.erp.modules.settings.numbering.dto.NumberingSeriesDto;
import com.pcbxpress.erp.modules.settings.numbering.dto.NumberingSeriesPayload;
import com.pcbxpress.erp.modules.settings.numbering.model.NumberingSeries;
import com.pcbxpress.erp.modules.settings.numbering.repository.NumberingSeriesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NumberingSeriesService {
    
    private final NumberingSeriesRepository numberingSeriesRepository;
    
    @Autowired
    public NumberingSeriesService(NumberingSeriesRepository numberingSeriesRepository) {
        this.numberingSeriesRepository = numberingSeriesRepository;
    }
    
    /**
     * Get all numbering series
     * @return List of all numbering series DTOs
     */
    @Transactional(readOnly = true)
    public List<NumberingSeriesDto> getAllNumberingSeries() {
        return numberingSeriesRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get enabled numbering series
     * @return List of enabled numbering series DTOs
     */
    @Transactional(readOnly = true)
    public List<NumberingSeriesDto> getEnabledNumberingSeries() {
        return numberingSeriesRepository.findByEnabledTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get numbering series by enabled status
     * @param enabled the enabled status
     * @return List of numbering series DTOs with the specified enabled status
     */
    @Transactional(readOnly = true)
    public List<NumberingSeriesDto> getNumberingSeriesByEnabled(Boolean enabled) {
        return numberingSeriesRepository.findByEnabled(enabled).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get numbering series by reset frequency
     * @param resetFrequency the reset frequency
     * @return List of numbering series DTOs with the specified reset frequency
     */
    @Transactional(readOnly = true)
    public List<NumberingSeriesDto> getNumberingSeriesByResetFrequency(NumberingSeries.ResetFrequency resetFrequency) {
        return numberingSeriesRepository.findByResetFrequency(resetFrequency).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get numbering series by prefix
     * @param prefix the prefix
     * @return List of numbering series DTOs with the specified prefix
     */
    @Transactional(readOnly = true)
    public List<NumberingSeriesDto> getNumberingSeriesByPrefix(String prefix) {
        return numberingSeriesRepository.findByPrefix(prefix).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get numbering series by suffix
     * @param suffix the suffix
     * @return List of numbering series DTOs with the specified suffix
     */
    @Transactional(readOnly = true)
    public List<NumberingSeriesDto> getNumberingSeriesBySuffix(String suffix) {
        return numberingSeriesRepository.findBySuffix(suffix).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get numbering series by ID
     * @param id the numbering series ID
     * @return Optional of numbering series DTO
     */
    @Transactional(readOnly = true)
    public Optional<NumberingSeriesDto> getNumberingSeriesById(UUID id) {
        return numberingSeriesRepository.findById(id)
                .map(this::convertToDto);
    }
    
    /**
     * Get numbering series by name
     * @param seriesName the series name
     * @return Optional of numbering series DTO
     */
    @Transactional(readOnly = true)
    public Optional<NumberingSeriesDto> getNumberingSeriesByName(String seriesName) {
        return numberingSeriesRepository.findBySeriesName(seriesName)
                .map(this::convertToDto);
    }
    
    /**
     * Create new numbering series
     * @param payload the numbering series payload
     * @return Created numbering series DTO
     */
    @Transactional
    public NumberingSeriesDto createNumberingSeries(NumberingSeriesPayload payload) {
        validateNumberingSeriesPayload(payload, null);
        
        NumberingSeries numberingSeries = new NumberingSeries(payload.getSeriesName());
        updateNumberingSeriesFromPayload(numberingSeries, payload);
        
        NumberingSeries savedNumberingSeries = numberingSeriesRepository.save(numberingSeries);
        return convertToDto(savedNumberingSeries);
    }
    
    /**
     * Update numbering series
     * @param id the numbering series ID
     * @param payload the numbering series payload
     * @return Updated numbering series DTO
     */
    @Transactional
    public NumberingSeriesDto updateNumberingSeries(UUID id, NumberingSeriesPayload payload) {
        NumberingSeries existingNumberingSeries = numberingSeriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Numbering series not found with id: " + id));
        
        validateNumberingSeriesPayload(payload, id);
        updateNumberingSeriesFromPayload(existingNumberingSeries, payload);
        
        NumberingSeries updatedNumberingSeries = numberingSeriesRepository.save(existingNumberingSeries);
        return convertToDto(updatedNumberingSeries);
    }
    
    /**
     * Delete numbering series
     * @param id the numbering series ID
     */
    @Transactional
    public void deleteNumberingSeries(UUID id) {
        if (!numberingSeriesRepository.existsById(id)) {
            throw new RuntimeException("Numbering series not found with id: " + id);
        }
        numberingSeriesRepository.deleteById(id);
    }
    
    /**
     * Enable/disable numbering series
     * @param id the numbering series ID
     * @param enabled the enabled status
     */
    @Transactional
    public void setNumberingSeriesEnabled(UUID id, Boolean enabled) {
        NumberingSeries numberingSeries = numberingSeriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Numbering series not found with id: " + id));
        numberingSeries.setEnabled(enabled);
        numberingSeriesRepository.save(numberingSeries);
    }
    
    /**
     * Generate next number for a numbering series
     * @param id the numbering series ID
     * @return the next number in the sequence
     */
    @Transactional
    public String generateNextNumber(UUID id) {
        NumberingSeries numberingSeries = numberingSeriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Numbering series not found with id: " + id));
        
        if (!numberingSeries.getEnabled()) {
            throw new RuntimeException("Numbering series is not enabled");
        }
        
        String nextNumber = numberingSeries.generateNextNumber();
        numberingSeriesRepository.save(numberingSeries);
        return nextNumber;
    }
    
    /**
     * Reset numbering series current number
     * @param id the numbering series ID
     */
    @Transactional
    public void resetNumberingSeries(UUID id) {
        NumberingSeries numberingSeries = numberingSeriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Numbering series not found with id: " + id));
        
        numberingSeries.resetCurrentNumber();
        numberingSeriesRepository.save(numberingSeries);
    }
    
    /**
     * Validate numbering series payload
     * @param payload the numbering series payload
     * @param excludeId the numbering series ID to exclude from validation
     */
    private void validateNumberingSeriesPayload(NumberingSeriesPayload payload, UUID excludeId) {
        if (payload.getSeriesName() != null && 
            numberingSeriesRepository.existsBySeriesNameAndIdNot(payload.getSeriesName(), excludeId)) {
            throw new RuntimeException("Numbering series name already exists");
        }
    }
    
    /**
     * Update numbering series entity from payload
     * @param numberingSeries the numbering series entity
     * @param payload the numbering series payload
     */
    private void updateNumberingSeriesFromPayload(NumberingSeries numberingSeries, NumberingSeriesPayload payload) {
        if (payload.getSeriesName() != null) {
            numberingSeries.setSeriesName(payload.getSeriesName());
        }
        if (payload.getDescription() != null) {
            numberingSeries.setDescription(payload.getDescription());
        }
        if (payload.getPrefix() != null) {
            numberingSeries.setPrefix(payload.getPrefix());
        }
        if (payload.getSuffix() != null) {
            numberingSeries.setSuffix(payload.getSuffix());
        }
        if (payload.getStartNumber() != null) {
            numberingSeries.setStartNumber(payload.getStartNumber());
        }
        if (payload.getIncrementBy() != null) {
            numberingSeries.setIncrementBy(payload.getIncrementBy());
        }
        if (payload.getResetFrequency() != null) {
            numberingSeries.setResetFrequency(payload.getResetFrequency());
        }
        if (payload.getEnabled() != null) {
            numberingSeries.setEnabled(payload.getEnabled());
        }
        if (payload.getFormatPattern() != null) {
            numberingSeries.setFormatPattern(payload.getFormatPattern());
        }
        if (payload.getLength() != null) {
            numberingSeries.setLength(payload.getLength());
        }
    }
    
    /**
     * Convert numbering series entity to DTO
     * @param numberingSeries the numbering series entity
     * @return Numbering series DTO
     */
    private NumberingSeriesDto convertToDto(NumberingSeries numberingSeries) {
        return new NumberingSeriesDto(
            numberingSeries.getId(),
            numberingSeries.getSeriesName(),
            numberingSeries.getDescription(),
            numberingSeries.getPrefix(),
            numberingSeries.getSuffix(),
            numberingSeries.getStartNumber(),
            numberingSeries.getCurrentNumber(),
            numberingSeries.getIncrementBy(),
            numberingSeries.getResetFrequency(),
            numberingSeries.getEnabled(),
            numberingSeries.getFormatPattern(),
            numberingSeries.getLength(),
            numberingSeries.getCreatedAt(),
            numberingSeries.getUpdatedAt()
        );
    }
}