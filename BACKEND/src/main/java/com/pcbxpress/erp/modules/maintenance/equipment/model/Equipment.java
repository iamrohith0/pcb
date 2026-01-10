package com.pcbxpress.erp.modules.maintenance.equipment.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Equipment entity representing manufacturing equipment and machinery
 */
@Entity
@Table(name = "equipment")
public class Equipment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String equipmentCode;
    
    @Column(nullable = false)
    private String equipmentName;
    
    @Column
    private String description;
    
    @Column
    private String equipmentType;
    
    @Column
    private String manufacturer;
    
    @Column
    private String model;
    
    @Column
    private String serialNumber;
    
    @Column
    private String location;
    
    @Column
    private String status; // ACTIVE, INACTIVE, MAINTENANCE, RETIRED
    
    @Column
    private LocalDateTime installationDate;
    
    @Column
    private LocalDateTime lastMaintenanceDate;
    
    @Column
    private LocalDateTime nextMaintenanceDate;
    
    @Column
    private Long totalOperatingHours;
    
    @Column
    private Long lastOperatingHours;
    
    @Column
    private String responsiblePerson;
    
    @Column
    private String department;
    
    @Column
    private String costCenter;
    
    @Column
    private Double purchasePrice;
    
    @Column
    private LocalDateTime purchaseDate;
    
    @Column
    private String warrantyExpiryDate;
    
    @Column
    private String criticality; // CRITICAL, HIGH, MEDIUM, LOW
    
    @Column
    private String category;
    
    @Column
    private String subCategory;
    
    @Column
    private String supplier;
    
    @Column
    private String assetTag;
    
    @Column
    private String barcode;
    
    @Column
    private String specifications;
    
    @Column
    private String technicalDocs;
    
    @Column
    private String photos;
    
    @Column
    private String notes;
    
    @Column
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    // Constructors
    public Equipment() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getEquipmentCode() { return equipmentCode; }
    public void setEquipmentCode(String equipmentCode) { this.equipmentCode = equipmentCode; }
    
    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getEquipmentType() { return equipmentType; }
    public void setEquipmentType(String equipmentType) { this.equipmentType = equipmentType; }
    
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getInstallationDate() { return installationDate; }
    public void setInstallationDate(LocalDateTime installationDate) { this.installationDate = installationDate; }
    
    public LocalDateTime getLastMaintenanceDate() { return lastMaintenanceDate; }
    public void setLastMaintenanceDate(LocalDateTime lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }
    
    public LocalDateTime getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDateTime nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    
    public Long getTotalOperatingHours() { return totalOperatingHours; }
    public void setTotalOperatingHours(Long totalOperatingHours) { this.totalOperatingHours = totalOperatingHours; }
    
    public Long getLastOperatingHours() { return lastOperatingHours; }
    public void setLastOperatingHours(Long lastOperatingHours) { this.lastOperatingHours = lastOperatingHours; }
    
    public String getResponsiblePerson() { return responsiblePerson; }
    public void setResponsiblePerson(String responsiblePerson) { this.responsiblePerson = responsiblePerson; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public String getCostCenter() { return costCenter; }
    public void setCostCenter(String costCenter) { this.costCenter = costCenter; }
    
    public Double getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(Double purchasePrice) { this.purchasePrice = purchasePrice; }
    
    public LocalDateTime getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDateTime purchaseDate) { this.purchaseDate = purchaseDate; }
    
    public String getWarrantyExpiryDate() { return warrantyExpiryDate; }
    public void setWarrantyExpiryDate(String warrantyExpiryDate) { this.warrantyExpiryDate = warrantyExpiryDate; }
    
    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }
    
    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }
    
    public String getAssetTag() { return assetTag; }
    public void setAssetTag(String assetTag) { this.assetTag = assetTag; }
    
    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
    
    public String getSpecifications() { return specifications; }
    public void setSpecifications(String specifications) { this.specifications = specifications; }
    
    public String getTechnicalDocs() { return technicalDocs; }
    public void setTechnicalDocs(String technicalDocs) { this.technicalDocs = technicalDocs; }
    
    public String getPhotos() { return photos; }
    public void setPhotos(String photos) { this.photos = photos; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}