package com.pcbxpress.erp.modules.maintenance.spares.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.pcbxpress.erp.modules.maintenance.spares.dto.SparesDto;
import com.pcbxpress.erp.modules.maintenance.spares.dto.SparesPayload;
import com.pcbxpress.erp.modules.maintenance.spares.model.Spares;
import com.pcbxpress.erp.modules.maintenance.spares.repository.SparesRepository;

/**
 * Service implementation for Spares management
 */
@Service
public class SparesService {
    
    @Autowired
    private SparesRepository sparesRepository;
    
    /**
     * Get all spares with pagination
     */
    public List<SparesDto> getAllSpares(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Spares> sparesPage = sparesRepository.findAll(pageable);
        return sparesPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by ID
     */
    public SparesDto getSparesById(UUID id) {
        Spares spares = sparesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spares not found with id: " + id));
        return convertToDto(spares);
    }
    
    /**
     * Create new spares record
     */
    public SparesDto createSpares(SparesPayload payload) {
        Spares spares = convertToEntity(payload);
        Spares savedSpares = sparesRepository.save(spares);
        return convertToDto(savedSpares);
    }
    
    /**
     * Update spares record
     */
    public SparesDto updateSpares(UUID id, SparesPayload payload) {
        Spares existingSpares = sparesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spares not found with id: " + id));
        
        // Update fields
        existingSpares.setSpareName(payload.getSpareName());
        existingSpares.setDescription(payload.getDescription());
        existingSpares.setCategory(payload.getCategory());
        existingSpares.setSubCategory(payload.getSubCategory());
        existingSpares.setPartNumber(payload.getPartNumber());
        existingSpares.setManufacturer(payload.getManufacturer());
        existingSpares.setModel(payload.getModel());
        existingSpares.setSupplier(payload.getSupplier());
        existingSpares.setUnitOfMeasure(payload.getUnitOfMeasure());
        existingSpares.setUnitPrice(payload.getUnitPrice());
        existingSpares.setCurrentStock(payload.getCurrentStock());
        existingSpares.setMinimumStock(payload.getMinimumStock());
        existingSpares.setMaximumStock(payload.getMaximumStock());
        existingSpares.setLocation(payload.getLocation());
        existingSpares.setBinLocation(payload.getBinLocation());
        existingSpares.setStatus(payload.getStatus());
        existingSpares.setCriticality(payload.getCriticality());
        existingSpares.setCompatibility(payload.getCompatibility());
        existingSpares.setSpecifications(payload.getSpecifications());
        existingSpares.setTechnicalDocs(payload.getTechnicalDocs());
        existingSpares.setPhotos(payload.getPhotos());
        existingSpares.setNotes(payload.getNotes());
        
        Spares updatedSpares = sparesRepository.save(existingSpares);
        return convertToDto(updatedSpares);
    }
    
    /**
     * Delete spares record
     */
    public void deleteSpares(UUID id) {
        Spares spares = sparesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spares not found with id: " + id));
        sparesRepository.delete(spares);
    }
    
    /**
     * Get equipment spares
     */
    public List<SparesDto> getEquipmentSpares(UUID equipmentId, int page, int size) {
        // This would typically involve querying a relationship table
        // For now, returning all spares
        return getAllSpares(page, size);
    }
    
    /**
     * Get stock levels
     */
    public List<SparesDto> getStockLevels(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Spares> sparesPage = sparesRepository.findAll(pageable);
        return sparesPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Update stock
     */
    public SparesDto updateStock(UUID id, Integer stockChange) {
        Spares spares = sparesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spares not found with id: " + id));
        
        Integer newStock = spares.getCurrentStock() + stockChange;
        if (newStock < 0) {
            throw new RuntimeException("Cannot reduce stock below zero");
        }
        
        spares.setCurrentStock(newStock);
        Spares updatedSpares = sparesRepository.save(spares);
        return convertToDto(updatedSpares);
    }
    
    /**
     * Get usage report
     */
    public List<SparesDto> getUsageReport() {
        List<Spares> sparesList = sparesRepository.findAll();
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by spare code
     */
    public SparesDto getSparesByCode(String spareCode) {
        Spares spares = sparesRepository.findBySpareCode(spareCode);
        if (spares == null) {
            throw new RuntimeException("Spares not found with code: " + spareCode);
        }
        return convertToDto(spares);
    }
    
    /**
     * Get spares by spare name
     */
    public List<SparesDto> getSparesByName(String spareName) {
        List<Spares> sparesList = sparesRepository.findBySpareName(spareName);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by category
     */
    public List<SparesDto> getSparesByCategory(String category) {
        List<Spares> sparesList = sparesRepository.findByCategory(category);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by sub category
     */
    public List<SparesDto> getSparesBySubCategory(String subCategory) {
        List<Spares> sparesList = sparesRepository.findBySubCategory(subCategory);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by part number
     */
    public List<SparesDto> getSparesByPartNumber(String partNumber) {
        List<Spares> sparesList = sparesRepository.findByPartNumber(partNumber);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by manufacturer
     */
    public List<SparesDto> getSparesByManufacturer(String manufacturer) {
        List<Spares> sparesList = sparesRepository.findByManufacturer(manufacturer);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by model
     */
    public List<SparesDto> getSparesByModel(String model) {
        List<Spares> sparesList = sparesRepository.findByModel(model);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by supplier
     */
    public List<SparesDto> getSparesBySupplier(String supplier) {
        List<Spares> sparesList = sparesRepository.findBySupplier(supplier);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by location
     */
    public List<SparesDto> getSparesByLocation(String location) {
        List<Spares> sparesList = sparesRepository.findByLocation(location);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by status
     */
    public List<SparesDto> getSparesByStatus(String status) {
        List<Spares> sparesList = sparesRepository.findByStatus(status);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by criticality
     */
    public List<SparesDto> getSparesByCriticality(String criticality) {
        List<Spares> sparesList = sparesRepository.findByCriticality(criticality);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get low stock alert
     */
    public List<SparesDto> getLowStockAlert() {
        List<Spares> sparesList = sparesRepository.findByCurrentStockLessThan(0);
        return sparesList.stream()
                .filter(s -> s.getCurrentStock() < s.getMinimumStock())
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get overstock alert
     */
    public List<SparesDto> getOverstockAlert() {
        List<Spares> sparesList = sparesRepository.findByCurrentStockGreaterThan(0);
        return sparesList.stream()
                .filter(s -> s.getCurrentStock() > s.getMaximumStock())
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get spares by price range
     */
    public List<SparesDto> getSparesByPriceRange(Double minPrice, Double maxPrice) {
        List<Spares> sparesList = sparesRepository.findByUnitPriceBetween(minPrice, maxPrice);
        return sparesList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert Spares entity to SparesDto
     */
    private SparesDto convertToDto(Spares spares) {
        SparesDto dto = new SparesDto();
        dto.setId(spares.getId());
        dto.setSpareCode(spares.getSpareCode());
        dto.setSpareName(spares.getSpareName());
        dto.setDescription(spares.getDescription());
        dto.setCategory(spares.getCategory());
        dto.setSubCategory(spares.getSubCategory());
        dto.setPartNumber(spares.getPartNumber());
        dto.setManufacturer(spares.getManufacturer());
        dto.setModel(spares.getModel());
        dto.setSupplier(spares.getSupplier());
        dto.setUnitOfMeasure(spares.getUnitOfMeasure());
        dto.setUnitPrice(spares.getUnitPrice());
        dto.setCurrentStock(spares.getCurrentStock());
        dto.setMinimumStock(spares.getMinimumStock());
        dto.setMaximumStock(spares.getMaximumStock());
        dto.setLocation(spares.getLocation());
        dto.setBinLocation(spares.getBinLocation());
        dto.setStatus(spares.getStatus());
        dto.setCriticality(spares.getCriticality());
        dto.setCompatibility(spares.getCompatibility());
        dto.setSpecifications(spares.getSpecifications());
        dto.setTechnicalDocs(spares.getTechnicalDocs());
        dto.setPhotos(spares.getPhotos());
        dto.setNotes(spares.getNotes());
        dto.setCreatedBy(spares.getCreatedBy());
        dto.setUpdatedBy(spares.getUpdatedBy());
        dto.setCreatedAt(spares.getCreatedAt());
        dto.setUpdatedAt(spares.getUpdatedAt());
        return dto;
    }
    
    /**
     * Convert SparesPayload to Spares entity
     */
    private Spares convertToEntity(SparesPayload payload) {
        Spares spares = new Spares();
        spares.setSpareCode(generateSpareCode());
        spares.setSpareName(payload.getSpareName());
        spares.setDescription(payload.getDescription());
        spares.setCategory(payload.getCategory());
        spares.setSubCategory(payload.getSubCategory());
        spares.setPartNumber(payload.getPartNumber());
        spares.setManufacturer(payload.getManufacturer());
        spares.setModel(payload.getModel());
        spares.setSupplier(payload.getSupplier());
        spares.setUnitOfMeasure(payload.getUnitOfMeasure());
        spares.setUnitPrice(payload.getUnitPrice());
        spares.setCurrentStock(payload.getCurrentStock());
        spares.setMinimumStock(payload.getMinimumStock());
        spares.setMaximumStock(payload.getMaximumStock());
        spares.setLocation(payload.getLocation());
        spares.setBinLocation(payload.getBinLocation());
        spares.setStatus(payload.getStatus());
        spares.setCriticality(payload.getCriticality());
        spares.setCompatibility(payload.getCompatibility());
        spares.setSpecifications(payload.getSpecifications());
        spares.setTechnicalDocs(payload.getTechnicalDocs());
        spares.setPhotos(payload.getPhotos());
        spares.setNotes(payload.getNotes());
        return spares;
    }
    
    /**
     * Generate spare code
     */
    private String generateSpareCode() {
        // Simple implementation - in production, you might want a more sophisticated approach
        return "SPR-" + System.currentTimeMillis();
    }
}