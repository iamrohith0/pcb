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
@Table(name = "customer_notes", indexes = {
    @Index(name = "idx_customer_notes_customer_id", columnList = "customer_id"),
    @Index(name = "idx_customer_notes_type", columnList = "note_type"),
    @Index(name = "idx_customer_notes_created_at", columnList = "created_at")
})
public class CustomerNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "note_type", length = 50)
    private String noteType;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "text", nullable = false)
    private String content;

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    // Constructors
    public CustomerNote() {
        this.createdAt = OffsetDateTime.now();
    }

    public CustomerNote(UUID customerId, String noteType, String title, 
                       String content, String createdBy) {
        this();
        this.customerId = customerId;
        this.noteType = noteType;
        this.title = title;
        this.content = content;
        this.createdBy = createdBy;
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

    public String getNoteType() {
        return noteType;
    }

    public void setNoteType(String noteType) {
        this.noteType = noteType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}