package com.pcbxpress.erp.modules.maintenance.equipment.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pcbxpress.erp.modules.maintenance.equipment.dto.EquipmentDto;
import com.pcbxpress.erp.modules.maintenance.equipment.dto.EquipmentPayload;
import com.pcbxpress.erp.modules.maintenance.equipment.service.EquipmentService;

/**
 * REST Controller for Equipment management
 */
@RestController
@RequestMapping("/api/maintenance/equipment")
@CrossOrigin(origins = "*")
public class EquipmentController {
    
    @Autowired
    private EquipmentService equipmentService;
    
    /**
     * Get all equipment with pagination
     */
    @GetMapping
    public ResponseEntity<List<EquipmentDto>> getAllEquipment(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<EquipmentDto> equipmentList = equipmentService.getAllEquipment(page, size);
        return ResponseEntity.ok(equipmentList);
    }
    
    /**
     * Get equipment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<EquipmentDto> getEquipmentById(@PathVariable UUID id) {
        EquipmentDto equipment = equipmentService.getEquipmentById(id);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Create new equipment
     */
    @PostMapping
    public ResponseEntity<EquipmentDto> createEquipment(@RequestBody EquipmentPayload payload) {
        EquipmentDto equipment = equipmentService.createEquipment(payload);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Update equipment
     */
    @PutMapping("/{id}")
    public ResponseEntity<EquipmentDto> updateEquipment(@PathVariable UUID id, @RequestBody EquipmentPayload payload) {
        EquipmentDto equipment = equipmentService.updateEquipment(id, payload);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Delete equipment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable UUID id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get equipment history
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<EquipmentDto>> getEquipmentHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<EquipmentDto> history = equipmentService.getEquipmentHistory(id, page, size);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Get maintenance schedule for equipment
     */
    @GetMapping("/{id}/maintenance-schedule")
    public ResponseEntity<List<EquipmentDto>> getMaintenanceSchedule(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<EquipmentDto> schedule = equipmentService.getMaintenanceSchedule(id, page, size);
        return ResponseEntity.ok(schedule);
    }
    
    /**
     * Update equipment status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<EquipmentDto> updateEquipmentStatus(@PathVariable UUID id, @RequestBody String status) {
        EquipmentDto equipment = equipmentService.updateEquipmentStatus(id, status);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Get equipment report
     */
    @GetMapping("/report")
    public ResponseEntity<List<EquipmentDto>> getEquipmentReport() {
        List<EquipmentDto> report = equipmentService.getEquipmentReport();
        return ResponseEntity.ok(report);
    }
    
    /**
     * Get equipment by equipment code
     */
    @GetMapping("/code/{equipmentCode}")
    public ResponseEntity<EquipmentDto> getEquipmentByCode(@PathVariable String equipmentCode) {
        EquipmentDto equipment = equipmentService.getEquipmentByCode(equipmentCode);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Get equipment by serial number
     */
    @GetMapping("/serial/{serialNumber}")
    public ResponseEntity<EquipmentDto> getEquipmentBySerialNumber(@PathVariable String serialNumber) {
        EquipmentDto equipment = equipmentService.getEquipmentBySerialNumber(serialNumber);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Get equipment by asset tag
     */
    @GetMapping("/asset/{assetTag}")
    public ResponseEntity<EquipmentDto> getEquipmentByAssetTag(@PathVariable String assetTag) {
        EquipmentDto equipment = equipmentService.getEquipmentByAssetTag(assetTag);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Get equipment by barcode
     */
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<EquipmentDto> getEquipmentByBarcode(@PathVariable String barcode) {
        EquipmentDto equipment = equipmentService.getEquipmentByBarcode(barcode);
        return ResponseEntity.ok(equipment);
    }
    
    /**
     * Get equipment by manufacturer
     */
    @GetMapping("/manufacturer/{manufacturer}")
    public ResponseEntity<List<EquipmentDto>> getEquipmentByManufacturer(@PathVariable String manufacturer) {
        List<EquipmentDto> equipmentList = equipmentService.getEquipmentByManufacturer(manufacturer);
        return ResponseEntity.ok(equipmentList);
    }
    
    /**
     * Get equipment by model
     */
    @GetMapping("/model/{model}")
    public ResponseEntity<List<EquipmentDto>> getEquipmentByModel(@PathVariable String model) {
        List<EquipmentDto> equipmentList = equipmentService.getEquipmentByModel(model);
        return ResponseEntity.ok(equipmentList);
    }
    
    /**
     * Get equipment by location
     */
    @GetMapping("/location/{location}")
    public ResponseEntity<List<EquipmentDto>> getEquipmentByLocation(@PathVariable String location) {
        List<EquipmentDto> equipmentList = equipmentService.getEquipmentByLocation(location);
        return ResponseEntity.ok(equipmentList);
    }
    
    /**
     * Get equipment by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EquipmentDto>> getEquipmentByStatus(@PathVariable String status) {
        List<EquipmentDto> equipmentList = equipmentService.getEquipmentByStatus(status);
        return ResponseEntity.ok(equipmentList);
    }
    
    /**
     * Get equipment by equipment type
     */
    @GetMapping("/type/{equipmentType}")
    public ResponseEntity<List<EquipmentDto>> getEquipmentByType(@PathVariable String equipmentType) {
        List<EquipmentDto> equipmentList = equipmentService.getEquipmentByType(equipmentType);
        return ResponseEntity.ok(equipmentList);
    }
}