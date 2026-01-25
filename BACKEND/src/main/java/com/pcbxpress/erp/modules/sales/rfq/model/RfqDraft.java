package com.pcbxpress.erp.modules.sales.rfq.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "sales_rfq_drafts", schema = "public",
       uniqueConstraints = @UniqueConstraint(name = "sales_rfq_drafts_user_id_draft_name_key", columnNames = {"user_id", "draft_name"}))
public class RfqDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "draft_name", length = 200)
    private String draftName;

    @Column(name = "created_at", columnDefinition = "timestamptz", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "timestamptz", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rfq_data", nullable = false, columnDefinition = "jsonb")
    private JsonNode rfqData;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getDraftName() { return draftName; }
    public void setDraftName(String draftName) { this.draftName = draftName; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public JsonNode getRfqData() { return rfqData; }
    public void setRfqData(JsonNode rfqData) { this.rfqData = rfqData; }
}
