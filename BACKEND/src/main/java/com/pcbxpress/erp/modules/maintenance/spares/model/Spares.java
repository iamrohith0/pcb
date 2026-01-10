package com.pcbxpress.erp.modules.maintenance.spares.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Spares entity for managing spare parts inventory
 */
@Entity
@Table(name = "spares")
public class Spares {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String spareCode;
    
    @Column(nullable = false)
    private String spareName;
    
    @Column
    private String description;
    
    @Column
    private String category;
    
    @Column
    private String subCategory;
    
    @Column
    private String partNumber;
    
    @Column
    private String manufacturer;
    
    @Column
    private String model;
    
    @Column
    private String supplier;
    
    @Column
    private String unitOfMeasure;
    
    @Column
    private Double unitPrice;
    
    @Column
    private Integer currentStock;
    
    @Column
    private Integer minimumStock;
    
    @Column
    private Integer maximumStock;
    
    @Column
    private String location;
    
    @Column
    private String binLocation;
    
    @Column
    private String status; // ACTIVE, INACTIVE, OBSOLETE
    
    @Column
    private String criticality; // CRITICAL, HIGH, MEDIUM, LOW
    
    @Column
    private String compatibility;
    
    @Column
    private String specifications;
    
    @Column
    private String technicalDocs;
    
    @Column
    private String photos;
    
    @Column
    private String notes;
    
    @Column
    private String createdBy;
    
    @Column
    private String updatedBy;
    
    @Column
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    // Constructors
    public Spares() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getSpareCode() { return spareCode; }
    public void setSpareCode(String spareCode) { this.spareCode = spareCode; }
    
    public String getSpareName() { return spareName; }
    public void setSpareName(String spareName) { this.spareName = spareName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }
    
    public String getPartNumber() { return partNumber; }
    public void setPartNumber(String partNumber) { this.partNumber = partNumber; }
    
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    
    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }
    
    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }
    
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    
    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }
    
    public Integer getMinimumStock() { return minimumStock; }
    public void setMinimumStock(Integer minimumStock) { this.minimumStock = minimumStock; }
    
    public Integer getMaximumStock() { return maximumStock; }
    public void setMaximumStock(Integer maximumStock) { this.maximumStock = maximumStock; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getBinLocation() { return binLocation; }
    public void setBinLocation(String binLocation) { this.binLocation = binLocation; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }
    
    public String getCompatibility() { return compatibility; }
    public void setCompatibility(String compatibility) { this.compatibility = compatibility; }
    
    public String getSpecifications() { return specifications; }
    public void setSpecifications(String specifications) { this.specifications = specifications; }
    
    public String getTechnicalDocs() { return technicalDocs; }
    public void setTechnicalDocs(String technicalDocs) { this.technicalDocs = technicalDocs; }
    
    public String getPhotos() { return photos; }
    public void setPhotos(String photos) { this.photos = photos; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}