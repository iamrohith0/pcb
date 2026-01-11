package com.pcbxpress.erp.modules.quality.certificates.controller;

import com.pcbxpress.erp.modules.quality.certificates.dto.RoHSREACHDto;
import com.pcbxpress.erp.modules.quality.certificates.dto.RoHSREACHPayload;
import com.pcbxpress.erp.modules.quality.certificates.model.RoHSREACH;
import com.pcbxpress.erp.modules.quality.certificates.service.RoHSREACHService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/quality/certificates/rohs-reach")
@CrossOrigin(origins = "*")
public class RoHSREACHController {
    
    @Autowired
    private RoHSREACHService rohsREACHService;
    
    /**
     * Create a new RoHS/REACH certificate
     */
    @PostMapping
    public ResponseEntity<RoHSREACHDto> createRoHSREACH(@RequestBody RoHSREACHPayload payload) {
        RoHSREACHDto createdRoHSREACH = rohsREACHService.createRoHSREACH(payload);
        return new ResponseEntity<>(createdRoHSREACH, HttpStatus.CREATED);
    }
    
    /**
     * Get RoHS/REACH certificate by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoHSREACHDto> getRoHSREACHById(@PathVariable Long id) {
        Optional<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHById(id);
        return rohsREACH.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get RoHS/REACH certificate by certificate number
     */
    @GetMapping("/number/{certificateNo}")
    public ResponseEntity<RoHSREACHDto> getRoHSREACHByCertificateNo(@PathVariable String certificateNo) {
        Optional<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateNo(certificateNo);
        return rohsREACH.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all RoHS/REACH certificates with pagination
     */
    @GetMapping
    public ResponseEntity<Page<RoHSREACHDto>> getAllRoHSREACH(Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getAllRoHSREACH(pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by status with pagination
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByStatus(@PathVariable RoHSREACH.Status status, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByStatus(status, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by customer
     */
    @GetMapping("/customer/{customer}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByCustomer(@PathVariable String customer) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCustomer(customer);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by customer with pagination
     */
    @GetMapping("/customer/{customer}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByCustomerWithPagination(@PathVariable String customer, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCustomer(customer, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by lot number
     */
    @GetMapping("/lot/{lotNo}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByLotNo(@PathVariable String lotNo) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByLotNo(lotNo);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by work order number
     */
    @GetMapping("/work-order/{workOrderNo}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByWorkOrderNo(@PathVariable String workOrderNo) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByWorkOrderNo(workOrderNo);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by shipment ID
     */
    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByShipmentId(@PathVariable String shipmentId) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByShipmentId(shipmentId);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByDateRange(startDate, endDate);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by date range with pagination
     */
    @GetMapping("/date-range/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByDateRangeWithPagination(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by customer and date range
     */
    @GetMapping("/customer/{customer}/date-range")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByCustomerAndDateRange(
            @PathVariable String customer,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCustomerAndDateRange(customer, startDate, endDate);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by customer and date range with pagination
     */
    @GetMapping("/customer/{customer}/date-range/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByCustomerAndDateRangeWithPagination(
            @PathVariable String customer,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCustomerAndDateRange(customer, startDate, endDate, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by generated by user
     */
    @GetMapping("/generated-by/{generatedBy}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByGeneratedBy(@PathVariable String generatedBy) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByGeneratedBy(generatedBy);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by generated by user with pagination
     */
    @GetMapping("/generated-by/{generatedBy}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByGeneratedByWithPagination(@PathVariable String generatedBy, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByGeneratedBy(generatedBy, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by sent to user
     */
    @GetMapping("/sent-to/{sentTo}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHBySentTo(@PathVariable String sentTo) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHBySentTo(sentTo);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by sent to user with pagination
     */
    @GetMapping("/sent-to/{sentTo}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHBySentToWithPagination(@PathVariable String sentTo, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHBySentTo(sentTo, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by carrier
     */
    @GetMapping("/carrier/{carrier}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByCarrier(@PathVariable String carrier) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCarrier(carrier);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by carrier with pagination
     */
    @GetMapping("/carrier/{carrier}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByCarrierWithPagination(@PathVariable String carrier, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCarrier(carrier, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by AWB
     */
    @GetMapping("/awb/{awb}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByAwb(@PathVariable String awb) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByAwb(awb);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by AWB with pagination
     */
    @GetMapping("/awb/{awb}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByAwbWithPagination(@PathVariable String awb, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByAwb(awb, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by ship date
     */
    @GetMapping("/ship-date/{shipDate}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByShipDate(@PathVariable LocalDateTime shipDate) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByShipDate(shipDate);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by ship date with pagination
     */
    @GetMapping("/ship-date/{shipDate}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByShipDateWithPagination(@PathVariable LocalDateTime shipDate, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByShipDate(shipDate, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by ship date range
     */
    @GetMapping("/ship-date-range")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByShipDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByShipDateRange(startDate, endDate);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by ship date range with pagination
     */
    @GetMapping("/ship-date-range/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByShipDateRangeWithPagination(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByShipDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by RoHS compliance
     */
    @GetMapping("/rohs-compliance/{rohsCompliance}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByRohsCompliance(@PathVariable String rohsCompliance) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByRohsCompliance(rohsCompliance);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by RoHS compliance with pagination
     */
    @GetMapping("/rohs-compliance/{rohsCompliance}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByRohsComplianceWithPagination(@PathVariable String rohsCompliance, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByRohsCompliance(rohsCompliance, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by REACH compliance
     */
    @GetMapping("/reach-compliance/{reachCompliance}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByReachCompliance(@PathVariable String reachCompliance) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByReachCompliance(reachCompliance);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by REACH compliance with pagination
     */
    @GetMapping("/reach-compliance/{reachCompliance}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByReachComplianceWithPagination(@PathVariable String reachCompliance, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByReachCompliance(reachCompliance, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by compliance officer
     */
    @GetMapping("/compliance-officer/{complianceOfficer}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByComplianceOfficer(@PathVariable String complianceOfficer) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByComplianceOfficer(complianceOfficer);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by compliance officer with pagination
     */
    @GetMapping("/compliance-officer/{complianceOfficer}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByComplianceOfficerWithPagination(@PathVariable String complianceOfficer, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByComplianceOfficer(complianceOfficer, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by test lab
     */
    @GetMapping("/test-lab/{testLab}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByTestLab(@PathVariable String testLab) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByTestLab(testLab);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by test lab with pagination
     */
    @GetMapping("/test-lab/{testLab}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByTestLabWithPagination(@PathVariable String testLab, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByTestLab(testLab, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by test report number
     */
    @GetMapping("/test-report/{testReportNo}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByTestReportNo(@PathVariable String testReportNo) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByTestReportNo(testReportNo);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by test report number with pagination
     */
    @GetMapping("/test-report/{testReportNo}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByTestReportNoWithPagination(@PathVariable String testReportNo, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByTestReportNo(testReportNo, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate authority
     */
    @GetMapping("/certificate-authority/{certificateAuthority}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByCertificateAuthority(@PathVariable String certificateAuthority) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateAuthority(certificateAuthority);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate authority with pagination
     */
    @GetMapping("/certificate-authority/{certificateAuthority}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByCertificateAuthorityWithPagination(@PathVariable String certificateAuthority, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateAuthority(certificateAuthority, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate reference
     */
    @GetMapping("/certificate-reference/{certificateReference}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByCertificateReference(@PathVariable String certificateReference) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateReference(certificateReference);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate reference with pagination
     */
    @GetMapping("/certificate-reference/{certificateReference}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByCertificateReferenceWithPagination(@PathVariable String certificateReference, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateReference(certificateReference, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date
     */
    @GetMapping("/certificate-expiry/{certificateExpiry}")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByCertificateExpiry(@PathVariable LocalDateTime certificateExpiry) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateExpiry(certificateExpiry);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date with pagination
     */
    @GetMapping("/certificate-expiry/{certificateExpiry}/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByCertificateExpiryWithPagination(@PathVariable LocalDateTime certificateExpiry, Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateExpiry(certificateExpiry, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date range
     */
    @GetMapping("/certificate-expiry-range")
    public ResponseEntity<List<RoHSREACHDto>> getRoHSREACHByCertificateExpiryRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateExpiryRange(startDate, endDate);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Get RoHS/REACH certificates by certificate expiry date range with pagination
     */
    @GetMapping("/certificate-expiry-range/page")
    public ResponseEntity<Page<RoHSREACHDto>> getRoHSREACHByCertificateExpiryRangeWithPagination(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<RoHSREACHDto> rohsREACH = rohsREACHService.getRoHSREACHByCertificateExpiryRange(startDate, endDate, pageable);
        return ResponseEntity.ok(rohsREACH);
    }
    
    /**
     * Update RoHS/REACH certificate
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoHSREACHDto> updateRoHSREACH(@PathVariable Long id, @RequestBody RoHSREACHPayload payload) {
        Optional<RoHSREACHDto> updatedRoHSREACH = rohsREACHService.updateRoHSREACH(id, payload);
        return updatedRoHSREACH.map(ResponseEntity::ok)
                              .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Update RoHS/REACH certificate status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<RoHSREACHDto> updateRoHSREACHStatus(@PathVariable Long id, @RequestBody RoHSREACH.Status status) {
        Optional<RoHSREACHDto> updatedRoHSREACH = rohsREACHService.updateRoHSREACHStatus(id, status);
        return updatedRoHSREACH.map(ResponseEntity::ok)
                              .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark RoHS/REACH certificate as generated
     */
    @PutMapping("/{id}/generate")
    public ResponseEntity<RoHSREACHDto> markAsGenerated(@PathVariable Long id, @RequestParam String generatedBy) {
        Optional<RoHSREACHDto> updatedRoHSREACH = rohsREACHService.markAsGenerated(id, generatedBy);
        return updatedRoHSREACH.map(ResponseEntity::ok)
                              .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark RoHS/REACH certificate as sent
     */
    @PutMapping("/{id}/send")
    public ResponseEntity<RoHSREACHDto> markAsSent(@PathVariable Long id, @RequestParam String sentTo) {
        Optional<RoHSREACHDto> updatedRoHSREACH = rohsREACHService.markAsSent(id, sentTo);
        return updatedRoHSREACH.map(ResponseEntity::ok)
                              .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Cancel RoHS/REACH certificate
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<RoHSREACHDto> cancelRoHSREACH(@PathVariable Long id) {
        Optional<RoHSREACHDto> updatedRoHSREACH = rohsREACHService.cancelRoHSREACH(id);
        return updatedRoHSREACH.map(ResponseEntity::ok)
                              .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Delete RoHS/REACH certificate
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoHSREACH(@PathVariable Long id) {
        boolean deleted = rohsREACHService.deleteRoHSREACH(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Count RoHS/REACH certificates by status
     */
    @GetMapping("/count/status/{status}")
    public ResponseEntity<Long> countByStatus(@PathVariable RoHSREACH.Status status) {
        long count = rohsREACHService.countByStatus(status);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by customer
     */
    @GetMapping("/count/customer/{customer}")
    public ResponseEntity<Long> countByCustomer(@PathVariable String customer) {
        long count = rohsREACHService.countByCustomer(customer);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by generated by user
     */
    @GetMapping("/count/generated-by/{generatedBy}")
    public ResponseEntity<Long> countByGeneratedBy(@PathVariable String generatedBy) {
        long count = rohsREACHService.countByGeneratedBy(generatedBy);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by sent to user
     */
    @GetMapping("/count/sent-to/{sentTo}")
    public ResponseEntity<Long> countBySentTo(@PathVariable String sentTo) {
        long count = rohsREACHService.countBySentTo(sentTo);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by carrier
     */
    @GetMapping("/count/carrier/{carrier}")
    public ResponseEntity<Long> countByCarrier(@PathVariable String carrier) {
        long count = rohsREACHService.countByCarrier(carrier);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by AWB
     */
    @GetMapping("/count/awb/{awb}")
    public ResponseEntity<Long> countByAwb(@PathVariable String awb) {
        long count = rohsREACHService.countByAwb(awb);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by RoHS compliance
     */
    @GetMapping("/count/rohs-compliance/{rohsCompliance}")
    public ResponseEntity<Long> countByRohsCompliance(@PathVariable String rohsCompliance) {
        long count = rohsREACHService.countByRohsCompliance(rohsCompliance);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by REACH compliance
     */
    @GetMapping("/count/reach-compliance/{reachCompliance}")
    public ResponseEntity<Long> countByReachCompliance(@PathVariable String reachCompliance) {
        long count = rohsREACHService.countByReachCompliance(reachCompliance);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by compliance officer
     */
    @GetMapping("/count/compliance-officer/{complianceOfficer}")
    public ResponseEntity<Long> countByComplianceOfficer(@PathVariable String complianceOfficer) {
        long count = rohsREACHService.countByComplianceOfficer(complianceOfficer);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by test lab
     */
    @GetMapping("/count/test-lab/{testLab}")
    public ResponseEntity<Long> countByTestLab(@PathVariable String testLab) {
        long count = rohsREACHService.countByTestLab(testLab);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count RoHS/REACH certificates by certificate authority
     */
    @GetMapping("/count/certificate-authority/{certificateAuthority}")
    public ResponseEntity<Long> countByCertificateAuthority(@PathVariable String certificateAuthority) {
        long count = rohsREACHService.countByCertificateAuthority(certificateAuthority);
        return ResponseEntity.ok(count);
    }
}