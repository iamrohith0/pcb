package com.pcbxpress.erp.modules.quality.certificates.service;

import com.pcbxpress.erp.modules.quality.certificates.dto.RoHSREACHDto;
import com.pcbxpress.erp.modules.quality.certificates.dto.RoHSREACHPayload;
import com.pcbxpress.erp.modules.quality.certificates.model.RoHSREACH;
import com.pcbxpress.erp.modules.quality.certificates.repository.RoHSREACHRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RoHSREACHService {
    
    @Autowired
    private RoHSREACHRepository rohsREACHRepository;
    
    /**
     * Create a new RoHS/REACH certificate
     */
    @Transactional
    public RoHSREACHDto createRoHSREACH(RoHSREACHPayload payload) {
        RoHSREACH rohsREACH = new RoHSREACH();
        updateRoHSREACHFromPayload(rohsREACH, payload);
        
        // Generate certificate number if not provided
        if (rohsREACH.getCertificateNo() == null || rohsREACH.getCertificateNo().isEmpty()) {
            rohsREACH.setCertificateNo(generateCertificateNumber());
        }
        
        // Set status to DRAFT by default
        if (rohsREACH.getStatus() == null) {
            rohsREACH.setStatus(RoHSREACH.Status.DRAFT);
        }
        
        rohsREACH = rohsREACHRepository.save(rohsREACH);
        return new RoHSREACHDto(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificate by ID
     */
    public Optional<RoHSREACHDto> getRoHSREACHById(Long id) {
        return rohsREACHRepository.findById(id).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificate by certificate number
     */
    public Optional<RoHSREACHDto> getRoHSREACHByCertificateNo(String certificateNo) {
        return rohsREACHRepository.findByCertificateNo(certificateNo).map(RoHSREACHDto::new);
    }
    
    /**
     * Get all RoHS/REACH certificates with pagination
     */
    public Page<RoHSREACHDto> getAllRoHSREACH(Pageable pageable) {
        return rohsREACHRepository.findAll(pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by status with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByStatus(RoHSREACH.Status status, Pageable pageable) {
        return rohsREACHRepository.findByStatus(status, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by customer
     */
    public List<RoHSREACHDto> getRoHSREACHByCustomer(String customer) {
        return rohsREACHRepository.findByCustomer(customer).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by customer with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByCustomer(String customer, Pageable pageable) {
        return rohsREACHRepository.findByCustomer(customer, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by lot number
     */
    public List<RoHSREACHDto> getRoHSREACHByLotNo(String lotNo) {
        return rohsREACHRepository.findByLotNo(lotNo).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by lot number with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByLotNo(String lotNo, Pageable pageable) {
        return rohsREACHRepository.findByLotNo(lotNo, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by work order number
     */
    public List<RoHSREACHDto> getRoHSREACHByWorkOrderNo(String workOrderNo) {
        return rohsREACHRepository.findByWorkOrderNo(workOrderNo).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by work order number with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByWorkOrderNo(String workOrderNo, Pageable pageable) {
        return rohsREACHRepository.findByWorkOrderNo(workOrderNo, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by shipment ID
     */
    public List<RoHSREACHDto> getRoHSREACHByShipmentId(String shipmentId) {
        return rohsREACHRepository.findByShipmentId(shipmentId).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by shipment ID with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByShipmentId(String shipmentId, Pageable pageable) {
        return rohsREACHRepository.findByShipmentId(shipmentId, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by date range
     */
    public List<RoHSREACHDto> getRoHSREACHByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return rohsREACHRepository.findByCreatedAtBetween(startDate, endDate).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by date range with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return rohsREACHRepository.findByCreatedAtBetween(startDate, endDate, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by customer and date range
     */
    public List<RoHSREACHDto> getRoHSREACHByCustomerAndDateRange(String customer, LocalDateTime startDate, LocalDateTime endDate) {
        return rohsREACHRepository.findByCustomerAndCreatedAtBetween(customer, startDate, endDate).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by customer and date range with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByCustomerAndDateRange(String customer, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return rohsREACHRepository.findByCustomerAndCreatedAtBetween(customer, startDate, endDate, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by generated by user
     */
    public List<RoHSREACHDto> getRoHSREACHByGeneratedBy(String generatedBy) {
        return rohsREACHRepository.findByGeneratedBy(generatedBy).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by generated by user with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByGeneratedBy(String generatedBy, Pageable pageable) {
        return rohsREACHRepository.findByGeneratedBy(generatedBy, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by sent to user
     */
    public List<RoHSREACHDto> getRoHSREACHBySentTo(String sentTo) {
        return rohsREACHRepository.findBySentTo(sentTo).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by sent to user with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHBySentTo(String sentTo, Pageable pageable) {
        return rohsREACHRepository.findBySentTo(sentTo, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by carrier
     */
    public List<RoHSREACHDto> getRoHSREACHByCarrier(String carrier) {
        return rohsREACHRepository.findByCarrier(carrier).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by carrier with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByCarrier(String carrier, Pageable pageable) {
        return rohsREACHRepository.findByCarrier(carrier, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by AWB
     */
    public List<RoHSREACHDto> getRoHSREACHByAwb(String awb) {
        return rohsREACHRepository.findByAwb(awb).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by AWB with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByAwb(String awb, Pageable pageable) {
        return rohsREACHRepository.findByAwb(awb, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by ship date
     */
    public List<RoHSREACHDto> getRoHSREACHByShipDate(LocalDateTime shipDate) {
        return rohsREACHRepository.findByShipDate(shipDate).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by ship date with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByShipDate(LocalDateTime shipDate, Pageable pageable) {
        return rohsREACHRepository.findByShipDate(shipDate, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by ship date range
     */
    public List<RoHSREACHDto> getRoHSREACHByShipDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return rohsREACHRepository.findByShipDateBetween(startDate, endDate).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by ship date range with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByShipDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return rohsREACHRepository.findByShipDateBetween(startDate, endDate, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by RoHS compliance
     */
    public List<RoHSREACHDto> getRoHSREACHByRohsCompliance(String rohsCompliance) {
        return rohsREACHRepository.findByRohsCompliance(rohsCompliance).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by RoHS compliance with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByRohsCompliance(String rohsCompliance, Pageable pageable) {
        return rohsREACHRepository.findByRohsCompliance(rohsCompliance, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by REACH compliance
     */
    public List<RoHSREACHDto> getRoHSREACHByReachCompliance(String reachCompliance) {
        return rohsREACHRepository.findByReachCompliance(reachCompliance).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by REACH compliance with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByReachCompliance(String reachCompliance, Pageable pageable) {
        return rohsREACHRepository.findByReachCompliance(reachCompliance, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by compliance officer
     */
    public List<RoHSREACHDto> getRoHSREACHByComplianceOfficer(String complianceOfficer) {
        return rohsREACHRepository.findByComplianceOfficer(complianceOfficer).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by compliance officer with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByComplianceOfficer(String complianceOfficer, Pageable pageable) {
        return rohsREACHRepository.findByComplianceOfficer(complianceOfficer, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by test lab
     */
    public List<RoHSREACHDto> getRoHSREACHByTestLab(String testLab) {
        return rohsREACHRepository.findByTestLab(testLab).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by test lab with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByTestLab(String testLab, Pageable pageable) {
        return rohsREACHRepository.findByTestLab(testLab, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by test report number
     */
    public List<RoHSREACHDto> getRoHSREACHByTestReportNo(String testReportNo) {
        return rohsREACHRepository.findByTestReportNo(testReportNo).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by test report number with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByTestReportNo(String testReportNo, Pageable pageable) {
        return rohsREACHRepository.findByTestReportNo(testReportNo, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate authority
     */
    public List<RoHSREACHDto> getRoHSREACHByCertificateAuthority(String certificateAuthority) {
        return rohsREACHRepository.findByCertificateAuthority(certificateAuthority).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by certificate authority with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByCertificateAuthority(String certificateAuthority, Pageable pageable) {
        return rohsREACHRepository.findByCertificateAuthority(certificateAuthority, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate reference
     */
    public List<RoHSREACHDto> getRoHSREACHByCertificateReference(String certificateReference) {
        return rohsREACHRepository.findByCertificateReference(certificateReference).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by certificate reference with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByCertificateReference(String certificateReference, Pageable pageable) {
        return rohsREACHRepository.findByCertificateReference(certificateReference, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date
     */
    public List<RoHSREACHDto> getRoHSREACHByCertificateExpiry(LocalDateTime certificateExpiry) {
        return rohsREACHRepository.findByCertificateExpiry(certificateExpiry).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByCertificateExpiry(LocalDateTime certificateExpiry, Pageable pageable) {
        return rohsREACHRepository.findByCertificateExpiry(certificateExpiry, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date range
     */
    public List<RoHSREACHDto> getRoHSREACHByCertificateExpiryRange(LocalDateTime startDate, LocalDateTime endDate) {
        return rohsREACHRepository.findByCertificateExpiryBetween(startDate, endDate).stream().map(RoHSREACHDto::new).toList();
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date range with pagination
     */
    public Page<RoHSREACHDto> getRoHSREACHByCertificateExpiryRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return rohsREACHRepository.findByCertificateExpiryBetween(startDate, endDate, pageable).map(RoHSREACHDto::new);
    }
    
    /**
     * Update RoHS/REACH certificate
     */
    @Transactional
    public Optional<RoHSREACHDto> updateRoHSREACH(Long id, RoHSREACHPayload payload) {
        return rohsREACHRepository.findById(id).map(existingRoHSREACH -> {
            updateRoHSREACHFromPayload(existingRoHSREACH, payload);
            existingRoHSREACH = rohsREACHRepository.save(existingRoHSREACH);
            return new RoHSREACHDto(existingRoHSREACH);
        });
    }
    
    /**
     * Update RoHS/REACH certificate status
     */
    @Transactional
    public Optional<RoHSREACHDto> updateRoHSREACHStatus(Long id, RoHSREACH.Status status) {
        return rohsREACHRepository.findById(id).map(existingRoHSREACH -> {
            existingRoHSREACH.setStatus(status);
            existingRoHSREACH = rohsREACHRepository.save(existingRoHSREACH);
            return new RoHSREACHDto(existingRoHSREACH);
        });
    }
    
    /**
     * Update RoHS/REACH certificate as generated
     */
    @Transactional
    public Optional<RoHSREACHDto> markAsGenerated(Long id, String generatedBy) {
        return rohsREACHRepository.findById(id).map(existingRoHSREACH -> {
            existingRoHSREACH.setStatus(RoHSREACH.Status.READY);
            existingRoHSREACH.setGeneratedBy(generatedBy);
            existingRoHSREACH.setGeneratedAt(LocalDateTime.now());
            existingRoHSREACH = rohsREACHRepository.save(existingRoHSREACH);
            return new RoHSREACHDto(existingRoHSREACH);
        });
    }
    
    /**
     * Update RoHS/REACH certificate as sent
     */
    @Transactional
    public Optional<RoHSREACHDto> markAsSent(Long id, String sentTo) {
        return rohsREACHRepository.findById(id).map(existingRoHSREACH -> {
            existingRoHSREACH.setStatus(RoHSREACH.Status.SENT);
            existingRoHSREACH.setSentTo(sentTo);
            existingRoHSREACH.setSentAt(LocalDateTime.now());
            existingRoHSREACH = rohsREACHRepository.save(existingRoHSREACH);
            return new RoHSREACHDto(existingRoHSREACH);
        });
    }
    
    /**
     * Cancel RoHS/REACH certificate
     */
    @Transactional
    public Optional<RoHSREACHDto> cancelRoHSREACH(Long id) {
        return rohsREACHRepository.findById(id).map(existingRoHSREACH -> {
            existingRoHSREACH.setStatus(RoHSREACH.Status.CANCELLED);
            existingRoHSREACH = rohsREACHRepository.save(existingRoHSREACH);
            return new RoHSREACHDto(existingRoHSREACH);
        });
    }
    
    /**
     * Delete RoHS/REACH certificate
     */
    @Transactional
    public boolean deleteRoHSREACH(Long id) {
        if (rohsREACHRepository.existsById(id)) {
            rohsREACHRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    /**
     * Count RoHS/REACH certificates by status
     */
    public long countByStatus(RoHSREACH.Status status) {
        return rohsREACHRepository.countByStatus(status);
    }
    
    /**
     * Count RoHS/REACH certificates by customer
     */
    public long countByCustomer(String customer) {
        return rohsREACHRepository.countByCustomer(customer);
    }
    
    /**
     * Count RoHS/REACH certificates by generated by user
     */
    public long countByGeneratedBy(String generatedBy) {
        return rohsREACHRepository.countByGeneratedBy(generatedBy);
    }
    
    /**
     * Count RoHS/REACH certificates by sent to user
     */
    public long countBySentTo(String sentTo) {
        return rohsREACHRepository.countBySentTo(sentTo);
    }
    
    /**
     * Count RoHS/REACH certificates by carrier
     */
    public long countByCarrier(String carrier) {
        return rohsREACHRepository.countByCarrier(carrier);
    }
    
    /**
     * Count RoHS/REACH certificates by AWB
     */
    public long countByAwb(String awb) {
        return rohsREACHRepository.countByAwb(awb);
    }
    
    /**
     * Count RoHS/REACH certificates by RoHS compliance
     */
    public long countByRohsCompliance(String rohsCompliance) {
        return rohsREACHRepository.countByRohsCompliance(rohsCompliance);
    }
    
    /**
     * Count RoHS/REACH certificates by REACH compliance
     */
    public long countByReachCompliance(String reachCompliance) {
        return rohsREACHRepository.countByReachCompliance(reachCompliance);
    }
    
    /**
     * Count RoHS/REACH certificates by compliance officer
     */
    public long countByComplianceOfficer(String complianceOfficer) {
        return rohsREACHRepository.countByComplianceOfficer(complianceOfficer);
    }
    
    /**
     * Count RoHS/REACH certificates by test lab
     */
    public long countByTestLab(String testLab) {
        return rohsREACHRepository.countByTestLab(testLab);
    }
    
    /**
     * Count RoHS/REACH certificates by certificate authority
     */
    public long countByCertificateAuthority(String certificateAuthority) {
        return rohsREACHRepository.countByCertificateAuthority(certificateAuthority);
    }
    
    /**
     * Generate certificate number
     */
    private String generateCertificateNumber() {
        // Get the latest certificate number with prefix format like "ROHS-YYYY-XXXX"
        String year = String.valueOf(LocalDateTime.now().getYear());
        String prefix = "ROHS-" + year + "-";
        
        String latestCertificateNo = rohsREACHRepository.findLatestCertificateNoByPrefix(prefix);
        
        int nextNumber = 1;
        if (latestCertificateNo != null && !latestCertificateNo.isEmpty()) {
            try {
                String numberPart = latestCertificateNo.substring(prefix.length());
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                // If parsing fails, start from 1
                nextNumber = 1;
            }
        }
        
        return prefix + String.format("%04d", nextNumber);
    }
    
    /**
     * Update RoHS/REACH entity from payload
     */
    private void updateRoHSREACHFromPayload(RoHSREACH rohsREACH, RoHSREACHPayload payload) {
        rohsREACH.setOrderNo(payload.getOrderNo());
        rohsREACH.setCustomer(payload.getCustomer());
        rohsREACH.setPoNo(payload.getPoNo());
        rohsREACH.setPcbType(payload.getPcbType());
        rohsREACH.setFinish(payload.getFinish());
        rohsREACH.setQuantity(payload.getQuantity());
        rohsREACH.setLotNo(payload.getLotNo());
        rohsREACH.setWorkOrderNo(payload.getWorkOrderNo());
        rohsREACH.setShipmentId(payload.getShipmentId());
        rohsREACH.setCarrier(payload.getCarrier());
        rohsREACH.setAwb(payload.getAwb());
        rohsREACH.setShipDate(payload.getShipDate());
        rohsREACH.setStatus(payload.getStatus());
        rohsREACH.setTemplateId(payload.getTemplateId());
        rohsREACH.setIncludeTestReports(payload.getIncludeTestReports());
        rohsREACH.setIncludeAOISummary(payload.getIncludeAOISummary());
        rohsREACH.setIncludeEtchCoupons(payload.getIncludeEtchCoupons());
        rohsREACH.setNotes(payload.getNotes());
        rohsREACH.setGeneratedBy(payload.getGeneratedBy());
        rohsREACH.setSentTo(payload.getSentTo());
        
        // RoHS/REACH specific fields
        rohsREACH.setRohsCompliance(payload.getRohsCompliance());
        rohsREACH.setReachCompliance(payload.getReachCompliance());
        rohsREACH.setRestrictedSubstances(payload.getRestrictedSubstances());
        rohsREACH.setComplianceDate(payload.getComplianceDate());
        rohsREACH.setComplianceOfficer(payload.getComplianceOfficer());
        rohsREACH.setTestLab(payload.getTestLab());
        rohsREACH.setTestReportNo(payload.getTestReportNo());
        rohsREACH.setTestDate(payload.getTestDate());
        rohsREACH.setTestMethod(payload.getTestMethod());
        rohsREACH.setCertificateAuthority(payload.getCertificateAuthority());
        rohsREACH.setCertificateReference(payload.getCertificateReference());
        rohsREACH.setCertificateExpiry(payload.getCertificateExpiry());
    }
}