package com.pcbxpress.erp.modules.engineering.cam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cam_outputs", indexes = {
    @Index(name = "idx_cam_outputs_job_id", columnList = "camJobId"),
    @Index(name = "idx_cam_outputs_output_type", columnList = "outputType"),
    @Index(name = "idx_cam_outputs_status", columnList = "status"),
    @Index(name = "idx_cam_outputs_created_at", columnList = "createdAt")
})
public class CamOutput {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "cam_job_id", nullable = false, columnDefinition = "uuid")
    private UUID camJobId;
    
    @Column(name = "output_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private OutputType outputType;
    
    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;
    
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "file_format", length = 20)
    private String fileFormat;
    
    @Column(name = "layers", length = 200)
    private String layers;
    
    @Column(name = "resolution")
    private Double resolution;
    
    @Column(name = "units", length = 10)
    private String units;
    
    @Column(name = "scale")
    private Double scale;
    
    @Column(name = "mirrored", nullable = false)
    private boolean mirrored;
    
    @Column(name = "positive", nullable = false)
    private boolean positive;
    
    @Column(name = "aperture_format", length = 50)
    private String apertureFormat;
    
    @Column(name = "coordinate_format", length = 50)
    private String coordinateFormat;
    
    @Column(name = "zero_suppression", length = 20)
    private String zeroSuppression;
    
    @Column(name = "leading_zero", nullable = false)
    private boolean leadingZero;
    
    @Column(name = "trailing_zero", nullable = false)
    private boolean trailingZero;
    
    @Column(name = "decimal_places")
    private Integer decimalPlaces;
    
    @Column(name = "integer_places")
    private Integer integerPlaces;
    
    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;
    
    @Column(name = "created_by_name", length = 200)
    private String createdByName;
    
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private OutputStatus status;
    
    @Column(name = "generated_at", nullable = false)
    private OffsetDateTime generatedAt;
    
    @Column(name = "download_count")
    private Integer downloadCount;
    
    @Column(name = "last_downloaded_at")
    private OffsetDateTime lastDownloadedAt;
    
    @Column(name = "checksum", length = 64)
    private String checksum;
    
    @Column(name = "version")
    private Integer version;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getCamJobId() {
        return camJobId;
    }
    
    public void setCamJobId(UUID camJobId) {
        this.camJobId = camJobId;
    }
    
    public OutputType getOutputType() {
        return outputType;
    }
    
    public void setOutputType(OutputType outputType) {
        this.outputType = outputType;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public String getFilePath() {
        return filePath;
    }
    
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getFileFormat() {
        return fileFormat;
    }
    
    public void setFileFormat(String fileFormat) {
        this.fileFormat = fileFormat;
    }
    
    public String getLayers() {
        return layers;
    }
    
    public void setLayers(String layers) {
        this.layers = layers;
    }
    
    public Double getResolution() {
        return resolution;
    }
    
    public void setResolution(Double resolution) {
        this.resolution = resolution;
    }
    
    public String getUnits() {
        return units;
    }
    
    public void setUnits(String units) {
        this.units = units;
    }
    
    public Double getScale() {
        return scale;
    }
    
    public void setScale(Double scale) {
        this.scale = scale;
    }
    
    public boolean isMirrored() {
        return mirrored;
    }
    
    public void setMirrored(boolean mirrored) {
        this.mirrored = mirrored;
    }
    
    public boolean isPositive() {
        return positive;
    }
    
    public void setPositive(boolean positive) {
        this.positive = positive;
    }
    
    public String getApertureFormat() {
        return apertureFormat;
    }
    
    public void setApertureFormat(String apertureFormat) {
        this.apertureFormat = apertureFormat;
    }
    
    public String getCoordinateFormat() {
        return coordinateFormat;
    }
    
    public void setCoordinateFormat(String coordinateFormat) {
        this.coordinateFormat = coordinateFormat;
    }
    
    public String getZeroSuppression() {
        return zeroSuppression;
    }
    
    public void setZeroSuppression(String zeroSuppression) {
        this.zeroSuppression = zeroSuppression;
    }
    
    public boolean isLeadingZero() {
        return leadingZero;
    }
    
    public void setLeadingZero(boolean leadingZero) {
        this.leadingZero = leadingZero;
    }
    
    public boolean isTrailingZero() {
        return trailingZero;
    }
    
    public void setTrailingZero(boolean trailingZero) {
        this.trailingZero = trailingZero;
    }
    
    public Integer getDecimalPlaces() {
        return decimalPlaces;
    }
    
    public void setDecimalPlaces(Integer decimalPlaces) {
        this.decimalPlaces = decimalPlaces;
    }
    
    public Integer getIntegerPlaces() {
        return integerPlaces;
    }
    
    public void setIntegerPlaces(Integer integerPlaces) {
        this.integerPlaces = integerPlaces;
    }
    
    public UUID getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getCreatedByName() {
        return createdByName;
    }
    
    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }
    
    public OutputStatus getStatus() {
        return status;
    }
    
    public void setStatus(OutputStatus status) {
        this.status = status;
    }
    
    public OffsetDateTime getGeneratedAt() {
        return generatedAt;
    }
    
    public void setGeneratedAt(OffsetDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
    
    public Integer getDownloadCount() {
        return downloadCount;
    }
    
    public void setDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }
    
    public OffsetDateTime getLastDownloadedAt() {
        return lastDownloadedAt;
    }
    
    public void setLastDownloadedAt(OffsetDateTime lastDownloadedAt) {
        this.lastDownloadedAt = lastDownloadedAt;
    }
    
    public String getChecksum() {
        return checksum;
    }
    
    public void setChecksum(String checksum) {
        this.checksum = checksum;
    }
    
    public Integer getVersion() {
        return version;
    }
    
    public void setVersion(Integer version) {
        this.version = version;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
