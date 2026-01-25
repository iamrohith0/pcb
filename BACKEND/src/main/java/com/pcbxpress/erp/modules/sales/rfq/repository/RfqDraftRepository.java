package com.pcbxpress.erp.modules.sales.rfq.repository;

import com.pcbxpress.erp.modules.sales.rfq.model.RfqDraft;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqDraftRepository extends JpaRepository<RfqDraft, UUID> {
    List<RfqDraft> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<RfqDraft> findByUserIdAndDraftName(Long userId, String draftName);
}
