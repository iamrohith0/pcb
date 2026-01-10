package com.pcbxpress.erp.modules.logistics.dispatch.service;

import com.pcbxpress.erp.modules.logistics.dispatch.dto.DispatchDto;
import com.pcbxpress.erp.modules.logistics.dispatch.dto.DispatchPayload;
import com.pcbxpress.erp.modules.logistics.dispatch.model.Dispatch;
import com.pcbxpress.erp.modules.logistics.dispatch.repository.DispatchRepository;
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
 * Service for managing Dispatches
 */
@Service
@Transactional
public class DispatchService {
    
    private final DispatchRepository dispatchRepository;
    
    public DispatchService(DispatchRepository dispatchRepository) {
        this.dispatchRepository = dispatchRepository;
    }
    
    /**
     * List dispatches with optional filters
     */
    public List<DispatchDto> list(String query, UUID orderId, UUID customerId, UUID warehouseId, 
                                UUID carrierId, Dispatch.DispatchStatus status, Dispatch.Priority priority, 
                                Dispatch.DispatchType dispatchType, OffsetDateTime startDate, OffsetDateTime endDate) {
        return dispatchRepository.findByCriteria(orderId, customerId, warehouseId, carrierId, status, priority, dispatchType, query).stream()
            .filter(dispatch -> {
                if (startDate != null && endDate != null) {
                    return dispatch.getDispatchDate() != null && 
                           dispatch.getDispatchDate().isAfter(startDate) && 
                           dispatch.getDispatchDate().isBefore(endDate);
                }
                return true;
            })
            .sorted(Comparator.comparing(Dispatch::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * List dispatches with pagination
     */
    public Page<DispatchDto> listWithPagination(String query, UUID orderId, UUID customerId, UUID warehouseId, 
                                              UUID carrierId, Dispatch.DispatchStatus status, Dispatch.Priority priority, 
                                              Dispatch.DispatchType dispatchType, OffsetDateTime startDate, OffsetDateTime endDate,
                                              Pageable pageable) {
        Page<Dispatch> dispatches;
        
        if (startDate != null && endDate != null) {
            dispatches = dispatchRepository.findDispatchesByDispatchDateRange(startDate, endDate, pageable);
        } else {
            // For pagination, we need to filter manually since the custom query doesn't support Pageable
            List<Dispatch> allDispatches = dispatchRepository.findByCriteria(orderId, customerId, warehouseId, carrierId, status, priority, dispatchType, query);
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allDispatches.size());
            List<Dispatch> pagedDispatches = allDispatches.subList(start, end);
            List<DispatchDto> dtoList = pagedDispatches.stream().map(this::toDto).collect(Collectors.toList());
            return new PageImpl<>(dtoList, pageable, allDispatches.size());
        }
        
        return dispatches.map(this::toDto);
    }
    
    /**
     * Get a single dispatch by ID
     */
    public DispatchDto get(String id) {
        Dispatch dispatch = dispatchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Dispatch not found: " + id));
        return toDto(dispatch);
    }
    
    /**
     * Create a new dispatch
     */
    public DispatchDto create(DispatchPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Dispatch dispatch = new Dispatch();
        dispatch.setId(UUID.randomUUID());
        applyPayload(dispatch, payload);
        
        // Auto-generate code if not provided
        if (dispatch.getCode() == null || dispatch.getCode().isBlank()) {
            dispatch.setCode(generateDispatchCode());
        }
        
        // Set default values
        if (dispatch.getStatus() == null) {
            dispatch.setStatus(Dispatch.DispatchStatus.DRAFT);
        }
        
        if (dispatch.getPriority() == null) {
            dispatch.setPriority(Dispatch.Priority.NORMAL);
        }
        
        if (dispatch.getDispatchType() == null) {
            dispatch.setDispatchType(Dispatch.DispatchType.STANDARD);
        }
        
        // Initialize values if not provided
        if (dispatch.getWeight() == null) {
            dispatch.setWeight(BigDecimal.ZERO);
        }
        if (dispatch.getValue() == null) {
            dispatch.setValue(BigDecimal.ZERO);
        }
        if (dispatch.getDimensionsLength() == null) {
            dispatch.setDimensionsLength(BigDecimal.ZERO);
        }
        if (dispatch.getDimensionsWidth() == null) {
            dispatch.setDimensionsWidth(BigDecimal.ZERO);
        }
        if (dispatch.getDimensionsHeight() == null) {
            dispatch.setDimensionsHeight(BigDecimal.ZERO);
        }
        
        Dispatch saved = dispatchRepository.save(dispatch);
        return toDto(saved);
    }
    
    /**
     * Update an existing dispatch
     */
    public DispatchDto update(String id, DispatchPayload payload) {
        Dispatch existing = dispatchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Dispatch not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Dispatch saved = dispatchRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a dispatch
     */
    public void delete(String id) {
        dispatchRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple dispatches
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(DispatchService::parseId).collect(Collectors.toList());
        dispatchRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search dispatches by query
     */
    public List<DispatchDto> search(String query) {
        return dispatchRepository.findByCriteria(null, null, null, null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by order
     */
    public List<DispatchDto> getByOrder(UUID orderId) {
        return dispatchRepository.findByOrderId(orderId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by customer
     */
    public List<DispatchDto> getByCustomer(UUID customerId) {
        return dispatchRepository.findByCustomerId(customerId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by warehouse
     */
    public List<DispatchDto> getByWarehouse(UUID warehouseId) {
        return dispatchRepository.findByWarehouseId(warehouseId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by carrier
     */
    public List<DispatchDto> getByCarrier(UUID carrierId) {
        return dispatchRepository.findByCarrierId(carrierId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by shipment
     */
    public List<DispatchDto> getByShipment(UUID shipmentId) {
        return dispatchRepository.findByShipmentId(shipmentId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by status
     */
    public List<DispatchDto> getByStatus(Dispatch.DispatchStatus status) {
        return dispatchRepository.findByStatus(status).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by priority
     */
    public List<DispatchDto> getByPriority(Dispatch.Priority priority) {
        return dispatchRepository.findByPriority(priority).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by type
     */
    public List<DispatchDto> getByType(Dispatch.DispatchType dispatchType) {
        return dispatchRepository.findByDispatchType(dispatchType).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by tracking number
     */
    public List<DispatchDto> getByTrackingNumber(String trackingNumber) {
        return dispatchRepository.findByTrackingNumber(trackingNumber).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by date range
     */
    public List<DispatchDto> getByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return dispatchRepository.findByDispatchDateBetween(startDate, endDate).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by estimated delivery range
     */
    public List<DispatchDto> getByEstimatedDeliveryRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return dispatchRepository.findByEstimatedDeliveryBetween(startDate, endDate).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatches by actual delivery range
     */
    public List<DispatchDto> getByActualDeliveryRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return dispatchRepository.findByActualDeliveryBetween(startDate, endDate).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Update dispatch status
     */
    public DispatchDto updateStatus(String id, Dispatch.DispatchStatus status) {
        Dispatch dispatch = dispatchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Dispatch not found: " + id));
        
        dispatch.setStatus(status);
        
        // Update timestamps based on status
        if (status == Dispatch.DispatchStatus.DISPATCHED) {
            dispatch.setDispatchDate(OffsetDateTime.now());
        } else if (status == Dispatch.DispatchStatus.DELIVERED) {
            dispatch.setActualDelivery(OffsetDateTime.now());
        }
        
        Dispatch saved = dispatchRepository.save(dispatch);
        return toDto(saved);
    }
    
    /**
     * Update dispatch tracking information
     */
    public DispatchDto updateTracking(String id, String trackingNumber, OffsetDateTime estimatedDelivery) {
        Dispatch dispatch = dispatchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Dispatch not found: " + id));
        
        dispatch.setTrackingNumber(trackingNumber);
        if (estimatedDelivery != null) {
            dispatch.setEstimatedDelivery(estimatedDelivery);
        }
        
        Dispatch saved = dispatchRepository.save(dispatch);
        return toDto(saved);
    }
    
    /**
     * Update dispatch delivery information
     */
    public DispatchDto updateDelivery(String id, OffsetDateTime actualDelivery, String receivedBy) {
        Dispatch dispatch = dispatchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Dispatch not found: " + id));
        
        dispatch.setActualDelivery(actualDelivery);
        dispatch.setReceivedBy(receivedBy);
        dispatch.setStatus(Dispatch.DispatchStatus.DELIVERED);
        
        Dispatch saved = dispatchRepository.save(dispatch);
        return toDto(saved);
    }
    
    /**
     * Assign carrier to dispatch
     */
    public DispatchDto assignCarrier(String id, UUID carrierId, String carrierName) {
        Dispatch dispatch = dispatchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Dispatch not found: " + id));
        
        dispatch.setCarrierId(carrierId);
        dispatch.setCarrierName(carrierName);
        
        Dispatch saved = dispatchRepository.save(dispatch);
        return toDto(saved);
    }
    
    /**
     * Mark dispatch as dispatched
     */
    public DispatchDto markAsDispatched(String id, String dispatchedBy) {
        Dispatch dispatch = dispatchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Dispatch not found: " + id));
        
        dispatch.setDispatchedBy(dispatchedBy);
        dispatch.setStatus(Dispatch.DispatchStatus.DISPATCHED);
        dispatch.setDispatchDate(OffsetDateTime.now());
        
        Dispatch saved = dispatchRepository.save(dispatch);
        return toDto(saved);
    }
    
    /**
     * Get dispatch history for an order
     */
    public List<DispatchDto> getDispatchHistory(UUID orderId, String status, OffsetDateTime startDate, OffsetDateTime endDate) {
        List<Dispatch> dispatches = dispatchRepository.findByOrderId(orderId);
        
        if (status != null) {
            dispatches = dispatches.stream()
                .filter(d -> d.getStatus().toString().equalsIgnoreCase(status))
                .collect(Collectors.toList());
        }
        
        if (startDate != null && endDate != null) {
            dispatches = dispatches.stream()
                .filter(d -> d.getDispatchDate() != null && 
                           d.getDispatchDate().isAfter(startDate) && 
                           d.getDispatchDate().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        return dispatches.stream()
            .sorted(Comparator.comparing(Dispatch::getDispatchDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get dispatch report data
     */
    public Map<String, Object> getDispatchReport(String status, OffsetDateTime startDate, OffsetDateTime endDate) {
        List<Dispatch> all = dispatchRepository.findAll();
        
        if (status != null) {
            all = all.stream()
                .filter(d -> d.getStatus().toString().equalsIgnoreCase(status))
                .collect(Collectors.toList());
        }
        
        if (startDate != null && endDate != null) {
            all = all.stream()
                .filter(d -> d.getDispatchDate() != null && 
                           d.getDispatchDate().isAfter(startDate) && 
                           d.getDispatchDate().isBefore(endDate))
                .collect(Collectors.toList());
        }
        
        long total = all.size();
        long draft = all.stream().filter(d -> d.getStatus() == Dispatch.DispatchStatus.DRAFT).count();
        long pending = all.stream().filter(d -> d.getStatus() == Dispatch.DispatchStatus.PENDING).count();
        long dispatched = all.stream().filter(d -> d.getStatus() == Dispatch.DispatchStatus.DISPATCHED).count();
        long inTransit = all.stream().filter(d -> d.getStatus() == Dispatch.DispatchStatus.IN_TRANSIT).count();
        long delivered = all.stream().filter(d -> d.getStatus() == Dispatch.DispatchStatus.DELIVERED).count();
        long cancelled = all.stream().filter(d -> d.getStatus() == Dispatch.DispatchStatus.CANCELLED).count();
        long returned = all.stream().filter(d -> d.getStatus() == Dispatch.DispatchStatus.RETURNED).count();
        long highPriority = all.stream().filter(d -> d.getPriority() == Dispatch.Priority.HIGH).count();
        long urgent = all.stream().filter(d -> d.getPriority() == Dispatch.Priority.URGENT).count();
        long standard = all.stream().filter(d -> d.getDispatchType() == Dispatch.DispatchType.STANDARD).count();
        long express = all.stream().filter(d -> d.getDispatchType() == Dispatch.DispatchType.EXPRESS).count();
        long overnight = all.stream().filter(d -> d.getDispatchType() == Dispatch.DispatchType.OVERNIGHT).count();
        long freight = all.stream().filter(d -> d.getDispatchType() == Dispatch.DispatchType.FREIGHT).count();
        
        // Count by warehouse
        Map<String, Long> byWarehouse = all.stream()
            .filter(d -> d.getWarehouseName() != null)
            .collect(Collectors.groupingBy(Dispatch::getWarehouseName, Collectors.counting()));
        
        // Count by customer
        Map<String, Long> byCustomer = all.stream()
            .filter(d -> d.getCustomerName() != null)
            .collect(Collectors.groupingBy(Dispatch::getCustomerName, Collectors.counting()));
        
        // Count by carrier
        Map<String, Long> byCarrier = all.stream()
            .filter(d -> d.getCarrierName() != null)
            .collect(Collectors.groupingBy(Dispatch::getCarrierName, Collectors.counting()));
        
        // Calculate completion rate
        double completionRate = total > 0 ? (double) delivered / total * 100 : 0.0;
        
        // Calculate average delivery time
        double avgDeliveryTime = 0.0;
        if (delivered > 0) {
            long totalDays = all.stream()
                .filter(d -> d.getDispatchDate() != null && d.getActualDelivery() != null)
                .mapToLong(d -> java.time.Duration.between(d.getDispatchDate(), d.getActualDelivery()).toDays())
                .sum();
            avgDeliveryTime = delivered > 0 ? (double) totalDays / delivered : 0.0;
        }
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("draft", draft),
            Map.entry("pending", pending),
            Map.entry("dispatched", dispatched),
            Map.entry("inTransit", inTransit),
            Map.entry("delivered", delivered),
            Map.entry("cancelled", cancelled),
            Map.entry("returned", returned),
            Map.entry("highPriority", highPriority),
            Map.entry("urgent", urgent),
            Map.entry("standard", standard),
            Map.entry("express", express),
            Map.entry("overnight", overnight),
            Map.entry("freight", freight),
            Map.entry("completionRate", Math.round(completionRate)),
            Map.entry("avgDeliveryTime", Math.round(avgDeliveryTime)),
            Map.entry("byWarehouse", byWarehouse),
            Map.entry("byCustomer", byCustomer),
            Map.entry("byCarrier", byCarrier)
        );
    }
    
    /**
     * Get upcoming dispatches
     */
    public List<DispatchDto> getUpcomingDispatches(OffsetDateTime startDate, OffsetDateTime endDate, Dispatch.DispatchStatus status) {
        List<Dispatch> dispatches = dispatchRepository.findByEstimatedDeliveryBetween(startDate, endDate);
        
        if (status != null) {
            dispatches = dispatches.stream()
                .filter(d -> d.getStatus() == status)
                .collect(Collectors.toList());
        }
        
        return dispatches.stream()
            .sorted(Comparator.comparing(Dispatch::getEstimatedDelivery, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Export dispatches to CSV format
     */
    public String exportCsv(List<DispatchDto> data) {
        String header = "Code,Description,Order,Customer,Warehouse,Carrier,Tracking Number,Shipment,Dispatch Date,Estimated Delivery,Actual Delivery,Status,Priority,Type,Weight,Value,Currency,Dimensions,Dispatched By,Received By";
        String rows = data.stream()
            .map(dispatch -> String.join(",",
                safe(dispatch.code()),
                safe(dispatch.description()),
                safe(dispatch.orderCode()),
                safe(dispatch.customerName()),
                safe(dispatch.warehouseName()),
                safe(dispatch.carrierName()),
                safe(dispatch.trackingNumber()),
                safe(dispatch.shipmentCode()),
                safe(dispatch.dispatchDate() != null ? dispatch.dispatchDate().toString() : ""),
                safe(dispatch.estimatedDelivery() != null ? dispatch.estimatedDelivery().toString() : ""),
                safe(dispatch.actualDelivery() != null ? dispatch.actualDelivery().toString() : ""),
                safe(dispatch.status() != null ? dispatch.status().toString() : ""),
                safe(dispatch.priority() != null ? dispatch.priority().toString() : ""),
                safe(dispatch.dispatchType() != null ? dispatch.dispatchType().toString() : ""),
                safe(dispatch.weight() != null ? dispatch.weight().toString() : ""),
                safe(dispatch.value() != null ? dispatch.value().toString() : ""),
                safe(dispatch.currency()),
                safe(getDimensionsString(dispatch)),
                safe(dispatch.dispatchedBy()),
                safe(dispatch.receivedBy())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Dispatch not found: " + id);
        }
    }
    
    private static String generateDispatchCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "DISP-" + token;
    }
    
    private void validateUniqueConstraints(DispatchPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate code
        if (payload.code() != null && !payload.code().isBlank()) {
            boolean exists = dispatchRepository.existsByCodeIgnoreCaseAndIdNot(payload.code(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Dispatch code already exists: " + payload.code());
            }
        }
        
        // Check for duplicate tracking number
        if (payload.trackingNumber() != null && !payload.trackingNumber().isBlank()) {
            List<Dispatch> existing = dispatchRepository.findByTrackingNumber(payload.trackingNumber());
            if (!existing.isEmpty() && (existingId == null || !existing.get(0).getId().toString().equals(existingId))) {
                throw new IllegalArgumentException("Tracking number already exists: " + payload.trackingNumber());
            }
        }
    }
    
    private void applyPayload(Dispatch target, DispatchPayload payload) {
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
        target.setShipmentId(payload.shipmentId());
        target.setShipmentCode(payload.shipmentCode());
        target.setDispatchDate(payload.dispatchDate());
        target.setEstimatedDelivery(payload.estimatedDelivery());
        target.setActualDelivery(payload.actualDelivery());
        target.setStatus(payload.status());
        target.setPriority(payload.priority());
        target.setDispatchType(payload.dispatchType());
        target.setWeight(payload.weight());
        target.setWeightUnit(payload.weightUnit());
        target.setDimensionsLength(payload.dimensionsLength());
        target.setDimensionsWidth(payload.dimensionsWidth());
        target.setDimensionsHeight(payload.dimensionsHeight());
        target.setDimensionsUnit(payload.dimensionsUnit());
        target.setValue(payload.value());
        target.setCurrency(payload.currency());
        target.setNotes(payload.notes());
        target.setDispatchedBy(payload.dispatchedBy());
        target.setReceivedBy(payload.receivedBy());
    }
    
    private DispatchDto toDto(Dispatch dispatch) {
        return new DispatchDto(
            dispatch.getId().toString(),
            dispatch.getCode(),
            dispatch.getDescription(),
            dispatch.getOrderId(),
            dispatch.getOrderCode(),
            dispatch.getCustomerId(),
            dispatch.getCustomerName(),
            dispatch.getWarehouseId(),
            dispatch.getWarehouseName(),
            dispatch.getCarrierId(),
            dispatch.getCarrierName(),
            dispatch.getTrackingNumber(),
            dispatch.getShipmentId(),
            dispatch.getShipmentCode(),
            safeOffset(dispatch.getDispatchDate()),
            safeOffset(dispatch.getEstimatedDelivery()),
            safeOffset(dispatch.getActualDelivery()),
            dispatch.getStatus(),
            dispatch.getPriority(),
            dispatch.getDispatchType(),
            dispatch.getWeight(),
            dispatch.getWeightUnit(),
            dispatch.getDimensionsLength(),
            dispatch.getDimensionsWidth(),
            dispatch.getDimensionsHeight(),
            dispatch.getDimensionsUnit(),
            dispatch.getValue(),
            dispatch.getCurrency(),
            dispatch.getNotes(),
            safeOffset(dispatch.getCreatedAt()),
            safeOffset(dispatch.getUpdatedAt()),
            dispatch.getDispatchedBy(),
            dispatch.getReceivedBy()
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static String getDimensionsString(DispatchDto dispatch) {
        if (dispatch.dimensionsLength() == null || dispatch.dimensionsWidth() == null || dispatch.dimensionsHeight() == null) {
            return "";
        }
        return String.format("%s x %s x %s %s", 
            dispatch.dimensionsLength(), dispatch.dimensionsWidth(), dispatch.dimensionsHeight(), 
            dispatch.dimensionsUnit() != null ? dispatch.dimensionsUnit() : "");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}