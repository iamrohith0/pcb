package com.pcbxpress.erp.modules.sales.rfq.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqDraftPayload {
    private String draftName;

    @NotNull
    private JsonNode rfqData; // ✅ jsonb
}
