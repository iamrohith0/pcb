package com.pcbxpress.erp.modules.quality.certificates.service;

import com.pcbxpress.erp.modules.quality.certificates.dto.CoCDto;
import com.pcbxpress.erp.modules.quality.certificates.dto.CoCPayload;
import com.pcbxpress.erp.modules.quality.certificates.model.CoC;
import com.pcbxpress.erp.modules.quality.certificates.repository.CoCRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CoCService {
    
    @Autowired
    private CoCRepository cocRepository;
    
    /**
     * Create a new CoC
     */
    @Transactional
    public CoCDto createCoC(CoCPayload payload) {
        CoC coc = new CoC();
        updateCoCFromPayload(coc, payload);
        
        // Generate CoC number if not provided
        if (coc.getCocNo() == null || coc.getCocNo().isEmpty()) {
            coc.setCocNo(generateCocNumber());
        }
        
        // Set status to DRAFT by default
        if (coc.getStatus() == null) {
            coc.setStatus(CoC.Status.DRAFT);
        }
        
        coc = cocRepository.save(coc);
        return new CoCDto(coc);
    }
    
    /**
     * Get CoC by ID
     */
    public Optional<CoCDto> getCoCById(Long id) {
        return cocRepository.findById(id).map(CoCDto::new);
    }
    
    /**
     * Get CoC by CoC number
     */
    public Optional<CoCDto> getCoCByCocNo(String cocNo) {
        return cocRepository.findByCocNo(cocNo).map(CoCDto::new);
    }
    
    /**
     * Get all CoCs with pagination
     */
    public Page<CoCDto> getAllCoCs(Pageable pageable) {
        return cocRepository.findAll(pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by status with pagination
     */
    public Page<CoCDto> getCoCsByStatus(CoC.Status status, Pageable pageable) {
        return cocRepository.findByStatus(status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by customer
     */
    public List<CoCDto> getCoCsByCustomer(String customer) {
        return cocRepository.findByCustomer(customer).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by customer with pagination
     */
    public Page<CoCDto> getCoCsByCustomer(String customer, Pageable pageable) {
        return cocRepository.findByCustomer(customer, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by order number and status
     */
    public List<CoCDto> getCoCsByOrderNoAndStatus(String orderNo, CoC.Status status) {
        return cocRepository.findByOrderNoAndStatus(orderNo, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by order number and status with pagination
     */
    public Page<CoCDto> getCoCsByOrderNoAndStatus(String orderNo, CoC.Status status, Pageable pageable) {
        return cocRepository.findByOrderNoAndStatus(orderNo, status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by customer and status
     */
    public List<CoCDto> getCoCsByCustomerAndStatus(String customer, CoC.Status status) {
        return cocRepository.findByCustomerAndStatus(customer, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by customer and status with pagination
     */
    public Page<CoCDto> getCoCsByCustomerAndStatus(String customer, CoC.Status status, Pageable pageable) {
        return cocRepository.findByCustomerAndStatus(customer, status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by lot number
     */
    public List<CoCDto> getCoCsByLotNo(String lotNo) {
        return cocRepository.findByLotNo(lotNo).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by lot number with pagination
     */
    public Page<CoCDto> getCoCsByLotNo(String lotNo, Pageable pageable) {
        return cocRepository.findByLotNo(lotNo, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by work order number
     */
    public List<CoCDto> getCoCsByWorkOrderNo(String workOrderNo) {
        return cocRepository.findByWorkOrderNo(workOrderNo).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by work order number with pagination
     */
    public Page<CoCDto> getCoCsByWorkOrderNo(String workOrderNo, Pageable pageable) {
        return cocRepository.findByWorkOrderNo(workOrderNo, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by shipment ID
     */
    public List<CoCDto> getCoCsByShipmentId(String shipmentId) {
        return cocRepository.findByShipmentId(shipmentId).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by shipment ID with pagination
     */
    public Page<CoCDto> getCoCsByShipmentId(String shipmentId, Pageable pageable) {
        return cocRepository.findByShipmentId(shipmentId, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by date range
     */
    public List<CoCDto> getCoCsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return cocRepository.findByCreatedAtBetween(startDate, endDate).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by date range with pagination
     */
    public Page<CoCDto> getCoCsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return cocRepository.findByCreatedAtBetween(startDate, endDate, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by customer and date range
     */
    public List<CoCDto> getCoCsByCustomerAndDateRange(String customer, LocalDateTime startDate, LocalDateTime endDate) {
        return cocRepository.findByCustomerAndCreatedAtBetween(customer, startDate, endDate).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by customer and date range with pagination
     */
    public Page<CoCDto> getCoCsByCustomerAndDateRange(String customer, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return cocRepository.findByCustomerAndCreatedAtBetween(customer, startDate, endDate, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by generated by user
     */
    public List<CoCDto> getCoCsByGeneratedBy(String generatedBy) {
        return cocRepository.findByGeneratedBy(generatedBy).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by generated by user with pagination
     */
    public Page<CoCDto> getCoCsByGeneratedBy(String generatedBy, Pageable pageable) {
        return cocRepository.findByGeneratedBy(generatedBy, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by sent to user
     */
    public List<CoCDto> getCoCsBySentTo(String sentTo) {
        return cocRepository.findBySentTo(sentTo).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by sent to user with pagination
     */
    public Page<CoCDto> getCoCsBySentTo(String sentTo, Pageable pageable) {
        return cocRepository.findBySentTo(sentTo, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by carrier
     */
    public List<CoCDto> getCoCsByCarrier(String carrier) {
        return cocRepository.findByCarrier(carrier).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by carrier with pagination
     */
    public Page<CoCDto> getCoCsByCarrier(String carrier, Pageable pageable) {
        return cocRepository.findByCarrier(carrier, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by AWB
     */
    public List<CoCDto> getCoCsByAwb(String awb) {
        return cocRepository.findByAwb(awb).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by AWB with pagination
     */
    public Page<CoCDto> getCoCsByAwb(String awb, Pageable pageable) {
        return cocRepository.findByAwb(awb, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by ship date
     */
    public List<CoCDto> getCoCsByShipDate(LocalDateTime shipDate) {
        return cocRepository.findByShipDate(shipDate).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by ship date with pagination
     */
    public Page<CoCDto> getCoCsByShipDate(LocalDateTime shipDate, Pageable pageable) {
        return cocRepository.findByShipDate(shipDate, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by ship date range
     */
    public List<CoCDto> getCoCsByShipDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return cocRepository.findByShipDateBetween(startDate, endDate).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by ship date range with pagination
     */
    public Page<CoCDto> getCoCsByShipDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return cocRepository.findByShipDateBetween(startDate, endDate, pageable).map(CoCDto::new);
    }
    
    /**
     * Update CoC
     */
    @Transactional
    public Optional<CoCDto> updateCoC(Long id, CoCPayload payload) {
        return cocRepository.findById(id).map(existingCoC -> {
            updateCoCFromPayload(existingCoC, payload);
            existingCoC = cocRepository.save(existingCoC);
            return new CoCDto(existingCoC);
        });
    }
    
    /**
     * Update CoC status
     */
    @Transactional
    public Optional<CoCDto> updateCoCStatus(Long id, CoC.Status status) {
        return cocRepository.findById(id).map(existingCoC -> {
            existingCoC.setStatus(status);
            existingCoC = cocRepository.save(existingCoC);
            return new CoCDto(existingCoC);
        });
    }
    
    /**
     * Update CoC as generated
     */
    @Transactional
    public Optional<CoCDto> markAsGenerated(Long id, String generatedBy) {
        return cocRepository.findById(id).map(existingCoC -> {
            existingCoC.setStatus(CoC.Status.READY);
            existingCoC.setGeneratedBy(generatedBy);
            existingCoC.setGeneratedAt(LocalDateTime.now());
            existingCoC = cocRepository.save(existingCoC);
            return new CoCDto(existingCoC);
        });
    }
    
    /**
     * Update CoC as sent
     */
    @Transactional
    public Optional<CoCDto> markAsSent(Long id, String sentTo) {
        return cocRepository.findById(id).map(existingCoC -> {
            existingCoC.setStatus(CoC.Status.SENT);
            existingCoC.setSentTo(sentTo);
            existingCoC.setSentAt(LocalDateTime.now());
            existingCoC = cocRepository.save(existingCoC);
            return new CoCDto(existingCoC);
        });
    }
    
    /**
     * Cancel CoC
     */
    @Transactional
    public Optional<CoCDto> cancelCoC(Long id) {
        return cocRepository.findById(id).map(existingCoC -> {
            existingCoC.setStatus(CoC.Status.CANCELLED);
            existingCoC = cocRepository.save(existingCoC);
            return new CoCDto(existingCoC);
        });
    }
    
    /**
     * Delete CoC
     */
    @Transactional
    public boolean deleteCoC(Long id) {
        if (cocRepository.existsById(id)) {
            cocRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    /**
     * Count CoCs by status
     */
    public long countByStatus(CoC.Status status) {
        return cocRepository.countByStatus(status);
    }
    
    /**
     * Count CoCs by customer
     */
    public long countByCustomer(String customer) {
        return cocRepository.countByCustomer(customer);
    }
    
    /**
     * Count CoCs by generated by user
     */
    public long countByGeneratedBy(String generatedBy) {
        return cocRepository.countByGeneratedBy(generatedBy);
    }
    
    /**
     * Count CoCs by sent to user
     */
    public long countBySentTo(String sentTo) {
        return cocRepository.countBySentTo(sentTo);
    }
    
    /**
     * Count CoCs by carrier
     */
    public long countByCarrier(String carrier) {
        return cocRepository.countByCarrier(carrier);
    }
    
    /**
     * Count CoCs by AWB
     */
    public long countByAwb(String awb) {
        return cocRepository.countByAwb(awb);
    }
    
    /**
     * Generate CoC number
     */
    private String generateCocNumber() {
        // Get the latest CoC number with prefix format like "COC-YYYY-XXXX"
        String year = String.valueOf(LocalDateTime.now().getYear());
        String prefix = "COC-" + year + "-";
        
        String latestCocNo = cocRepository.findLatestCocNoByPrefix(prefix);
        
        int nextNumber = 1;
        if (latestCocNo != null && !latestCocNo.isEmpty()) {
            try {
                String numberPart = latestCocNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                // If parsing fails, start from 1
                nextNumber = 1;
            }
        }
        
        return prefix + String.format("%04d", nextNumber);
    }
    
    /**
     * Update CoC entity from payload
     */
    private void updateCoCFromPayload(CoC coc, CoCPayload payload) {
        coc.setOrderNo(payload.getOrderNo());
        coc.setCustomer(payload.getCustomer());
        coc.setPoNo(payload.getPoNo());
        coc.setPcbType(payload.getPcbType());
        coc.setFinish(payload.getFinish());
        coc.setQuantity(payload.getQuantity());
        coc.setLotNo(payload.getLotNo());
        coc.setWorkOrderNo(payload.getWorkOrderNo());
        coc.setShipmentId(payload.getShipmentId());
        coc.setCarrier(payload.getCarrier());
        coc.setAwb(payload.getAwb());
        coc.setShipDate(payload.getShipDate());
        coc.setStatus(payload.getStatus());
        coc.setTemplateId(payload.getTemplateId());
        coc.setIncludeTestReports(payload.getIncludeTestReports());
        coc.setIncludeAOISummary(payload.getIncludeAOISummary());
        coc.setIncludeEtchCoupons(payload.getIncludeEtchCoupons());
        coc.setNotes(payload.getNotes());
        coc.setGeneratedBy(payload.getGeneratedBy());
        coc.setSentTo(payload.getSentTo());
    }
    
    /**
     * Get CoCs by lot number and status
     */
    public List<CoCDto> getCoCsByLotNoAndStatus(String lotNo, CoC.Status status) {
        return cocRepository.findByLotNoAndStatus(lotNo, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by lot number and status with pagination
     */
    public Page<CoCDto> getCoCsByLotNoAndStatus(String lotNo, CoC.Status status, Pageable pageable) {
        return cocRepository.findByLotNoAndStatus(lotNo, status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by work order number and status
     */
    public List<CoCDto> getCoCsByWorkOrderNoAndStatus(String workOrderNo, CoC.Status status) {
        return cocRepository.findByWorkOrderNoAndStatus(workOrderNo, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by work order number and status with pagination
     */
    public Page<CoCDto> getCoCsByWorkOrderNoAndStatus(String workOrderNo, CoC.Status status, Pageable pageable) {
        return cocRepository.findByWorkOrderNoAndStatus(workOrderNo, status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by shipment ID and status
     */
    public List<CoCDto> getCoCsByShipmentIdAndStatus(String shipmentId, CoC.Status status) {
        return cocRepository.findByShipmentIdAndStatus(shipmentId, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by shipment ID and status with pagination
     */
    public Page<CoCDto> getCoCsByShipmentIdAndStatus(String shipmentId, CoC.Status status, Pageable pageable) {
        return cocRepository.findByShipmentIdAndStatus(shipmentId, status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by carrier and status
     */
    public List<CoCDto> getCoCsByCarrierAndStatus(String carrier, CoC.Status status) {
        return cocRepository.findByCarrierAndStatus(carrier, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by carrier and status with pagination
     */
    public Page<CoCDto> getCoCsByCarrierAndStatus(String carrier, CoC.Status status, Pageable pageable) {
        return cocRepository.findByCarrierAndStatus(carrier, status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by AWB and status
     */
    public List<CoCDto> getCoCsByAwbAndStatus(String awb, CoC.Status status) {
        return cocRepository.findByAwbAndStatus(awb, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by AWB and status with pagination
     */
    public Page<CoCDto> getCoCsByAwbAndStatus(String awb, CoC.Status status, Pageable pageable) {
        return cocRepository.findByAwbAndStatus(awb, status, pageable).map(CoCDto::new);
    }
    
    /**
     * Get CoCs by ship date range and status
     */
    public List<CoCDto> getCoCsByShipDateRangeAndStatus(LocalDateTime startDate, LocalDateTime endDate, CoC.Status status) {
        return cocRepository.findByShipDateBetweenAndStatus(startDate, endDate, status).stream().map(CoCDto::new).toList();
    }
    
    /**
     * Get CoCs by ship date range and status with pagination
     */
    public Page<CoCDto> getCoCsByShipDateRangeAndStatus(LocalDateTime startDate, LocalDateTime endDate, CoC.Status status, Pageable pageable) {
        return cocRepository.findByShipDateBetweenAndStatus(startDate, endDate, status, pageable).map(CoCDto::new);
    }
}