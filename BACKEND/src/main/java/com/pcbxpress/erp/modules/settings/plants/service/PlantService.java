package com.pcbxpress.erp.modules.settings.plants.service;

import com.pcbxpress.erp.modules.settings.plants.dto.PlantDto;
import com.pcbxpress.erp.modules.settings.plants.dto.PlantPayload;
import com.pcbxpress.erp.modules.settings.plants.model.Plant;
import com.pcbxpress.erp.modules.settings.plants.repository.PlantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlantService {
    
    private final PlantRepository plantRepository;
    
    @Autowired
    public PlantService(PlantRepository plantRepository) {
        this.plantRepository = plantRepository;
    }
    
    /**
     * Get all plants
     * @return List of all plant DTOs
     */
    @Transactional(readOnly = true)
    public List<PlantDto> getAllPlants() {
        return plantRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get enabled plants
     * @return List of enabled plant DTOs
     */
    @Transactional(readOnly = true)
    public List<PlantDto> getEnabledPlants() {
        return plantRepository.findByEnabledTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get plants by enabled status
     * @param enabled the enabled status
     * @return List of plant DTOs with the specified enabled status
     */
    @Transactional(readOnly = true)
    public List<PlantDto> getPlantsByEnabled(Boolean enabled) {
        return plantRepository.findByEnabled(enabled).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get plants by city
     * @param city the city
     * @return List of plant DTOs in the specified city
     */
    @Transactional(readOnly = true)
    public List<PlantDto> getPlantsByCity(String city) {
        return plantRepository.findByCity(city).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get plants by state
     * @param state the state
     * @return List of plant DTOs in the specified state
     */
    @Transactional(readOnly = true)
    public List<PlantDto> getPlantsByState(String state) {
        return plantRepository.findByState(state).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get plants by country
     * @param country the country
     * @return List of plant DTOs in the specified country
     */
    @Transactional(readOnly = true)
    public List<PlantDto> getPlantsByCountry(String country) {
        return plantRepository.findByCountry(country).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get plants by timezone
     * @param timezone the timezone
     * @return List of plant DTOs in the specified timezone
     */
    @Transactional(readOnly = true)
    public List<PlantDto> getPlantsByTimezone(String timezone) {
        return plantRepository.findByTimezone(timezone).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get plant by ID
     * @param id the plant ID
     * @return Optional of plant DTO
     */
    @Transactional(readOnly = true)
    public Optional<PlantDto> getPlantById(UUID id) {
        return plantRepository.findById(id)
                .map(this::convertToDto);
    }
    
    /**
     * Get plant by plant code
     * @param plantCode the plant code
     * @return Optional of plant DTO
     */
    @Transactional(readOnly = true)
    public Optional<PlantDto> getPlantByPlantCode(String plantCode) {
        return plantRepository.findByPlantCode(plantCode)
                .map(this::convertToDto);
    }
    
    /**
     * Get plant by plant name
     * @param plantName the plant name
     * @return Optional of plant DTO
     */
    @Transactional(readOnly = true)
    public Optional<PlantDto> getPlantByPlantName(String plantName) {
        return plantRepository.findByPlantName(plantName)
                .map(this::convertToDto);
    }
    
    /**
     * Get plant by manager email
     * @param managerEmail the manager email
     * @return Optional of plant DTO
     */
    @Transactional(readOnly = true)
    public Optional<PlantDto> getPlantByManagerEmail(String managerEmail) {
        return plantRepository.findByManagerEmail(managerEmail)
                .map(this::convertToDto);
    }
    
    /**
     * Create new plant
     * @param payload the plant payload
     * @return Created plant DTO
     */
    @Transactional
    public PlantDto createPlant(PlantPayload payload) {
        validatePlantPayload(payload, null);
        
        Plant plant = new Plant(payload.getPlantCode(), payload.getPlantName());
        updatePlantFromPayload(plant, payload);
        
        Plant savedPlant = plantRepository.save(plant);
        return convertToDto(savedPlant);
    }
    
    /**
     * Update plant
     * @param id the plant ID
     * @param payload the plant payload
     * @return Updated plant DTO
     */
    @Transactional
    public PlantDto updatePlant(UUID id, PlantPayload payload) {
        Plant existingPlant = plantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plant not found with id: " + id));
        
        validatePlantPayload(payload, id);
        updatePlantFromPayload(existingPlant, payload);
        
        Plant updatedPlant = plantRepository.save(existingPlant);
        return convertToDto(updatedPlant);
    }
    
    /**
     * Delete plant
     * @param id the plant ID
     */
    @Transactional
    public void deletePlant(UUID id) {
        if (!plantRepository.existsById(id)) {
            throw new RuntimeException("Plant not found with id: " + id);
        }
        plantRepository.deleteById(id);
    }
    
    /**
     * Enable/disable plant
     * @param id the plant ID
     * @param enabled the enabled status
     */
    @Transactional
    public void setPlantEnabled(UUID id, Boolean enabled) {
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plant not found with id: " + id));
        plant.setEnabled(enabled);
        plantRepository.save(plant);
    }
    
    /**
     * Validate plant payload
     * @param payload the plant payload
     * @param excludeId the plant ID to exclude from validation
     */
    private void validatePlantPayload(PlantPayload payload, UUID excludeId) {
        if (payload.getPlantCode() != null && 
            plantRepository.existsByPlantCodeAndIdNot(payload.getPlantCode(), excludeId)) {
            throw new RuntimeException("Plant code already exists");
        }
        
        if (payload.getPlantName() != null && 
            plantRepository.existsByPlantNameAndIdNot(payload.getPlantName(), excludeId)) {
            throw new RuntimeException("Plant name already exists");
        }
        
        if (payload.getManagerEmail() != null && 
            plantRepository.existsByManagerEmailAndIdNot(payload.getManagerEmail(), excludeId)) {
            throw new RuntimeException("Manager email already exists");
        }
    }
    
    /**
     * Update plant entity from payload
     * @param plant the plant entity
     * @param payload the plant payload
     */
    private void updatePlantFromPayload(Plant plant, PlantPayload payload) {
        if (payload.getPlantCode() != null) {
            plant.setPlantCode(payload.getPlantCode());
        }
        if (payload.getPlantName() != null) {
            plant.setPlantName(payload.getPlantName());
        }
        if (payload.getDescription() != null) {
            plant.setDescription(payload.getDescription());
        }
        if (payload.getAddressLine1() != null) {
            plant.setAddressLine1(payload.getAddressLine1());
        }
        if (payload.getAddressLine2() != null) {
            plant.setAddressLine2(payload.getAddressLine2());
        }
        if (payload.getCity() != null) {
            plant.setCity(payload.getCity());
        }
        if (payload.getState() != null) {
            plant.setState(payload.getState());
        }
        if (payload.getCountry() != null) {
            plant.setCountry(payload.getCountry());
        }
        if (payload.getPostalCode() != null) {
            plant.setPostalCode(payload.getPostalCode());
        }
        if (payload.getPhone() != null) {
            plant.setPhone(payload.getPhone());
        }
        if (payload.getEmail() != null) {
            plant.setEmail(payload.getEmail());
        }
        if (payload.getManagerName() != null) {
            plant.setManagerName(payload.getManagerName());
        }
        if (payload.getManagerEmail() != null) {
            plant.setManagerEmail(payload.getManagerEmail());
        }
        if (payload.getManagerPhone() != null) {
            plant.setManagerPhone(payload.getManagerPhone());
        }
        if (payload.getWorkingHoursStart() != null) {
            plant.setWorkingHoursStart(payload.getWorkingHoursStart());
        }
        if (payload.getWorkingHoursEnd() != null) {
            plant.setWorkingHoursEnd(payload.getWorkingHoursEnd());
        }
        if (payload.getTimezone() != null) {
            plant.setTimezone(payload.getTimezone());
        }
        if (payload.getEnabled() != null) {
            plant.setEnabled(payload.getEnabled());
        }
    }
    
    /**
     * Convert plant entity to DTO
     * @param plant the plant entity
     * @return Plant DTO
     */
    private PlantDto convertToDto(Plant plant) {
        return new PlantDto(
            plant.getId(),
            plant.getPlantCode(),
            plant.getPlantName(),
            plant.getDescription(),
            plant.getAddressLine1(),
            plant.getAddressLine2(),
            plant.getCity(),
            plant.getState(),
            plant.getCountry(),
            plant.getPostalCode(),
            plant.getPhone(),
            plant.getEmail(),
            plant.getManagerName(),
            plant.getManagerEmail(),
            plant.getManagerPhone(),
            plant.getWorkingHoursStart(),
            plant.getWorkingHoursEnd(),
            plant.getTimezone(),
            plant.getEnabled(),
            plant.getCreatedAt(),
            plant.getUpdatedAt()
        );
    }
}