package com.pcbxpress.erp.modules.settings.plants.controller;

import com.pcbxpress.erp.modules.settings.plants.dto.PlantDto;
import com.pcbxpress.erp.modules.settings.plants.dto.PlantPayload;
import com.pcbxpress.erp.modules.settings.plants.service.PlantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings/plants")
public class PlantController {
    
    private final PlantService plantService;
    
    @Autowired
    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }
    
    /**
     * Get all plants
     * @return List of all plant DTOs
     */
    @GetMapping
    public ResponseEntity<List<PlantDto>> getAllPlants() {
        List<PlantDto> plants = plantService.getAllPlants();
        return ResponseEntity.ok(plants);
    }
    
    /**
     * Get enabled plants
     * @return List of enabled plant DTOs
     */
    @GetMapping("/enabled")
    public ResponseEntity<List<PlantDto>> getEnabledPlants() {
        List<PlantDto> plants = plantService.getEnabledPlants();
        return ResponseEntity.ok(plants);
    }
    
    /**
     * Get plants by enabled status
     * @param enabled the enabled status
     * @return List of plant DTOs with the specified enabled status
     */
    @GetMapping("/enabled/{enabled}")
    public ResponseEntity<List<PlantDto>> getPlantsByEnabled(@PathVariable Boolean enabled) {
        List<PlantDto> plants = plantService.getPlantsByEnabled(enabled);
        return ResponseEntity.ok(plants);
    }
    
    /**
     * Get plants by city
     * @param city the city
     * @return List of plant DTOs in the specified city
     */
    @GetMapping("/city/{city}")
    public ResponseEntity<List<PlantDto>> getPlantsByCity(@PathVariable String city) {
        List<PlantDto> plants = plantService.getPlantsByCity(city);
        return ResponseEntity.ok(plants);
    }
    
    /**
     * Get plants by state
     * @param state the state
     * @return List of plant DTOs in the specified state
     */
    @GetMapping("/state/{state}")
    public ResponseEntity<List<PlantDto>> getPlantsByState(@PathVariable String state) {
        List<PlantDto> plants = plantService.getPlantsByState(state);
        return ResponseEntity.ok(plants);
    }
    
    /**
     * Get plants by country
     * @param country the country
     * @return List of plant DTOs in the specified country
     */
    @GetMapping("/country/{country}")
    public ResponseEntity<List<PlantDto>> getPlantsByCountry(@PathVariable String country) {
        List<PlantDto> plants = plantService.getPlantsByCountry(country);
        return ResponseEntity.ok(plants);
    }
    
    /**
     * Get plants by timezone
     * @param timezone the timezone
     * @return List of plant DTOs in the specified timezone
     */
    @GetMapping("/timezone/{timezone}")
    public ResponseEntity<List<PlantDto>> getPlantsByTimezone(@PathVariable String timezone) {
        List<PlantDto> plants = plantService.getPlantsByTimezone(timezone);
        return ResponseEntity.ok(plants);
    }
    
    /**
     * Get plant by ID
     * @param id the plant ID
     * @return Plant DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<PlantDto> getPlantById(@PathVariable UUID id) {
        return plantService.getPlantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get plant by plant code
     * @param code the plant code
     * @return Plant DTO
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<PlantDto> getPlantByPlantCode(@PathVariable String code) {
        return plantService.getPlantByPlantCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get plant by plant name
     * @param name the plant name
     * @return Plant DTO
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<PlantDto> getPlantByPlantName(@PathVariable String name) {
        return plantService.getPlantByPlantName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get plant by manager email
     * @param email the manager email
     * @return Plant DTO
     */
    @GetMapping("/manager-email/{email}")
    public ResponseEntity<PlantDto> getPlantByManagerEmail(@PathVariable String email) {
        return plantService.getPlantByManagerEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new plant
     * @param payload the plant payload
     * @return Created plant DTO
     */
    @PostMapping
    public ResponseEntity<PlantDto> createPlant(@RequestBody PlantPayload payload) {
        PlantDto createdPlant = plantService.createPlant(payload);
        return ResponseEntity.ok(createdPlant);
    }
    
    /**
     * Update plant
     * @param id the plant ID
     * @param payload the plant payload
     * @return Updated plant DTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<PlantDto> updatePlant(@PathVariable UUID id, @RequestBody PlantPayload payload) {
        PlantDto updatedPlant = plantService.updatePlant(id, payload);
        return ResponseEntity.ok(updatedPlant);
    }
    
    /**
     * Delete plant
     * @param id the plant ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlant(@PathVariable UUID id) {
        plantService.deletePlant(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Enable/disable plant
     * @param id the plant ID
     * @param enabled the enabled status
     * @return No content response
     */
    @PutMapping("/{id}/enabled/{enabled}")
    public ResponseEntity<Void> setPlantEnabled(@PathVariable UUID id, @PathVariable Boolean enabled) {
        plantService.setPlantEnabled(id, enabled);
        return ResponseEntity.noContent().build();
    }
}