package com.pcbxpress.erp.modules.logistics.shipments.service;

import com.pcbxpress.erp.modules.logistics.shipments.dto.ShipmentDto;
import com.pcbxpress.erp.modules.logistics.shipments.dto.ShipmentPayload;
import com.pcbxpress.erp.modules.logistics.shipments.model.Shipment;
import com.pcbxpress.erp.modules.logistics.shipments.repository.ShipmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing Shipments
 */
@Service
@Transactional
public class ShipmentService {
    
    private final ShipmentRepository shipmentRepository;
    
    public ShipmentService(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }
    
    /**
     * List shipments with optional filters
     */
    public List<ShipmentDto> list(String query, UUID orderId, UUID customerId, UUID warehouseId, 
                                UUID carrierId, Shipment.ShipmentStatus status, Shipment.Priority priority, 
                                Shipment.ShipmentType shipmentType, Shipment.ServiceLevel serviceLevel,
                                OffsetDateTime startDate, OffsetDateTime endDate) {
        return shipmentRepository.findByCriteria(orderId, customerId, warehouseId, carrierId, status, priority, shipmentType, serviceLevel, query).stream()
            .filter(shipment -> {
                if (startDate != null && endDate != null) {
                    return shipment.getShipmentDate() != null && 
                           shipment.getShipmentDate().isAfter(startDate) && 
                           shipment.getShipmentDate().isBefore(endDate);
                }
                return true;
            })
            .sorted(Comparator.comparing(Shipment::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * List shipments with pagination
     */
    public Page<ShipmentDto> listWithPagination(String query, UUID orderId, UUID customerId, UUID warehouseId, 
                                              UUID carrierId, Shipment.ShipmentStatus status, Shipment.Priority priority, 
                                              Shipment.ShipmentType shipmentType, Shipment.ServiceLevel serviceLevel,
                                              OffsetDateTime startDate, OffsetDateTime endDate, Pageable pageable) {
        Page<Shipment> shipments;
        
        if (startDate != null && endDate != null) {
            shipments = shipmentRepository.findShipmentsByShipmentDateRange(startDate, endDate, pageable);
        } else {
            List<Shipment> allShipments = shipmentRepository.findByCriteria(orderId, customerId, warehouseId, carrierId, status, priority, shipmentType, serviceLevel, query);
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allShipments.size());
            List<Shipment> pagedShipments = allShipments.subList(start, end);
            List<ShipmentDto> dtoList = pagedShipments.stream().map(this::toDto).collect(Collectors.toList());
            return new PageImpl<>(dtoList, pageable, allShipments.size());
        }
        
        return shipments.map(this::toDto);
    }
    
    /**
     * Get a single shipment by ID
     */
    public ShipmentDto get(String id) {
        Shipment shipment = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        return toDto(shipment);
    }
    
    /**
     * Create a new shipment
     */
    public ShipmentDto create(ShipmentPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Shipment shipment = new Shipment();
        shipment.setId(UUID.randomUUID());
        applyPayload(shipment, payload);
        
        // Auto-generate code if not provided
        if (shipment.getCode() == null || shipment.getCode().isBlank()) {
            shipment.setCode(generateShipmentCode());
        }
        
        // Set default values
        if (shipment.getStatus() == null) {
            shipment.setStatus(Shipment.ShipmentStatus.DRAFT);
        }
        
        if (shipment.getPriority() == null) {
            shipment.setPriority(Shipment.Priority.NORMAL);
        }
        
        if (shipment.getShipmentType() == null) {
            shipment.setShipmentType(Shipment.ShipmentType.DOMESTIC);
        }
        
        if (shipment.getServiceLevel() == null) {
            shipment.setServiceLevel(Shipment.ServiceLevel.STANDARD);
        }
        
        // Initialize values if not provided
        if (shipment.getWeight() == null) {
            shipment.setWeight(BigDecimal.ZERO);
        }
        if (shipment.getValue() == null) {
            shipment.setValue(BigDecimal.ZERO);
        }
        if (shipment.getDeclaredValue() == null) {
            shipment.setDeclaredValue(BigDecimal.ZERO);
        }
        if (shipment.getInsuranceValue() == null) {
            shipment.setInsuranceValue(BigDecimal.ZERO);
        }
        if (shipment.getFreightCharge() == null) {
            shipment.setFreightCharge(BigDecimal.ZERO);
        }
        if (shipment.getHandlingCharge() == null) {
            shipment.setHandlingCharge(BigDecimal.ZERO);
        }
        if (shipment.getCustomsCharge() == null) {
            shipment.setCustomsCharge(BigDecimal.ZERO);
        }
        if (shipment.getTotalCharge() == null) {
            shipment.setTotalCharge(BigDecimal.ZERO);
        }
        if (shipment.getPackageCount() == null) {
            shipment.setPackageCount(0);
        }
        if (shipment.getItemCount() == null) {
            shipment.setItemCount(0);
        }
        if (shipment.getDimensionsLength() == null) {
            shipment.setDimensionsLength(BigDecimal.ZERO);
        }
        if (shipment.getDimensionsWidth() == null) {
            shipment.setDimensionsWidth(BigDecimal.ZERO);
        }
        if (shipment.getDimensionsHeight() == null) {
            shipment.setDimensionsHeight(BigDecimal.ZERO);
        }
        
        // Calculate total charge if individual charges are provided
        if (shipment.getFreightCharge().compareTo(BigDecimal.ZERO) > 0 ||
            shipment.getHandlingCharge().compareTo(BigDecimal.ZERO) > 0 ||
            shipment.getCustomsCharge().compareTo(BigDecimal.ZERO) > 0) {
            shipment.setTotalCharge(shipment.getFreightCharge()
                .add(shipment.getHandlingCharge())
                .add(shipment.getCustomsCharge()));
        }
        
        Shipment saved = shipmentRepository.save(shipment);
        return toDto(saved);
    }
    
    /**
     * Update an existing shipment
     */
    public ShipmentDto update(String id, ShipmentPayload payload) {
        Shipment existing = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        // Recalculate total charge if individual charges are provided
        if (existing.getFreightCharge().compareTo(BigDecimal.ZERO) > 0 ||
            existing.getHandlingCharge().compareTo(BigDecimal.ZERO) > 0 ||
            existing.getCustomsCharge().compareTo(BigDecimal.ZERO) > 0) {
            existing.setTotalCharge(existing.getFreightCharge()
                .add(existing.getHandlingCharge())
                .add(existing.getCustomsCharge()));
        }
        
        Shipment saved = shipmentRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a shipment
     */
    public void delete(String id) {
        shipmentRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple shipments
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(ShipmentService::parseId).collect(Collectors.toList());
        shipmentRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search shipments by query
     */
    public List<ShipmentDto> search(String query) {
        return shipmentRepository.findByCriteria(null, null, null, null, null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by order
     */
    public List<ShipmentDto> getByOrder(UUID orderId) {
        return shipmentRepository.findByOrderId(orderId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by customer
     */
    public List<ShipmentDto> getByCustomer(UUID customerId) {
        return shipmentRepository.findByCustomerId(customerId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by warehouse
     */
    public List<ShipmentDto> getByWarehouse(UUID warehouseId) {
        return shipmentRepository.findByWarehouseId(warehouseId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by carrier
     */
    public List<ShipmentDto> getByCarrier(UUID carrierId) {
        return shipmentRepository.findByCarrierId(carrierId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by status
     */
    public List<ShipmentDto> getByStatus(Shipment.ShipmentStatus status) {
        return shipmentRepository.findByStatus(status).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by priority
     */
    public List<ShipmentDto> getByPriority(Shipment.Priority priority) {
        return shipmentRepository.findByPriority(priority).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by type
     */
    public List<ShipmentDto> getByType(Shipment.ShipmentType shipmentType) {
        return shipmentRepository.findByShipmentType(shipmentType).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by service level
     */
    public List<ShipmentDto> getByServiceLevel(Shipment.ServiceLevel serviceLevel) {
        return shipmentRepository.findByServiceLevel(serviceLevel).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by tracking number
     */
    public List<ShipmentDto> getByTrackingNumber(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by date range
     */
    public List<ShipmentDto> getByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return shipmentRepository.findByShipmentDateBetween(startDate, endDate).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by estimated delivery range
     */
    public List<ShipmentDto> getByEstimatedDeliveryRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return shipmentRepository.findByEstimatedDeliveryBetween(startDate, endDate).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipments by actual delivery range
     */
    public List<ShipmentDto> getByActualDeliveryRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return shipmentRepository.findByActualDeliveryBetween(startDate, endDate).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Update shipment status
     */
    public ShipmentDto updateStatus(String id, Shipment.ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        
        shipment.setStatus(status);
        
        // Update timestamps based on status
        if (status == Shipment.ShipmentStatus.SHIPPED) {
            shipment.setShipmentDate(OffsetDateTime.now());
        } else if (status == Shipment.ShipmentStatus.DELIVERED) {
            shipment.setActualDelivery(OffsetDateTime.now());
        }
        
        Shipment saved = shipmentRepository.save(shipment);
        return toDto(saved);
    }
    
    /**
     * Update shipment tracking information
     */
    public ShipmentDto updateTracking(String id, String trackingNumber, OffsetDateTime estimatedDelivery) {
        Shipment shipment = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        
        shipment.setTrackingNumber(trackingNumber);
        if (estimatedDelivery != null) {
            shipment.setEstimatedDelivery(estimatedDelivery);
        }
        
        Shipment saved = shipmentRepository.save(shipment);
        return toDto(saved);
    }
    
    /**
     * Update shipment delivery information
     */
    public ShipmentDto updateDelivery(String id, OffsetDateTime actualDelivery, String receivedBy) {
        Shipment shipment = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        
        shipment.setActualDelivery(actualDelivery);
        shipment.setReceivedBy(receivedBy);
        shipment.setStatus(Shipment.ShipmentStatus.DELIVERED);
        
        Shipment saved = shipmentRepository.save(shipment);
        return toDto(saved);
    }
    
    /**
     * Assign carrier to shipment
     */
    public ShipmentDto assignCarrier(String id, UUID carrierId, String carrierName) {
        Shipment shipment = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        
        shipment.setCarrierId(carrierId);
        shipment.setCarrierName(carrierName);
        
        Shipment saved = shipmentRepository.save(shipment);
        return toDto(saved);
    }
    
    /**
     * Mark shipment as shipped
     */
    public ShipmentDto markAsShipped(String id, String shippedBy) {
        Shipment shipment = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        
        shipment.setShippedBy(shippedBy);
        shipment.setStatus(Shipment.ShipmentStatus.SHIPPED);
        shipment.setShipmentDate(OffsetDateTime.now());
        
        Shipment saved = shipmentRepository.save(shipment);
        return toDto(saved);
    }
    
    /**
     * Update shipment charges
     */
    public ShipmentDto updateCharges(String id, BigDecimal freightCharge, BigDecimal handlingCharge, 
                                   BigDecimal customsCharge, BigDecimal insuranceValue) {
        Shipment shipment = shipmentRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Shipment not found: " + id));
        
        if (freightCharge != null) {
            shipment.setFreightCharge(freightCharge);
        }
        if (handlingCharge != null) {
            shipment.setHandlingCharge(handlingCharge);
        }
        if (customsCharge != null) {
            shipment.setCustomsCharge(customsCharge);
        }
        if (insuranceValue != null) {
            shipment.setInsuranceValue(insuranceValue);
        }
        
        // Recalculate total charge
        shipment.setTotalCharge(shipment.getFreightCharge()
            .add(shipment.getHandlingCharge())
            .add(shipment.getCustomsCharge()));
        
        Shipment saved = shipmentRepository.save(shipment);
        return toDto(saved);
    }
    
    /**
     * Get shipment history for an order
     */
    public List<ShipmentDto> getShipmentHistory(UUID orderId, String status, OffsetDateTime startDate, OffsetDateTime endDate) {
        List<Shipment> shipments = shipmentRepository.findByOrderId(orderId);
        
        if (status != null) {
            shipments = shipments.stream()
                .filter(s -> s.getStatus().toString().equalsIgnoreCase(status))
                .collect(Collectors.toList());
        }
        
        if (startDate != null && endDate != null) {
            shipments = shipments.stream()
                .filter(s -> s.getShipmentDate() != null && 
                           s.getShipmentDate().isAfter(startDate) && 
                           s.getShipmentDate().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        return shipments.stream()
            .sorted(Comparator.comparing(Shipment::getShipmentDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get shipment report data
     */
    public Map<String, Object> getShipmentReport(String status, OffsetDateTime startDate, OffsetDateTime endDate) {
        List<Shipment> all = shipmentRepository.findAll();
        
        if (status != null) {
            all = all.stream()
                .filter(s -> s.getStatus().toString().equalsIgnoreCase(status))
                .collect(Collectors.toList());
        }
        
        if (startDate != null && endDate != null) {
            all = all.stream()
                .filter(s -> s.getShipmentDate() != null && 
                           s.getShipmentDate().isAfter(startDate) && 
                           s.getShipmentDate().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        long total = all.size();
        long draft = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.DRAFT).count();
        long preparing = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.PREPARING).count();
        long picking = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.PICKING).count();
        long packing = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.PACKING).count();
        long readyToShip = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.READY_TO_SHIP).count();
        long shipped = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.SHIPPED).count();
        long inTransit = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.IN_TRANSIT).count();
        long delivered = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.DELIVERED).count();
        long cancelled = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.CANCELLED).count();
        long returned = all.stream().filter(s -> s.getStatus() == Shipment.ShipmentStatus.RETURNED).count();
        long highPriority = all.stream().filter(s -> s.getPriority() == Shipment.Priority.HIGH).count();
        long urgent = all.stream().filter(s -> s.getPriority() == Shipment.Priority.URGENT).count();
        long domestic = all.stream().filter(s -> s.getShipmentType() == Shipment.ShipmentType.DOMESTIC).count();
        long international = all.stream().filter(s -> s.getShipmentType() == Shipment.ShipmentType.INTERNATIONAL).count();
        long express = all.stream().filter(s -> s.getShipmentType() == Shipment.ShipmentType.EXPRESS).count();
        long freight = all.stream().filter(s -> s.getShipmentType() == Shipment.ShipmentType.FREIGHT).count();
        long standard = all.stream().filter(s -> s.getServiceLevel() == Shipment.ServiceLevel.STANDARD).count();
        long expressService = all.stream().filter(s -> s.getServiceLevel() == Shipment.ServiceLevel.EXPRESS).count();
        long overnight = all.stream().filter(s -> s.getServiceLevel() == Shipment.ServiceLevel.OVERNIGHT).count();
        
        // Count by warehouse
        Map<String, Long> byWarehouse = all.stream()
            .filter(s -> s.getWarehouseName() != null)
            .collect(Collectors.groupingBy(Shipment::getWarehouseName, Collectors.counting()));
        
        // Count by customer
        Map<String, Long> byCustomer = all.stream()
            .filter(s -> s.getCustomerName() != null)
            .collect(Collectors.groupingBy(Shipment::getCustomerName, Collectors.counting()));
        
        // Count by carrier
        Map<String, Long> byCarrier = all.stream()
            .filter(s -> s.getCarrierName() != null)
            .collect(Collectors.groupingBy(Shipment::getCarrierName, Collectors.counting()));
        
        // Calculate completion rate
        double completionRate = total > 0 ? (double) delivered / total * 100 : 0.0;
        
        // Calculate average delivery time
        double avgDeliveryTime = 0.0;
        if (delivered > 0) {
            long totalDays = all.stream()
                .filter(s -> s.getShipmentDate() != null && s.getActualDelivery() != null)
                .mapToLong(s -> java.time.Duration.between(s.getShipmentDate(), s.getActualDelivery()).toDays())
                .sum();
            avgDeliveryTime = delivered > 0 ? (double) totalDays / delivered : 0.0;
        }
        
        // Calculate total charges
        double totalFreightCharges = all.stream()
            .mapToDouble(s -> s.getFreightCharge().doubleValue())
            .sum();
        double totalHandlingCharges = all.stream()
            .mapToDouble(s -> s.getHandlingCharge().doubleValue())
            .sum();
        double totalCustomsCharges = all.stream()
            .mapToDouble(s -> s.getCustomsCharge().doubleValue())
            .sum();
        double totalInsuranceValue = all.stream()
            .mapToDouble(s -> s.getInsuranceValue().doubleValue())
            .sum();
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("draft", draft),
            Map.entry("preparing", preparing),
            Map.entry("picking", picking),
            Map.entry("packing", packing),
            Map.entry("readyToShip", readyToShip),
            Map.entry("shipped", shipped),
            Map.entry("inTransit", inTransit),
            Map.entry("delivered", delivered),
            Map.entry("cancelled", cancelled),
            Map.entry("returned", returned),
            Map.entry("highPriority", highPriority),
            Map.entry("urgent", urgent),
            Map.entry("domestic", domestic),
            Map.entry("international", international),
            Map.entry("express", express),
            Map.entry("freight", freight),
            Map.entry("standard", standard),
            Map.entry("expressService", expressService),
            Map.entry("overnight", overnight),
            Map.entry("completionRate", Math.round(completionRate)),
            Map.entry("avgDeliveryTime", Math.round(avgDeliveryTime)),
            Map.entry("totalFreightCharges", totalFreightCharges),
            Map.entry("totalHandlingCharges", totalHandlingCharges),
            Map.entry("totalCustomsCharges", totalCustomsCharges),
            Map.entry("totalInsuranceValue", totalInsuranceValue),
            Map.entry("byWarehouse", byWarehouse),
            Map.entry("byCustomer", byCustomer),
            Map.entry("byCarrier", byCarrier)
        );
    }
    
    /**
     * Get upcoming shipments
     */
    public List<ShipmentDto> getUpcomingShipments(OffsetDateTime startDate, OffsetDateTime endDate, Shipment.ShipmentStatus status) {
        List<Shipment> shipments = shipmentRepository.findByEstimatedDeliveryBetween(startDate, endDate);
        
        if (status != null) {
            shipments = shipments.stream()
                .filter(s -> s.getStatus() == status)
                .collect(Collectors.toList());
        }
        
        return shipments.stream()
            .sorted(Comparator.comparing(Shipment::getEstimatedDelivery, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Export shipments to CSV format
     */
    public String exportCsv(List<ShipmentDto> data) {
        String header = "Code,Description,Order,Customer,Warehouse,Carrier,Tracking Number,Shipment Date,Estimated Delivery,Actual Delivery,Status,Priority,Type,Service Level,Weight,Value,Currency,Package Count,Item Count,Declared Value,Insurance Value,Freight Charge,Handling Charge,Customs Charge,Total Charge,Origin Address,Destination Address,Origin Contact,Destination Contact,Origin Phone,Destination Phone,Shipped By,Received By";
        String rows = data.stream()
            .map(shipment -> String.join(",",
                safe(shipment.code()),
                safe(shipment.description()),
                safe(shipment.orderCode()),
                safe(shipment.customerName()),
                safe(shipment.warehouseName()),
                safe(shipment.carrierName()),
                safe(shipment.trackingNumber()),
                safe(shipment.shipmentDate() != null ? shipment.shipmentDate().toString() : ""),
                safe(shipment.estimatedDelivery() != null ? shipment.estimatedDelivery().toString() : ""),
                safe(shipment.actualDelivery() != null ? shipment.actualDelivery().toString() : ""),
                safe(shipment.status() != null ? shipment.status().toString() : ""),
                safe(shipment.priority() != null ? shipment.priority().toString() : ""),
                safe(shipment.shipmentType() != null ? shipment.shipmentType().toString() : ""),
                safe(shipment.serviceLevel() != null ? shipment.serviceLevel().toString() : ""),
                safe(shipment.weight() != null ? shipment.weight().toString() : ""),
                safe(shipment.value() != null ? shipment.value().toString() : ""),
                safe(shipment.currency()),
                safe(shipment.packageCount() != null ? shipment.packageCount().toString() : ""),
                safe(shipment.itemCount() != null ? shipment.itemCount().toString() : ""),
                safe(shipment.declaredValue() != null ? shipment.declaredValue().toString() : ""),
                safe(shipment.insuranceValue() != null ? shipment.insuranceValue().toString() : ""),
                safe(shipment.freightCharge() != null ? shipment.freightCharge().toString() : ""),
                safe(shipment.handlingCharge() != null ? shipment.handlingCharge().toString() : ""),
                safe(shipment.customsCharge() != null ? shipment.customsCharge().toString() : ""),
                safe(shipment.totalCharge() != null ? shipment.totalCharge().toString() : ""),
                safe(shipment.originAddress()),
                safe(shipment.destinationAddress()),
                safe(shipment.originContact()),
                safe(shipment.destinationContact()),
                safe(shipment.originPhone()),
                safe(shipment.destinationPhone()),
                safe(shipment.shippedBy()),
                safe(shipment.receivedBy())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Shipment not found: " + id);
        }
    }
    
    private static String generateShipmentCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "SHIP-" + token;
    }
    
    private void validateUniqueConstraints(ShipmentPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate code
        if (payload.code() != null && !payload.code().isBlank()) {
            boolean exists = shipmentRepository.existsByCodeIgnoreCaseAndIdNot(payload.code(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Shipment code already exists: " + payload.code());
            }
        }
        
        // Check for duplicate tracking number
        if (payload.trackingNumber() != null && !payload.trackingNumber().isBlank()) {
            List<Shipment> existing = shipmentRepository.findByTrackingNumber(payload.trackingNumber());
            if (!existing.isEmpty() && (existingId == null || !existing.get(0).getId().toString().equals(existingId))) {
                throw new IllegalArgumentException("Tracking number already exists: " + payload.trackingNumber());
            }
        }
    }
    
    private void applyPayload(Shipment target, ShipmentPayload payload) {
        target.setCode(payload.code());
        target.setDescription(payload.description());
        target.setOrderId(payload.orderId());
        target.setOrderCode(payload.orderCode());
        target.setCustomerId(payload.customerId());
        target.setCustomerName(payload.customerName());
        target.setWarehouseId(payload.warehouseId());
        target.setWarehouseName(payload.warehouseName());
        target.setCarrierId(payload.carrierId());
        target.setCarrierName(payload.carrierName());
        target.setTrackingNumber(payload.trackingNumber());
        target.setShipmentDate(payload.shipmentDate());
        target.setEstimatedDelivery(payload.estimatedDelivery());
        target.setActualDelivery(payload.actualDelivery());
        target.setStatus(payload.status());
        target.setPriority(payload.priority());
        target.setShipmentType(payload.shipmentType());
        target.setServiceLevel(payload.serviceLevel());
        target.setWeight(payload.weight());
        target.setWeightUnit(payload.weightUnit());
        target.setDimensionsLength(payload.dimensionsLength());
        target.setDimensionsWidth(payload.dimensionsWidth());
        target.setDimensionsHeight(payload.dimensionsHeight());
        target.setDimensionsUnit(payload.dimensionsUnit());
        target.setValue(payload.value());
        target.setCurrency(payload.currency());
        target.setPackageCount(payload.packageCount());
        target.setItemCount(payload.itemCount());
        target.setDeclaredValue(payload.declaredValue());
        target.setInsuranceValue(payload.insuranceValue());
        target.setFreightCharge(payload.freightCharge());
        target.setHandlingCharge(payload.handlingCharge());
        target.setCustomsCharge(payload.customsCharge());
        target.setTotalCharge(payload.totalCharge());
        target.setOriginAddress(payload.originAddress());
        target.setDestinationAddress(payload.destinationAddress());
        target.setOriginContact(payload.originContact());
        target.setDestinationContact(payload.destinationContact());
        target.setOriginPhone(payload.originPhone());
        target.setDestinationPhone(payload.destinationPhone());
        target.setNotes(payload.notes());
        target.setShippedBy(payload.shippedBy());
        target.setReceivedBy(payload.receivedBy());
    }
    
    private ShipmentDto toDto(Shipment shipment) {
        return new ShipmentDto(
            shipment.getId().toString(),
            shipment.getCode(),
            shipment.getDescription(),
            shipment.getOrderId(),
            shipment.getOrderCode(),
            shipment.getCustomerId(),
            shipment.getCustomerName(),
            shipment.getWarehouseId(),
            shipment.getWarehouseName(),
            shipment.getCarrierId(),
            shipment.getCarrierName(),
            shipment.getTrackingNumber(),
            safeOffset(shipment.getShipmentDate()),
            safeOffset(shipment.getEstimatedDelivery()),
            safeOffset(shipment.getActualDelivery()),
            shipment.getStatus(),
            shipment.getPriority(),
            shipment.getShipmentType(),
            shipment.getServiceLevel(),
            shipment.getWeight(),
            shipment.getWeightUnit(),
            shipment.getDimensionsLength(),
            shipment.getDimensionsWidth(),
            shipment.getDimensionsHeight(),
            shipment.getDimensionsUnit(),
            shipment.getValue(),
            shipment.getCurrency(),
            shipment.getPackageCount(),
            shipment.getItemCount(),
            shipment.getDeclaredValue(),
            shipment.getInsuranceValue(),
            shipment.getFreightCharge(),
            shipment.getHandlingCharge(),
            shipment.getCustomsCharge(),
            shipment.getTotalCharge(),
            shipment.getOriginAddress(),
            shipment.getDestinationAddress(),
            shipment.getOriginContact(),
            shipment.getDestinationContact(),
            shipment.getOriginPhone(),
            shipment.getDestinationPhone(),
            shipment.getNotes(),
            safeOffset(shipment.getCreatedAt()),
            safeOffset(shipment.getUpdatedAt()),
            shipment.getShippedBy(),
            shipment.getReceivedBy()
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}