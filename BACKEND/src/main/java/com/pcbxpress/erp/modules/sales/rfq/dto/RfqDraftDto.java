package com.pcbxpress.erp.modules.sales.rfq.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqDraftDto {
    private UUID id;
    private Long userId;       // ✅ bigint
    private String draftName;
    private JsonNode rfqData;  // ✅ jsonb
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
