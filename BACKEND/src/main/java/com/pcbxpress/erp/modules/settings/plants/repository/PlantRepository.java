package com.pcbxpress.erp.modules.settings.plants.repository;

import com.pcbxpress.erp.modules.settings.plants.model.Plant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlantRepository extends JpaRepository<Plant, UUID> {
    
    /**
     * Find plant by plant code
     * @param plantCode the plant code
     * @return Optional of plant
     */
    Optional<Plant> findByPlantCode(String plantCode);
    
    /**
     * Find plant by plant name
     * @param plantName the plant name
     * @return Optional of plant
     */
    Optional<Plant> findByPlantName(String plantName);
    
    /**
     * Find plant by manager email
     * @param managerEmail the manager email
     * @return Optional of plant
     */
    Optional<Plant> findByManagerEmail(String managerEmail);
    
    /**
     * Find enabled plants
     * @return List of enabled plants
     */
    List<Plant> findByEnabledTrue();
    
    /**
     * Find plants by enabled status
     * @param enabled the enabled status
     * @return List of plants with the specified enabled status
     */
    List<Plant> findByEnabled(Boolean enabled);
    
    /**
     * Find plants by city
     * @param city the city
     * @return List of plants in the specified city
     */
    List<Plant> findByCity(String city);
    
    /**
     * Find plants by state
     * @param state the state
     * @return List of plants in the specified state
     */
    List<Plant> findByState(String state);
    
    /**
     * Find plants by country
     * @param country the country
     * @return List of plants in the specified country
     */
    List<Plant> findByCountry(String country);
    
    /**
     * Find plants by timezone
     * @param timezone the timezone
     * @return List of plants in the specified timezone
     */
    List<Plant> findByTimezone(String timezone);
    
    /**
     * Check if plant code already exists (excluding current plant)
     * @param plantCode the plant code to check
     * @param excludeId the plant ID to exclude from check
     * @return true if plant code exists
     */
    @Query("SELECT COUNT(p) > 0 FROM Plant p WHERE p.plantCode = :plantCode AND p.id != :excludeId")
    boolean existsByPlantCodeAndIdNot(@Param("plantCode") String plantCode, @Param("excludeId") UUID excludeId);
    
    /**
     * Check if plant name already exists (excluding current plant)
     * @param plantName the plant name to check
     * @param excludeId the plant ID to exclude from check
     * @return true if plant name exists
     */
    @Query("SELECT COUNT(p) > 0 FROM Plant p WHERE p.plantName = :plantName AND p.id != :excludeId")
    boolean existsByPlantNameAndIdNot(@Param("plantName") String plantName, @Param("excludeId") UUID excludeId);
    
    /**
     * Check if manager email already exists (excluding current plant)
     * @param managerEmail the manager email to check
     * @param excludeId the plant ID to exclude from check
     * @return true if manager email exists
     */
    @Query("SELECT COUNT(p) > 0 FROM Plant p WHERE p.managerEmail = :managerEmail AND p.id != :excludeId")
    boolean existsByManagerEmailAndIdNot(@Param("managerEmail") String managerEmail, @Param("excludeId") UUID excludeId);
}