package com.pcbxpress.erp.modules.settings.numbering.repository;

import com.pcbxpress.erp.modules.settings.numbering.model.NumberingSeries;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NumberingSeriesRepository extends JpaRepository<NumberingSeries, UUID> {
    
    /**
     * Find numbering series by name
     * @param seriesName the series name
     * @return Optional of numbering series
     */
    Optional<NumberingSeries> findBySeriesName(String seriesName);
    
    /**
     * Find enabled numbering series
     * @return List of enabled numbering series
     */
    List<NumberingSeries> findByEnabledTrue();
    
    /**
     * Find numbering series by enabled status
     * @param enabled the enabled status
     * @return List of numbering series with the specified enabled status
     */
    List<NumberingSeries> findByEnabled(Boolean enabled);
    
    /**
     * Find numbering series by reset frequency
     * @param resetFrequency the reset frequency
     * @return List of numbering series with the specified reset frequency
     */
    List<NumberingSeries> findByResetFrequency(NumberingSeries.ResetFrequency resetFrequency);
    
    /**
     * Find numbering series by prefix
     * @param prefix the prefix
     * @return List of numbering series with the specified prefix
     */
    List<NumberingSeries> findByPrefix(String prefix);
    
    /**
     * Find numbering series by suffix
     * @param suffix the suffix
     * @return List of numbering series with the specified suffix
     */
    List<NumberingSeries> findBySuffix(String suffix);
    
    /**
     * Check if series name already exists (excluding current series)
     * @param seriesName the series name to check
     * @param excludeId the series ID to exclude from check
     * @return true if series name exists
     */
    @Query("SELECT COUNT(ns) > 0 FROM NumberingSeries ns WHERE ns.seriesName = :seriesName AND ns.id != :excludeId")
    boolean existsBySeriesNameAndIdNot(@Param("seriesName") String seriesName, @Param("excludeId") UUID excludeId);
    
    /**
     * Find numbering series that need reset based on frequency
     * @param resetFrequency the reset frequency
     * @return List of numbering series that need reset
     */
    @Query("SELECT ns FROM NumberingSeries ns WHERE ns.resetFrequency = :resetFrequency AND ns.enabled = true")
    List<NumberingSeries> findSeriesNeedingReset(@Param("resetFrequency") NumberingSeries.ResetFrequency resetFrequency);
}