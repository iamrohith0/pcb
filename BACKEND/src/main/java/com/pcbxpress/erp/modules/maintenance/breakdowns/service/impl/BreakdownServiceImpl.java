package com.pcbxpress.erp.modules.maintenance.breakdowns.service.impl;

import com.pcbxpress.erp.modules.maintenance.breakdowns.dto.BreakdownDto;
import com.pcbxpress.erp.modules.maintenance.breakdowns.dto.BreakdownPayload;
import com.pcbxpress.erp.modules.maintenance.breakdowns.model.Breakdown;
import com.pcbxpress.erp.modules.maintenance.breakdowns.repository.BreakdownRepository;
import com.pcbxpress.erp.modules.maintenance.breakdowns.service.BreakdownService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of BreakdownService
 */
@Service
public class BreakdownServiceImpl implements BreakdownService {

    @Autowired
    private BreakdownRepository breakdownRepository;

    @Override
    public BreakdownDto createBreakdown(BreakdownPayload payload) {
        Breakdown breakdown = new Breakdown();
        breakdown.setEquipmentId(payload.getEquipmentId());
        breakdown.setEquipmentCode(payload.getEquipmentCode());
        breakdown.setEquipmentName(payload.getEquipmentName());
        breakdown.setStartTime(payload.getStartTime());
        breakdown.setEndTime(payload.getEndTime());
        breakdown.setBreakdownType(payload.getBreakdownType());
        breakdown.setDescription(payload.getDescription());
        breakdown.setSeverity(payload.getSeverity());
        breakdown.setStatus(payload.getStatus());
        breakdown.setAssignedTo(payload.getAssignedTo());
        breakdown.setReportedBy(payload.getReportedBy());
        breakdown.setReportedAt(payload.getReportedAt());
        breakdown.setResolution(payload.getResolution());
        breakdown.setRootCause(payload.getRootCause());
        breakdown.setDowntimeMinutes(payload.getDowntimeMinutes());
        breakdown.setCreatedAt(LocalDateTime.now());
        breakdown.setUpdatedAt(LocalDateTime.now());

        Breakdown savedBreakdown = breakdownRepository.save(breakdown);
        return convertToDto(savedBreakdown);
    }

    @Override
    public BreakdownDto updateBreakdown(UUID id, BreakdownPayload payload) {
        Breakdown existingBreakdown = breakdownRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Breakdown not found with id: " + id));

        existingBreakdown.setEquipmentId(payload.getEquipmentId());
        existingBreakdown.setEquipmentCode(payload.getEquipmentCode());
        existingBreakdown.setEquipmentName(payload.getEquipmentName());
        existingBreakdown.setStartTime(payload.getStartTime());
        existingBreakdown.setEndTime(payload.getEndTime());
        existingBreakdown.setBreakdownType(payload.getBreakdownType());
        existingBreakdown.setDescription(payload.getDescription());
        existingBreakdown.setSeverity(payload.getSeverity());
        existingBreakdown.setStatus(payload.getStatus());
        existingBreakdown.setAssignedTo(payload.getAssignedTo());
        existingBreakdown.setReportedBy(payload.getReportedBy());
        existingBreakdown.setReportedAt(payload.getReportedAt());
        existingBreakdown.setResolution(payload.getResolution());
        existingBreakdown.setRootCause(payload.getRootCause());
        existingBreakdown.setDowntimeMinutes(payload.getDowntimeMinutes());
        existingBreakdown.setUpdatedAt(LocalDateTime.now());

        Breakdown updatedBreakdown = breakdownRepository.save(existingBreakdown);
        return convertToDto(updatedBreakdown);
    }

    @Override
    public BreakdownDto getBreakdownById(UUID id) {
        Breakdown breakdown = breakdownRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Breakdown not found with id: " + id));
        return convertToDto(breakdown);
    }

    @Override
    public List<BreakdownDto> getAllBreakdowns() {
        List<Breakdown> breakdowns = breakdownRepository.findAll();
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<BreakdownDto> getAllBreakdowns(Pageable pageable) {
        return breakdownRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    @Override
    public void deleteBreakdown(UUID id) {
        if (!breakdownRepository.existsById(id)) {
            throw new RuntimeException("Breakdown not found with id: " + id);
        }
        breakdownRepository.deleteById(id);
    }

    @Override
    public List<BreakdownDto> findByEquipmentId(UUID equipmentId) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentId(equipmentId);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentCode(String equipmentCode) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentCode(equipmentCode);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByStatus(String status) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatus(status);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByBreakdownType(String breakdownType) {
        List<Breakdown> breakdowns = breakdownRepository.findByBreakdownType(breakdownType);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findBySeverity(String severity) {
        List<Breakdown> breakdowns = breakdownRepository.findBySeverity(severity);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByAssignedTo(String assignedTo) {
        List<Breakdown> breakdowns = breakdownRepository.findByAssignedTo(assignedTo);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByReportedBy(String reportedBy) {
        List<Breakdown> breakdowns = breakdownRepository.findByReportedBy(reportedBy);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByStartTimeBetween(LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStartTimeBetween(startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatus(UUID equipmentId, String status) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatus(equipmentId, status);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndBreakdownType(UUID equipmentId, String breakdownType) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndBreakdownType(equipmentId, breakdownType);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndSeverity(UUID equipmentId, String severity) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndSeverity(equipmentId, severity);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndAssignedTo(UUID equipmentId, String assignedTo) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndAssignedTo(equipmentId, assignedTo);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndReportedBy(UUID equipmentId, String reportedBy) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndReportedBy(equipmentId, reportedBy);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStartTimeBetween(UUID equipmentId, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStartTimeBetween(equipmentId, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByStatusAndStartTimeBetween(String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndStartTimeBetween(status, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByBreakdownTypeAndStartTimeBetween(String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByBreakdownTypeAndStartTimeBetween(breakdownType, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findBySeverityAndStartTimeBetween(String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findBySeverityAndStartTimeBetween(severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByAssignedToAndStartTimeBetween(String assignedTo, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByAssignedToAndStartTimeBetween(assignedTo, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByReportedByAndStartTimeBetween(String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByReportedByAndStartTimeBetween(reportedBy, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndStartTimeBetween(UUID equipmentId, String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndStartTimeBetween(equipmentId, status, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndBreakdownTypeAndStartTimeBetween(UUID equipmentId, String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndBreakdownTypeAndStartTimeBetween(equipmentId, breakdownType, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndSeverityAndStartTimeBetween(UUID equipmentId, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndSeverityAndStartTimeBetween(equipmentId, severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndAssignedToAndStartTimeBetween(UUID equipmentId, String assignedTo, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndAssignedToAndStartTimeBetween(equipmentId, assignedTo, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndReportedByAndStartTimeBetween(UUID equipmentId, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndReportedByAndStartTimeBetween(equipmentId, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByStatusAndBreakdownTypeAndStartTimeBetween(String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndBreakdownTypeAndStartTimeBetween(status, breakdownType, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByStatusAndSeverityAndStartTimeBetween(String status, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndSeverityAndStartTimeBetween(status, severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByBreakdownTypeAndSeverityAndStartTimeBetween(String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByBreakdownTypeAndSeverityAndStartTimeBetween(breakdownType, severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByAssignedToAndReportedByAndStartTimeBetween(String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByAssignedToAndReportedByAndStartTimeBetween(assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndStartTimeBetween(equipmentId, status, breakdownType, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndSeverityAndStartTimeBetween(UUID equipmentId, String status, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndSeverityAndStartTimeBetween(equipmentId, status, severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndBreakdownTypeAndSeverityAndStartTimeBetween(UUID equipmentId, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndBreakdownTypeAndSeverityAndStartTimeBetween(equipmentId, breakdownType, severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndAssignedToAndReportedByAndStartTimeBetween(UUID equipmentId, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(status, breakdownType, severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByAssignedToAndReportedByAndStatusAndStartTimeBetween(String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByAssignedToAndReportedByAndStatusAndStartTimeBetween(assignedTo, reportedBy, status, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(equipmentId, status, breakdownType, severity, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndAssignedToAndReportedByAndStatusAndStartTimeBetween(UUID equipmentId, String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndAssignedToAndReportedByAndStatusAndStartTimeBetween(equipmentId, assignedTo, reportedBy, status, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndReportedByAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, LocalDateTime startDate, LocalDateTime endDate) {
        // This method is not implemented in the repository, so we'll filter manually
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .filter(b -> resolution == null || resolution.equals(b.getResolution()))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndRootCauseAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String rootCause, LocalDateTime startDate, LocalDateTime endDate) {
        // This method is not implemented in the repository, so we'll filter manually
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .filter(b -> rootCause == null || rootCause.equals(b.getRootCause()))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndRootCauseAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, String rootCause, LocalDateTime startDate, LocalDateTime endDate) {
        // This method is not implemented in the repository, so we'll filter manually
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .filter(b -> (resolution == null || resolution.equals(b.getResolution())) &&
                             (rootCause == null || rootCause.equals(b.getRootCause())))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Long calculateTotalDowntimeForEquipment(UUID equipmentId) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentId(equipmentId);
        return breakdowns.stream()
                .mapToLong(b -> b.getDowntimeMinutes() != null ? b.getDowntimeMinutes() : 0)
                .sum();
    }

    @Override
    public Long calculateTotalDowntimeForEquipmentInRange(UUID equipmentId, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStartTimeBetween(equipmentId, startDate, endDate);
        return breakdowns.stream()
                .mapToLong(b -> b.getDowntimeMinutes() != null ? b.getDowntimeMinutes() : 0)
                .sum();
    }

    @Override
    public Long calculateTotalDowntimeInRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStartTimeBetween(startDate, endDate);
        return breakdowns.stream()
                .mapToLong(b -> b.getDowntimeMinutes() != null ? b.getDowntimeMinutes() : 0)
                .sum();
    }

    @Override
    public Long getBreakdownCountByStatus(String status) {
        return breakdownRepository.countByStatus(status);
    }

    @Override
    public Long getBreakdownCountByType(String breakdownType) {
        return breakdownRepository.countByBreakdownType(breakdownType);
    }

    @Override
    public Long getBreakdownCountBySeverity(String severity) {
        return breakdownRepository.countBySeverity(severity);
    }

    @Override
    public Long getBreakdownCountByAssignedTo(String assignedTo) {
        return breakdownRepository.countByAssignedTo(assignedTo);
    }

    @Override
    public Long getBreakdownCountByReportedBy(String reportedBy) {
        return breakdownRepository.countByReportedBy(reportedBy);
    }

    @Override
    public Long getBreakdownCountByEquipment(UUID equipmentId) {
        return breakdownRepository.countByEquipmentId(equipmentId);
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatus(UUID equipmentId, String status) {
        return breakdownRepository.countByEquipmentIdAndStatus(equipmentId, status);
    }

    @Override
    public Long getBreakdownCountByEquipmentAndType(UUID equipmentId, String breakdownType) {
        return breakdownRepository.countByEquipmentIdAndBreakdownType(equipmentId, breakdownType);
    }

    @Override
    public Long getBreakdownCountByEquipmentAndSeverity(UUID equipmentId, String severity) {
        return breakdownRepository.countByEquipmentIdAndSeverity(equipmentId, severity);
    }

    @Override
    public Long getBreakdownCountByEquipmentAndAssignedTo(UUID equipmentId, String assignedTo) {
        return breakdownRepository.countByEquipmentIdAndAssignedTo(equipmentId, assignedTo);
    }

    @Override
    public Long getBreakdownCountByEquipmentAndReportedBy(UUID equipmentId, String reportedBy) {
        return breakdownRepository.countByEquipmentIdAndReportedBy(equipmentId, reportedBy);
    }

    @Override
    public Long getBreakdownCountByEquipmentInRange(UUID equipmentId, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStartTimeBetween(equipmentId, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByStatusInRange(String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndStartTimeBetween(status, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByTypeInRange(String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByBreakdownTypeAndStartTimeBetween(breakdownType, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountBySeverityInRange(String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findBySeverityAndStartTimeBetween(severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByAssignedToInRange(String assignedTo, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByAssignedToAndStartTimeBetween(assignedTo, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByReportedByInRange(String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByReportedByAndStartTimeBetween(reportedBy, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusInRange(UUID equipmentId, String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndStartTimeBetween(equipmentId, status, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndTypeInRange(UUID equipmentId, String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndBreakdownTypeAndStartTimeBetween(equipmentId, breakdownType, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndSeverityInRange(UUID equipmentId, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndSeverityAndStartTimeBetween(equipmentId, severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndAssignedToInRange(UUID equipmentId, String assignedTo, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndAssignedToAndStartTimeBetween(equipmentId, assignedTo, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndReportedByInRange(UUID equipmentId, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndReportedByAndStartTimeBetween(equipmentId, reportedBy, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByStatusAndTypeInRange(String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndBreakdownTypeAndStartTimeBetween(status, breakdownType, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByStatusAndSeverityInRange(String status, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndSeverityAndStartTimeBetween(status, severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByTypeAndSeverityInRange(String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByBreakdownTypeAndSeverityAndStartTimeBetween(breakdownType, severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByAssignedToAndReportedByInRange(String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByAssignedToAndReportedByAndStartTimeBetween(assignedTo, reportedBy, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeInRange(UUID equipmentId, String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndStartTimeBetween(equipmentId, status, breakdownType, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndSeverityInRange(UUID equipmentId, String status, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndSeverityAndStartTimeBetween(equipmentId, status, severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndTypeAndSeverityInRange(UUID equipmentId, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndBreakdownTypeAndSeverityAndStartTimeBetween(equipmentId, breakdownType, severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndAssignedToAndReportedByInRange(UUID equipmentId, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, assignedTo, reportedBy, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByStatusAndTypeAndSeverityInRange(String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(status, breakdownType, severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByAssignedToAndReportedByAndStatusInRange(String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByAssignedToAndReportedByAndStatusAndStartTimeBetween(assignedTo, reportedBy, status, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityInRange(UUID equipmentId, String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(equipmentId, status, breakdownType, severity, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndAssignedToAndReportedByAndStatusInRange(UUID equipmentId, String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndAssignedToAndReportedByAndStatusAndStartTimeBetween(equipmentId, assignedTo, reportedBy, status, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndReportedByInRange(UUID equipmentId, String status, String breakdownType, String severity, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, reportedBy, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return (long) breakdowns.size();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByAndResolutionInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .filter(b -> resolution == null || resolution.equals(b.getResolution()))
                .count();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByAndRootCauseInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String rootCause, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .filter(b -> rootCause == null || rootCause.equals(b.getRootCause()))
                .count();
    }

    @Override
    public Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndRootCauseInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, String rootCause, LocalDateTime startDate, LocalDateTime endDate) {
        List<Breakdown> breakdowns = breakdownRepository.findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(equipmentId, status, breakdownType, severity, assignedTo, reportedBy, startDate, endDate);
        return breakdowns.stream()
                .filter(b -> (resolution == null || resolution.equals(b.getResolution())) &&
                             (rootCause == null || rootCause.equals(b.getRootCause())))
                .count();
    }

    /**
     * Convert Breakdown entity to BreakdownDto
     */
    private BreakdownDto convertToDto(Breakdown breakdown) {
        BreakdownDto dto = new BreakdownDto();
        dto.setId(breakdown.getId());
        dto.setEquipmentId(breakdown.getEquipmentId());
        dto.setEquipmentCode(breakdown.getEquipmentCode());
        dto.setEquipmentName(breakdown.getEquipmentName());
        dto.setStartTime(breakdown.getStartTime());
        dto.setEndTime(breakdown.getEndTime());
        dto.setBreakdownType(breakdown.getBreakdownType());
        dto.setDescription(breakdown.getDescription());
        dto.setSeverity(breakdown.getSeverity());
        dto.setStatus(breakdown.getStatus());
        dto.setAssignedTo(breakdown.getAssignedTo());
        dto.setReportedBy(breakdown.getReportedBy());
        dto.setReportedAt(breakdown.getReportedAt());
        dto.setResolution(breakdown.getResolution());
        dto.setRootCause(breakdown.getRootCause());
        dto.setDowntimeMinutes(breakdown.getDowntimeMinutes());
        dto.setCreatedAt(breakdown.getCreatedAt());
        dto.setUpdatedAt(breakdown.getUpdatedAt());
        return dto;
    }
}