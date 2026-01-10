package com.pcbxpress.erp.modules.production.dto;

import com.pcbxpress.erp.modules.production.model.MachineCapacity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Payload DTO for creating and updating Machine Capacity
 */
public record MachineCapacityPayload(
    String machineId,
    String machineName,
    String machineType,
    LocalDate date,
    MachineCapacity.Shift shift,
    OffsetDateTime shiftStart,
    OffsetDateTime shiftEnd,
    BigDecimal plannedHours,
    BigDecimal availableHours,
    BigDecimal utilizationPercentage,
    MachineCapacity.Status status,
    String workOrderId,
    String operationId,
    Integer assignedQuantity,
    Integer completedQuantity,
    BigDecimal setupTimeMinutes,
    BigDecimal downtimeMinutes,
    BigDecimal maintenanceHours,
    BigDecimal breakdownHours,
    BigDecimal oeeAvailability,
    BigDecimal oeePerformance,
    BigDecimal oeeQuality,
    BigDecimal oeeOverall,
    String capacityNotes,
    String maintenanceNotes,
    String performanceNotes
) {
}