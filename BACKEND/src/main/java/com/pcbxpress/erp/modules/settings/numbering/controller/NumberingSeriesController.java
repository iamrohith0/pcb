package com.pcbxpress.erp.modules.settings.numbering.controller;

import com.pcbxpress.erp.modules.settings.numbering.dto.NumberingSeriesDto;
import com.pcbxpress.erp.modules.settings.numbering.dto.NumberingSeriesPayload;
import com.pcbxpress.erp.modules.settings.numbering.model.NumberingSeries;
import com.pcbxpress.erp.modules.settings.numbering.service.NumberingSeriesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings/numbering")
public class NumberingSeriesController {
    
    private final NumberingSeriesService numberingSeriesService;
    
    @Autowired
    public NumberingSeriesController(NumberingSeriesService numberingSeriesService) {
        this.numberingSeriesService = numberingSeriesService;
    }
    
    /**
     * Get all numbering series
     * @return List of all numbering series DTOs
     */
    @GetMapping
    public ResponseEntity<List<NumberingSeriesDto>> getAllNumberingSeries() {
        List<NumberingSeriesDto> numberingSeries = numberingSeriesService.getAllNumberingSeries();
        return ResponseEntity.ok(numberingSeries);
    }
    
    /**
     * Get enabled numbering series
     * @return List of enabled numbering series DTOs
     */
    @GetMapping("/enabled")
    public ResponseEntity<List<NumberingSeriesDto>> getEnabledNumberingSeries() {
        List<NumberingSeriesDto> numberingSeries = numberingSeriesService.getEnabledNumberingSeries();
        return ResponseEntity.ok(numberingSeries);
    }
    
    /**
     * Get numbering series by enabled status
     * @param enabled the enabled status
     * @return List of numbering series DTOs with the specified enabled status
     */
    @GetMapping("/enabled/{enabled}")
    public ResponseEntity<List<NumberingSeriesDto>> getNumberingSeriesByEnabled(@PathVariable Boolean enabled) {
        List<NumberingSeriesDto> numberingSeries = numberingSeriesService.getNumberingSeriesByEnabled(enabled);
        return ResponseEntity.ok(numberingSeries);
    }
    
    /**
     * Get numbering series by reset frequency
     * @param frequency the reset frequency
     * @return List of numbering series DTOs with the specified reset frequency
     */
    @GetMapping("/reset-frequency/{frequency}")
    public ResponseEntity<List<NumberingSeriesDto>> getNumberingSeriesByResetFrequency(@PathVariable NumberingSeries.ResetFrequency frequency) {
        List<NumberingSeriesDto> numberingSeries = numberingSeriesService.getNumberingSeriesByResetFrequency(frequency);
        return ResponseEntity.ok(numberingSeries);
    }
    
    /**
     * Get numbering series by prefix
     * @param prefix the prefix
     * @return List of numbering series DTOs with the specified prefix
     */
    @GetMapping("/prefix/{prefix}")
    public ResponseEntity<List<NumberingSeriesDto>> getNumberingSeriesByPrefix(@PathVariable String prefix) {
        List<NumberingSeriesDto> numberingSeries = numberingSeriesService.getNumberingSeriesByPrefix(prefix);
        return ResponseEntity.ok(numberingSeries);
    }
    
    /**
     * Get numbering series by suffix
     * @param suffix the suffix
     * @return List of numbering series DTOs with the specified suffix
     */
    @GetMapping("/suffix/{suffix}")
    public ResponseEntity<List<NumberingSeriesDto>> getNumberingSeriesBySuffix(@PathVariable String suffix) {
        List<NumberingSeriesDto> numberingSeries = numberingSeriesService.getNumberingSeriesBySuffix(suffix);
        return ResponseEntity.ok(numberingSeries);
    }
    
    /**
     * Get numbering series by ID
     * @param id the numbering series ID
     * @return Numbering series DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<NumberingSeriesDto> getNumberingSeriesById(@PathVariable UUID id) {
        return numberingSeriesService.getNumberingSeriesById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get numbering series by name
     * @param name the series name
     * @return Numbering series DTO
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<NumberingSeriesDto> getNumberingSeriesByName(@PathVariable String name) {
        return numberingSeriesService.getNumberingSeriesByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new numbering series
     * @param payload the numbering series payload
     * @return Created numbering series DTO
     */
    @PostMapping
    public ResponseEntity<NumberingSeriesDto> createNumberingSeries(@RequestBody NumberingSeriesPayload payload) {
        NumberingSeriesDto createdNumberingSeries = numberingSeriesService.createNumberingSeries(payload);
        return ResponseEntity.ok(createdNumberingSeries);
    }
    
    /**
     * Update numbering series
     * @param id the numbering series ID
     * @param payload the numbering series payload
     * @return Updated numbering series DTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<NumberingSeriesDto> updateNumberingSeries(@PathVariable UUID id, @RequestBody NumberingSeriesPayload payload) {
        NumberingSeriesDto updatedNumberingSeries = numberingSeriesService.updateNumberingSeries(id, payload);
        return ResponseEntity.ok(updatedNumberingSeries);
    }
    
    /**
     * Delete numbering series
     * @param id the numbering series ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNumberingSeries(@PathVariable UUID id) {
        numberingSeriesService.deleteNumberingSeries(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Enable/disable numbering series
     * @param id the numbering series ID
     * @param enabled the enabled status
     * @return No content response
     */
    @PutMapping("/{id}/enabled/{enabled}")
    public ResponseEntity<Void> setNumberingSeriesEnabled(@PathVariable UUID id, @PathVariable Boolean enabled) {
        numberingSeriesService.setNumberingSeriesEnabled(id, enabled);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Generate next number for a numbering series
     * @param id the numbering series ID
     * @return the next number in the sequence
     */
    @GetMapping("/{id}/next-number")
    public ResponseEntity<String> generateNextNumber(@PathVariable UUID id) {
        String nextNumber = numberingSeriesService.generateNextNumber(id);
        return ResponseEntity.ok(nextNumber);
    }
    
    /**
     * Reset numbering series current number
     * @param id the numbering series ID
     * @return No content response
     */
    @PutMapping("/{id}/reset")
    public ResponseEntity<Void> resetNumberingSeries(@PathVariable UUID id) {
        numberingSeriesService.resetNumberingSeries(id);
        return ResponseEntity.noContent().build();
    }
}