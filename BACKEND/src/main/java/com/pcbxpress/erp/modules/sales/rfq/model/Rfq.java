package com.pcbxpress.erp.modules.sales.rfq.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "sales_rfqs", schema = "public")
public class Rfq {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "rfq_no", length = 50, nullable = false, unique = true)
    private String rfqNo;

    @Column(name = "rfq_date", nullable = false)
    private LocalDate rfqDate;

    @Column(name = "status", length = 30, nullable = false)
    private String status = "Open";

    @Column(name = "priority", length = 20, nullable = false)
    private String priority = "Normal";

    @Column(name = "currency", length = 10, nullable = false)
    private String currency = "INR";

    @Column(name = "customer_id", columnDefinition = "uuid")
    private UUID customerId;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "contact_name", length = 150)
    private String contactName;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "total_qty")
    private Integer totalQty = 0;

    @Column(name = "lines_count")
    private Integer linesCount = 0;

    @Column(name = "max_layers")
    private Integer maxLayers = 0;

    @Column(name = "special_instructions", columnDefinition = "text")
    private String specialInstructions;

    // attachments is jsonb NOT NULL default '[]'
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachments", nullable = false, columnDefinition = "jsonb")
    private JsonNode attachments;

    @Column(name = "created_at", columnDefinition = "timestamptz", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "timestamptz", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "rfq", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RfqLine> lines = new ArrayList<>();

    // --- getters/setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }

    public LocalDate getRfqDate() { return rfqDate; }
    public void setRfqDate(LocalDate rfqDate) { this.rfqDate = rfqDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public Integer getTotalQty() { return totalQty; }
    public void setTotalQty(Integer totalQty) { this.totalQty = totalQty; }

    public Integer getLinesCount() { return linesCount; }
    public void setLinesCount(Integer linesCount) { this.linesCount = linesCount; }

    public Integer getMaxLayers() { return maxLayers; }
    public void setMaxLayers(Integer maxLayers) { this.maxLayers = maxLayers; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public JsonNode getAttachments() { return attachments; }
    public void setAttachments(JsonNode attachments) { this.attachments = attachments; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public List<RfqLine> getLines() { return lines; }
    public void setLines(List<RfqLine> lines) { this.lines = lines; }

    public void addLine(RfqLine line) {
        lines.add(line);
        line.setRfq(this);
    }

    public void clearLines() {
        for (RfqLine l : lines) l.setRfq(null);
        lines.clear();
    }
}
