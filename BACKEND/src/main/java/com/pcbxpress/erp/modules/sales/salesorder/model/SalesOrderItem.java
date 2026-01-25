package com.pcbxpress.erp.modules.sales.salesorder.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "sales_order_items", schema = "public")
public class SalesOrderItem {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private SalesOrder order;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "qty")
    private Integer qty;

    @Column(name = "uom", length = 20)
    private String uom;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "tax_pct", precision = 6, scale = 2)
    private BigDecimal taxPct;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
