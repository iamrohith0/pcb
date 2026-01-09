package com.pcbxpress.erp.modules.sales.customer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "customer_documents", indexes = {
    @Index(name = "idx_customer_documents_customer_id", columnList = "customer_id"),
    @Index(name = "idx_customer_documents_type", columnList = "document_type"),
    @Index(name = "idx_customer_documents_active", columnList = "is_active"),
    @Index(name = "idx_customer_documents_expires_at", columnList = "expires_at")
})
public class CustomerDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    @Column(name = "document_name", nullable = false, length = 200)
    private String documentName;

    @Column(name = "document_path", nullable = false, length = 500)
    private String documentPath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "uploaded_by", length = 150)
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private OffsetDateTime uploadedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    // Constructors
    public CustomerDocument() {
        this.uploadedAt = OffsetDateTime.now();
        this.isActive = true;
    }

    public CustomerDocument(UUID customerId, String documentType, String documentName, 
                           String documentPath, Long fileSize, String fileType, 
                           String uploadedBy, OffsetDateTime expiresAt) {
        this();
        this.customerId = customerId;
        this.documentType = documentType;
        this.documentName = documentName;
        this.documentPath = documentPath;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.uploadedBy = uploadedBy;
        this.expiresAt = expiresAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getDocumentName() {
        return documentName;
    }

    public void setDocumentName(String documentName) {
        this.documentName = documentName;
    }

    public String getDocumentPath() {
        return documentPath;
    }

    public void setDocumentPath(String documentPath) {
        this.documentPath = documentPath;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public OffsetDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(OffsetDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}