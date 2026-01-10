package com.pcbxpress.erp.modules.settings.integrations.repository;

import com.pcbxpress.erp.modules.settings.integrations.model.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, UUID> {
    
    /**
     * Find integrations by type
     * @param integrationType the integration type
     * @return List of integrations of the specified type
     */
    List<Integration> findByIntegrationType(Integration.IntegrationType integrationType);
    
    /**
     * Find enabled integrations by type
     * @param integrationType the integration type
     * @return List of enabled integrations of the specified type
     */
    List<Integration> findByIntegrationTypeAndEnabledTrue(Integration.IntegrationType integrationType);
    
    /**
     * Find integration by name
     * @param name the integration name
     * @return Optional of integration
     */
    Optional<Integration> findByName(String name);
    
    /**
     * Find integration by type and name
     * @param integrationType the integration type
     * @param name the integration name
     * @return Optional of integration
     */
    Optional<Integration> findByIntegrationTypeAndName(Integration.IntegrationType integrationType, String name);
    
    /**
     * Find integrations by enabled status
     * @param enabled the enabled status
     * @return List of integrations with the specified enabled status
     */
    List<Integration> findByEnabled(Boolean enabled);
    
    /**
     * Find integrations with recent sync failures
     * @param status the sync status to filter by
     * @return List of integrations with the specified sync status
     */
    List<Integration> findByLastSyncStatus(Integration.SyncStatus status);
    
    /**
     * Find integrations that haven't synced recently
     * @param cutoffTime the cutoff time for last sync
     * @return List of integrations that haven't synced since the cutoff time
     */
    @Query("SELECT i FROM Integration i WHERE i.lastSyncAt < :cutoffTime OR i.lastSyncAt IS NULL")
    List<Integration> findIntegrationsNotSyncedSince(@Param("cutoffTime") java.time.LocalDateTime cutoffTime);
    
    /**
     * Check if integration name already exists (excluding current integration)
     * @param name the integration name to check
     * @param excludeId the integration ID to exclude from check
     * @return true if integration name exists
     */
    @Query("SELECT COUNT(i) > 0 FROM Integration i WHERE i.name = :name AND i.id != :excludeId")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") UUID excludeId);
}