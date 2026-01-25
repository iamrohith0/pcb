package com.pcbxpress.erp.modules.sales.rfq.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqDraftDto;
import com.pcbxpress.erp.modules.sales.rfq.dto.RfqDraftPayload;
import com.pcbxpress.erp.modules.sales.rfq.model.RfqDraft;
import com.pcbxpress.erp.modules.sales.rfq.repository.RfqDraftRepository;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RfqDraftService {

    private final RfqDraftRepository rfqDraftRepository;

    public RfqDraftService(RfqDraftRepository rfqDraftRepository) {
        this.rfqDraftRepository = rfqDraftRepository;
    }

    public List<RfqDraftDto> listByUser(String userId) {
        Long uid = parseLong(userId);
        return rfqDraftRepository.findByUserIdOrderByUpdatedAtDesc(uid).stream()
            .map(this::toDto)
            .toList();
    }

    public RfqDraftDto get(String id) {
        RfqDraft draft = rfqDraftRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("RFQ draft not found: " + id));
        return toDto(draft);
    }

    public RfqDraftDto save(String userId, RfqDraftPayload payload) {
        Long uid = parseLong(userId);
        String draftName = (payload.getDraftName() == null || payload.getDraftName().isBlank()) ? "default" : payload.getDraftName();

        RfqDraft draft = rfqDraftRepository.findByUserIdAndDraftName(uid, draftName)
            .orElseGet(RfqDraft::new);

        draft.setUserId(uid);
        draft.setDraftName(draftName);
        draft.setRfqData(payload.getRfqData()); // jsonb

        RfqDraft saved = rfqDraftRepository.save(draft);
        return toDto(saved);
    }

    public void delete(String id) {
        rfqDraftRepository.deleteById(UUID.fromString(id));
    }

    public void deleteByUserAndName(String userId, String draftName) {
        Long uid = parseLong(userId);
        rfqDraftRepository.findByUserIdAndDraftName(uid, draftName).ifPresent(rfqDraftRepository::delete);
    }

    private RfqDraftDto toDto(RfqDraft d) {
        return RfqDraftDto.builder()
            .id(d.getId())
            .userId(d.getUserId())
            .draftName(d.getDraftName())
            .rfqData(d.getRfqData())
            .createdAt(d.getCreatedAt())
            .updatedAt(d.getUpdatedAt())
            .build();
    }

    private static Long parseLong(String v) {
        try {
            return Long.parseLong(v);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid userId (must be bigint): " + v);
        }
    }
}
