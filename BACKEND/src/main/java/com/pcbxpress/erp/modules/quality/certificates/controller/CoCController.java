package com.pcbxpress.erp.modules.quality.certificates.controller;

import com.pcbxpress.erp.modules.quality.certificates.dto.CoCDto;
import com.pcbxpress.erp.modules.quality.certificates.dto.CoCPayload;
import com.pcbxpress.erp.modules.quality.certificates.model.CoC;
import com.pcbxpress.erp.modules.quality.certificates.service.CoCService;
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
@RequestMapping("/api/quality/certificates/coc")
@CrossOrigin(origins = "*")
public class CoCController {
    
    @Autowired
    private CoCService cocService;
    
    /**
     * Create a new CoC
     */
    @PostMapping
    public ResponseEntity<CoCDto> createCoC(@RequestBody CoCPayload payload) {
        CoCDto createdCoC = cocService.createCoC(payload);
        return new ResponseEntity<>(createdCoC, HttpStatus.CREATED);
    }
    
    /**
     * Get CoC by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CoCDto> getCoCById(@PathVariable Long id) {
        Optional<CoCDto> coc = cocService.getCoCById(id);
        return coc.map(ResponseEntity::ok)
                 .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get CoC by CoC number
     */
    @GetMapping("/number/{cocNo}")
    public ResponseEntity<CoCDto> getCoCByCocNo(@PathVariable String cocNo) {
        Optional<CoCDto> coc = cocService.getCoCByCocNo(cocNo);
        return coc.map(ResponseEntity::ok)
                 .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all CoCs with pagination
     */
    @GetMapping
    public ResponseEntity<Page<CoCDto>> getAllCoCs(Pageable pageable) {
        Page<CoCDto> coCs = cocService.getAllCoCs(pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by status with pagination
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<CoCDto>> getCoCsByStatus(@PathVariable CoC.Status status, Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByStatus(status, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by customer
     */
    @GetMapping("/customer/{customer}")
    public ResponseEntity<List<CoCDto>> getCoCsByCustomer(@PathVariable String customer) {
        List<CoCDto> coCs = cocService.getCoCsByCustomer(customer);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by customer with pagination
     */
    @GetMapping("/customer/{customer}/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByCustomerWithPagination(@PathVariable String customer, Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByCustomer(customer, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by lot number
     */
    @GetMapping("/lot/{lotNo}")
    public ResponseEntity<List<CoCDto>> getCoCsByLotNo(@PathVariable String lotNo) {
        List<CoCDto> coCs = cocService.getCoCsByLotNo(lotNo);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by work order number
     */
    @GetMapping("/work-order/{workOrderNo}")
    public ResponseEntity<List<CoCDto>> getCoCsByWorkOrderNo(@PathVariable String workOrderNo) {
        List<CoCDto> coCs = cocService.getCoCsByWorkOrderNo(workOrderNo);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by shipment ID
     */
    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<CoCDto>> getCoCsByShipmentId(@PathVariable String shipmentId) {
        List<CoCDto> coCs = cocService.getCoCsByShipmentId(shipmentId);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<CoCDto>> getCoCsByDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<CoCDto> coCs = cocService.getCoCsByDateRange(startDate, endDate);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by date range with pagination
     */
    @GetMapping("/date-range/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByDateRangeWithPagination(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by customer and date range
     */
    @GetMapping("/customer/{customer}/date-range")
    public ResponseEntity<List<CoCDto>> getCoCsByCustomerAndDateRange(
            @PathVariable String customer,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<CoCDto> coCs = cocService.getCoCsByCustomerAndDateRange(customer, startDate, endDate);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by customer and date range with pagination
     */
    @GetMapping("/customer/{customer}/date-range/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByCustomerAndDateRangeWithPagination(
            @PathVariable String customer,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByCustomerAndDateRange(customer, startDate, endDate, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by generated by user
     */
    @GetMapping("/generated-by/{generatedBy}")
    public ResponseEntity<List<CoCDto>> getCoCsByGeneratedBy(@PathVariable String generatedBy) {
        List<CoCDto> coCs = cocService.getCoCsByGeneratedBy(generatedBy);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by generated by user with pagination
     */
    @GetMapping("/generated-by/{generatedBy}/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByGeneratedByWithPagination(@PathVariable String generatedBy, Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByGeneratedBy(generatedBy, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by sent to user
     */
    @GetMapping("/sent-to/{sentTo}")
    public ResponseEntity<List<CoCDto>> getCoCsBySentTo(@PathVariable String sentTo) {
        List<CoCDto> coCs = cocService.getCoCsBySentTo(sentTo);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by sent to user with pagination
     */
    @GetMapping("/sent-to/{sentTo}/page")
    public ResponseEntity<Page<CoCDto>> getCoCsBySentToWithPagination(@PathVariable String sentTo, Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsBySentTo(sentTo, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by carrier
     */
    @GetMapping("/carrier/{carrier}")
    public ResponseEntity<List<CoCDto>> getCoCsByCarrier(@PathVariable String carrier) {
        List<CoCDto> coCs = cocService.getCoCsByCarrier(carrier);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by carrier with pagination
     */
    @GetMapping("/carrier/{carrier}/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByCarrierWithPagination(@PathVariable String carrier, Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByCarrier(carrier, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by AWB
     */
    @GetMapping("/awb/{awb}")
    public ResponseEntity<List<CoCDto>> getCoCsByAwb(@PathVariable String awb) {
        List<CoCDto> coCs = cocService.getCoCsByAwb(awb);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by AWB with pagination
     */
    @GetMapping("/awb/{awb}/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByAwbWithPagination(@PathVariable String awb, Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByAwb(awb, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by ship date
     */
    @GetMapping("/ship-date/{shipDate}")
    public ResponseEntity<List<CoCDto>> getCoCsByShipDate(@PathVariable LocalDateTime shipDate) {
        List<CoCDto> coCs = cocService.getCoCsByShipDate(shipDate);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by ship date with pagination
     */
    @GetMapping("/ship-date/{shipDate}/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByShipDateWithPagination(@PathVariable LocalDateTime shipDate, Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByShipDate(shipDate, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by ship date range
     */
    @GetMapping("/ship-date-range")
    public ResponseEntity<List<CoCDto>> getCoCsByShipDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<CoCDto> coCs = cocService.getCoCsByShipDateRange(startDate, endDate);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Get CoCs by ship date range with pagination
     */
    @GetMapping("/ship-date-range/page")
    public ResponseEntity<Page<CoCDto>> getCoCsByShipDateRangeWithPagination(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate,
            Pageable pageable) {
        Page<CoCDto> coCs = cocService.getCoCsByShipDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(coCs);
    }
    
    /**
     * Update CoC
     */
    @PutMapping("/{id}")
    public ResponseEntity<CoCDto> updateCoC(@PathVariable Long id, @RequestBody CoCPayload payload) {
        Optional<CoCDto> updatedCoC = cocService.updateCoC(id, payload);
        return updatedCoC.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Update CoC status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<CoCDto> updateCoCStatus(@PathVariable Long id, @RequestBody CoC.Status status) {
        Optional<CoCDto> updatedCoC = cocService.updateCoCStatus(id, status);
        return updatedCoC.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark CoC as generated
     */
    @PutMapping("/{id}/generate")
    public ResponseEntity<CoCDto> markAsGenerated(@PathVariable Long id, @RequestParam String generatedBy) {
        Optional<CoCDto> updatedCoC = cocService.markAsGenerated(id, generatedBy);
        return updatedCoC.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark CoC as sent
     */
    @PutMapping("/{id}/send")
    public ResponseEntity<CoCDto> markAsSent(@PathVariable Long id, @RequestParam String sentTo) {
        Optional<CoCDto> updatedCoC = cocService.markAsSent(id, sentTo);
        return updatedCoC.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Cancel CoC
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<CoCDto> cancelCoC(@PathVariable Long id) {
        Optional<CoCDto> updatedCoC = cocService.cancelCoC(id);
        return updatedCoC.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Delete CoC
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoC(@PathVariable Long id) {
        boolean deleted = cocService.deleteCoC(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Count CoCs by status
     */
    @GetMapping("/count/status/{status}")
    public ResponseEntity<Long> countByStatus(@PathVariable CoC.Status status) {
        long count = cocService.countByStatus(status);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count CoCs by customer
     */
    @GetMapping("/count/customer/{customer}")
    public ResponseEntity<Long> countByCustomer(@PathVariable String customer) {
        long count = cocService.countByCustomer(customer);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count CoCs by generated by user
     */
    @GetMapping("/count/generated-by/{generatedBy}")
    public ResponseEntity<Long> countByGeneratedBy(@PathVariable String generatedBy) {
        long count = cocService.countByGeneratedBy(generatedBy);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count CoCs by sent to user
     */
    @GetMapping("/count/sent-to/{sentTo}")
    public ResponseEntity<Long> countBySentTo(@PathVariable String sentTo) {
        long count = cocService.countBySentTo(sentTo);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count CoCs by carrier
     */
    @GetMapping("/count/carrier/{carrier}")
    public ResponseEntity<Long> countByCarrier(@PathVariable String carrier) {
        long count = cocService.countByCarrier(carrier);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Count CoCs by AWB
     */
    @GetMapping("/count/awb/{awb}")
    public ResponseEntity<Long> countByAwb(@PathVariable String awb) {
        long count = cocService.countByAwb(awb);
        return ResponseEntity.ok(count);
    }
}