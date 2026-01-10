package com.pcbxpress.erp.modules.maintenance.equipment.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.pcbxpress.erp.modules.maintenance.equipment.dto.EquipmentDto;
import com.pcbxpress.erp.modules.maintenance.equipment.dto.EquipmentPayload;
import com.pcbxpress.erp.modules.maintenance.equipment.model.Equipment;
import com.pcbxpress.erp.modules.maintenance.equipment.repository.EquipmentRepository;

/**
 * Service implementation for Equipment management
 */
@Service
public class EquipmentService {
    
    @Autowired
    private EquipmentRepository equipmentRepository;
    
    /**
     * Get all equipment with pagination
     */
    public List<EquipmentDto> getAllEquipment(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Equipment> equipmentPage = equipmentRepository.findAll(pageable);
        return equipmentPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get equipment by ID
     */
    public EquipmentDto getEquipmentById(UUID id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found with id: " + id));
        return convertToDto(equipment);
    }
    
    /**
     * Create new equipment
     */
    public EquipmentDto createEquipment(EquipmentPayload payload) {
        Equipment equipment = convertToEntity(payload);
        equipment.setCreatedAt(LocalDateTime.now());
        equipment.setUpdatedAt(LocalDateTime.now());
        Equipment savedEquipment = equipmentRepository.save(equipment);
        return convertToDto(savedEquipment);
    }
    
    /**
     * Update equipment
     */
    public EquipmentDto updateEquipment(UUID id, EquipmentPayload payload) {
        Equipment existingEquipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found with id: " + id));
        
        // Update fields
        existingEquipment.setEquipmentName(payload.getEquipmentName());
        existingEquipment.setDescription(payload.getDescription());
        existingEquipment.setEquipmentType(payload.getEquipmentType());
        existingEquipment.setManufacturer(payload.getManufacturer());
        existingEquipment.setModel(payload.getModel());
        existingEquipment.setSerialNumber(payload.getSerialNumber());
        existingEquipment.setLocation(payload.getLocation());
        existingEquipment.setStatus(payload.getStatus());
        existingEquipment.setInstallationDate(payload.getInstallationDate());
        existingEquipment.setLastMaintenanceDate(payload.getLastMaintenanceDate());
        existingEquipment.setNextMaintenanceDate(payload.getNextMaintenanceDate());
        existingEquipment.setTotalOperatingHours(payload.getTotalOperatingHours());
        existingEquipment.setLastOperatingHours(payload.getLastOperatingHours());
        existingEquipment.setResponsiblePerson(payload.getResponsiblePerson());
        existingEquipment.setDepartment(payload.getDepartment());
        existingEquipment.setCostCenter(payload.getCostCenter());
        existingEquipment.setPurchasePrice(payload.getPurchasePrice());
        existingEquipment.setPurchaseDate(payload.getPurchaseDate());
        existingEquipment.setWarrantyExpiryDate(payload.getWarrantyExpiryDate());
        existingEquipment.setCriticality(payload.getCriticality());
        existingEquipment.setCategory(payload.getCategory());
        existingEquipment.setSubCategory(payload.getSubCategory());
        existingEquipment.setSupplier(payload.getSupplier());
        existingEquipment.setAssetTag(payload.getAssetTag());
        existingEquipment.setBarcode(payload.getBarcode());
        existingEquipment.setSpecifications(payload.getSpecifications());
        existingEquipment.setTechnicalDocs(payload.getTechnicalDocs());
        existingEquipment.setPhotos(payload.getPhotos());
        existingEquipment.setNotes(payload.getNotes());
        existingEquipment.setUpdatedAt(LocalDateTime.now());
        
        Equipment updatedEquipment = equipmentRepository.save(existingEquipment);
        return convertToDto(updatedEquipment);
    }
    
    /**
     * Delete equipment
     */
    public void deleteEquipment(UUID id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found with id: " + id));
        equipmentRepository.delete(equipment);
    }
    
    /**
     * Get equipment history
     */
    public List<EquipmentDto> getEquipmentHistory(UUID id, int page, int size) {
        // This would typically involve querying a history table or audit log
        // For now, returning current equipment details
        return List.of(getEquipmentById(id));
    }
    
    /**
     * Get maintenance schedule for equipment
     */
    public List<EquipmentDto> getMaintenanceSchedule(UUID id, int page, int size) {
        // This would typically involve querying preventive maintenance records
        // For now, returning current equipment details
        return List.of(getEquipmentById(id));
    }
    
    /**
     * Update equipment status
     */
    public EquipmentDto updateEquipmentStatus(UUID id, String status) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found with id: " + id));
        equipment.setStatus(status);
        equipment.setUpdatedAt(LocalDateTime.now());
        Equipment updatedEquipment = equipmentRepository.save(equipment);
        return convertToDto(updatedEquipment);
    }
    
    /**
     * Get equipment report
     */
    public List<EquipmentDto> getEquipmentReport() {
        List<Equipment> equipmentList = equipmentRepository.findAll();
        return equipmentList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Find equipment by equipment code
     */
    public EquipmentDto getEquipmentByCode(String equipmentCode) {
        Equipment equipment = equipmentRepository.findByEquipmentCode(equipmentCode);
        if (equipment == null) {
            throw new RuntimeException("Equipment not found with code: " + equipmentCode);
        }
        return convertToDto(equipment);
    }
    
    /**
     * Find equipment by serial number
     */
    public EquipmentDto getEquipmentBySerialNumber(String serialNumber) {
        Equipment equipment = equipmentRepository.findBySerialNumber(serialNumber);
        if (equipment == null) {
            throw new RuntimeException("Equipment not found with serial number: " + serialNumber);
        }
        return convertToDto(equipment);
    }
    
    /**
     * Find equipment by asset tag
     */
    public EquipmentDto getEquipmentByAssetTag(String assetTag) {
        Equipment equipment = equipmentRepository.findByAssetTag(assetTag);
        if (equipment == null) {
            throw new RuntimeException("Equipment not found with asset tag: " + assetTag);
        }
        return convertToDto(equipment);
    }
    
    /**
     * Find equipment by barcode
     */
    public EquipmentDto getEquipmentByBarcode(String barcode) {
        Equipment equipment = equipmentRepository.findByBarcode(barcode);
        if (equipment == null) {
            throw new RuntimeException("Equipment not found with barcode: " + barcode);
        }
        return convertToDto(equipment);
    }
    
    /**
     * Find equipment by manufacturer
     */
    public List<EquipmentDto> getEquipmentByManufacturer(String manufacturer) {
        List<Equipment> equipmentList = equipmentRepository.findByManufacturer(manufacturer);
        return equipmentList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Find equipment by model
     */
    public List<EquipmentDto> getEquipmentByModel(String model) {
        List<Equipment> equipmentList = equipmentRepository.findByModel(model);
        return equipmentList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Find equipment by location
     */
    public List<EquipmentDto> getEquipmentByLocation(String location) {
        List<Equipment> equipmentList = equipmentRepository.findByLocation(location);
        return equipmentList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Find equipment by status
     */
    public List<EquipmentDto> getEquipmentByStatus(String status) {
        List<Equipment> equipmentList = equipmentRepository.findByStatus(status);
        return equipmentList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Find equipment by equipment type
     */
    public List<EquipmentDto> getEquipmentByType(String equipmentType) {
        List<Equipment> equipmentList = equipmentRepository.findByEquipmentType(equipmentType);
        return equipmentList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert Equipment entity to EquipmentDto
     */
    private EquipmentDto convertToDto(Equipment equipment) {
        EquipmentDto dto = new EquipmentDto();
        dto.setId(equipment.getId());
        dto.setEquipmentCode(equipment.getEquipmentCode());
        dto.setEquipmentName(equipment.getEquipmentName());
        dto.setDescription(equipment.getDescription());
        dto.setEquipmentType(equipment.getEquipmentType());
        dto.setManufacturer(equipment.getManufacturer());
        dto.setModel(equipment.getModel());
        dto.setSerialNumber(equipment.getSerialNumber());
        dto.setLocation(equipment.getLocation());
        dto.setStatus(equipment.getStatus());
        dto.setInstallationDate(equipment.getInstallationDate());
        dto.setLastMaintenanceDate(equipment.getLastMaintenanceDate());
        dto.setNextMaintenanceDate(equipment.getNextMaintenanceDate());
        dto.setTotalOperatingHours(equipment.getTotalOperatingHours());
        dto.setLastOperatingHours(equipment.getLastOperatingHours());
        dto.setResponsiblePerson(equipment.getResponsiblePerson());
        dto.setDepartment(equipment.getDepartment());
        dto.setCostCenter(equipment.getCostCenter());
        dto.setPurchasePrice(equipment.getPurchasePrice());
        dto.setPurchaseDate(equipment.getPurchaseDate());
        dto.setWarrantyExpiryDate(equipment.getWarrantyExpiryDate());
        dto.setCriticality(equipment.getCriticality());
        dto.setCategory(equipment.getCategory());
        dto.setSubCategory(equipment.getSubCategory());
        dto.setSupplier(equipment.getSupplier());
        dto.setAssetTag(equipment.getAssetTag());
        dto.setBarcode(equipment.getBarcode());
        dto.setSpecifications(equipment.getSpecifications());
        dto.setTechnicalDocs(equipment.getTechnicalDocs());
        dto.setPhotos(equipment.getPhotos());
        dto.setNotes(equipment.getNotes());
        dto.setCreatedAt(equipment.getCreatedAt());
        dto.setUpdatedAt(equipment.getUpdatedAt());
        return dto;
    }
    
    /**
     * Convert EquipmentPayload to Equipment entity
     */
    private Equipment convertToEntity(EquipmentPayload payload) {
        Equipment equipment = new Equipment();
        equipment.setEquipmentCode(generateEquipmentCode());
        equipment.setEquipmentName(payload.getEquipmentName());
        equipment.setDescription(payload.getDescription());
        equipment.setEquipmentType(payload.getEquipmentType());
        equipment.setManufacturer(payload.getManufacturer());
        equipment.setModel(payload.getModel());
        equipment.setSerialNumber(payload.getSerialNumber());
        equipment.setLocation(payload.getLocation());
        equipment.setStatus(payload.getStatus());
        equipment.setInstallationDate(payload.getInstallationDate());
        equipment.setLastMaintenanceDate(payload.getLastMaintenanceDate());
        equipment.setNextMaintenanceDate(payload.getNextMaintenanceDate());
        equipment.setTotalOperatingHours(payload.getTotalOperatingHours());
        equipment.setLastOperatingHours(payload.getLastOperatingHours());
        equipment.setResponsiblePerson(payload.getResponsiblePerson());
        equipment.setDepartment(payload.getDepartment());
        equipment.setCostCenter(payload.getCostCenter());
        equipment.setPurchasePrice(payload.getPurchasePrice());
        equipment.setPurchaseDate(payload.getPurchaseDate());
        equipment.setWarrantyExpiryDate(payload.getWarrantyExpiryDate());
        equipment.setCriticality(payload.getCriticality());
        equipment.setCategory(payload.getCategory());
        equipment.setSubCategory(payload.getSubCategory());
        equipment.setSupplier(payload.getSupplier());
        equipment.setAssetTag(payload.getAssetTag());
        equipment.setBarcode(payload.getBarcode());
        equipment.setSpecifications(payload.getSpecifications());
        equipment.setTechnicalDocs(payload.getTechnicalDocs());
        equipment.setPhotos(payload.getPhotos());
        equipment.setNotes(payload.getNotes());
        return equipment;
    }
    
    /**
     * Generate equipment code
     */
    private String generateEquipmentCode() {
        // Simple implementation - in production, you might want a more sophisticated approach
        return "EQP-" + System.currentTimeMillis();
    }
}