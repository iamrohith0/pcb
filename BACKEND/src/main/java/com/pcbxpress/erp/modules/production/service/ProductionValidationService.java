package com.pcbxpress.erp.modules.production.service;

import com.pcbxpress.erp.modules.auth.model.UserRole;
import com.pcbxpress.erp.modules.inventory.items.model.Item;
import com.pcbxpress.erp.modules.inventory.items.service.ItemService;
import com.pcbxpress.erp.modules.inventory.items.dto.ItemDto;
import com.pcbxpress.erp.modules.production.dto.WorkOrderPayload;
import com.pcbxpress.erp.modules.production.dto.RoutingDto;
import com.pcbxpress.erp.modules.production.model.WorkOrder;
import com.pcbxpress.erp.modules.production.model.Routing;
import com.pcbxpress.erp.modules.production.service.ProductionPermissionService;
import com.pcbxpress.erp.modules.production.service.RoutingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Production validation service
 * Handles business rule validation and permission checks for production operations
 */
@Service
public class ProductionValidationService {
    
    private final ProductionPermissionService permissionService;
    private final ItemService itemService;
    private final RoutingService routingService;
    
    @Autowired
    public ProductionValidationService(ProductionPermissionService permissionService,
                                     ItemService itemService,
                                     RoutingService routingService) {
        this.permissionService = permissionService;
        this.itemService = itemService;
        this.routingService = routingService;
    }
    
    /**
     * Validate work order creation
     */
    public ValidationResult validateWorkOrderCreation(UserRole userRole, WorkOrderPayload payload) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canCreateWorkOrders(userRole)) {
            errors.add("User does not have permission to create work orders");
        }
        
        // Validate required fields
        if (payload.itemCode() == null || payload.itemCode().trim().isEmpty()) {
            errors.add("Item code is required");
        }
        
        if (payload.quantity() == null || payload.quantity() <= 0) {
            errors.add("Quantity must be greater than 0");
        }
        
        if (payload.dueDate() != null && payload.dueDate().isBefore(LocalDate.now())) {
            errors.add("Due date cannot be in the past");
        }
        
        // Validate item exists and is active
        if (payload.itemCode() != null) {
            try {
                // Use search method to find item by code
                List<ItemDto> items = itemService.search(payload.itemCode());
                ItemDto item = items.stream()
                    .filter(i -> payload.itemCode().equals(i.itemCode()))
                    .findFirst()
                    .orElse(null);
                
                if (item == null) {
                    errors.add("Item with code '" + payload.itemCode() + "' not found");
                } else if (!item.isActive()) {
                    errors.add("Item '" + payload.itemCode() + "' is not active");
                }
            } catch (Exception e) {
                errors.add("Error validating item: " + e.getMessage());
            }
        }
        
        // Validate routing exists if provided
        if (payload.routingId() != null) {
            try {
                RoutingDto routing = routingService.get(payload.routingId());
                if (routing == null) {
                    errors.add("Routing with ID '" + payload.routingId() + "' not found");
                }
            } catch (Exception e) {
                errors.add("Error validating routing: " + e.getMessage());
            }
        }
        
        // Validate customer PO uniqueness if provided
        if (payload.customerPO() != null && !payload.customerPO().trim().isEmpty()) {
            // This would typically check against existing work orders
            // For now, we'll just validate the format
            if (payload.customerPO().length() > 100) {
                errors.add("Customer PO cannot exceed 100 characters");
            }
        }
        
        // Validate estimated hours
        if (payload.estimatedHours() != null && payload.estimatedHours().compareTo(BigDecimal.ZERO) < 0) {
            errors.add("Estimated hours cannot be negative");
        }
        
        // Validate priority
        if (payload.priority() == null) {
            errors.add("Priority is required");
        }
        
        // Validate status for creation
        if (payload.status() != null && payload.status() != WorkOrder.WorkOrderStatus.DRAFT) {
            errors.add("Work order must be created with DRAFT status");
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate work order update
     */
    public ValidationResult validateWorkOrderUpdate(UserRole userRole, String workOrderId, WorkOrderPayload payload) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canUpdateWorkOrders(userRole)) {
            errors.add("User does not have permission to update work orders");
        }
        
        // Validate required fields
        if (payload.itemCode() == null || payload.itemCode().trim().isEmpty()) {
            errors.add("Item code is required");
        }
        
        if (payload.quantity() == null || payload.quantity() <= 0) {
            errors.add("Quantity must be greater than 0");
        }
        
        // Validate item exists and is active
        if (payload.itemCode() != null) {
            try {
                // Use search method to find item by code
                List<ItemDto> items = itemService.search(payload.itemCode());
                ItemDto item = items.stream()
                    .filter(i -> payload.itemCode().equals(i.itemCode()))
                    .findFirst()
                    .orElse(null);
                
                if (item == null) {
                    errors.add("Item with code '" + payload.itemCode() + "' not found");
                } else if (!item.isActive()) {
                    errors.add("Item '" + payload.itemCode() + "' is not active");
                }
            } catch (Exception e) {
                errors.add("Error validating item: " + e.getMessage());
            }
        }
        
        // Validate routing exists if provided
        if (payload.routingId() != null) {
            try {
                RoutingDto routing = routingService.get(payload.routingId());
                if (routing == null) {
                    errors.add("Routing with ID '" + payload.routingId() + "' not found");
                }
            } catch (Exception e) {
                errors.add("Error validating routing: " + e.getMessage());
            }
        }
        
        // Validate status transitions
        if (payload.status() != null) {
            try {
                WorkOrder currentWorkOrder = getWorkOrderById(workOrderId);
                if (currentWorkOrder != null) {
                    if (!isValidStatusTransition(currentWorkOrder.getStatus(), payload.status())) {
                        errors.add("Invalid status transition from " + currentWorkOrder.getStatus() + " to " + payload.status());
                    }
                }
            } catch (Exception e) {
                errors.add("Error validating work order status: " + e.getMessage());
            }
        }
        
        // Validate dates
        if (payload.dueDate() != null && payload.dueDate().isBefore(LocalDate.now())) {
            errors.add("Due date cannot be in the past");
        }
        
        if (payload.startDate() != null && payload.dueDate() != null && 
            payload.startDate().isAfter(payload.dueDate())) {
            errors.add("Start date cannot be after due date");
        }
        
        // Validate completed date
        if (payload.completedDate() != null && payload.completedDate().isAfter(LocalDate.now())) {
            errors.add("Completed date cannot be in the future");
        }
        
        // Validate quantities
        if (payload.completedQuantity() != null && payload.quantity() != null && 
            payload.completedQuantity() > payload.quantity()) {
            errors.add("Completed quantity cannot exceed total quantity");
        }
        
        if (payload.scrapQuantity() != null && payload.quantity() != null && 
            payload.scrapQuantity() > payload.quantity()) {
            errors.add("Scrap quantity cannot exceed total quantity");
        }
        
        if (payload.completedQuantity() != null && payload.scrapQuantity() != null && 
            payload.completedQuantity() + payload.scrapQuantity() > payload.quantity()) {
            errors.add("Completed quantity plus scrap cannot exceed total quantity");
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate work order status transition
     */
    public boolean isValidStatusTransition(WorkOrder.WorkOrderStatus fromStatus, WorkOrder.WorkOrderStatus toStatus) {
        if (fromStatus == null || toStatus == null) {
            return false;
        }
        
        if (fromStatus == toStatus) {
            return true;
        }
        
        switch (fromStatus) {
            case DRAFT:
                return toStatus == WorkOrder.WorkOrderStatus.RELEASED ||
                       toStatus == WorkOrder.WorkOrderStatus.CANCELLED;
            case RELEASED:
                return toStatus == WorkOrder.WorkOrderStatus.IN_PROGRESS ||
                       toStatus == WorkOrder.WorkOrderStatus.ON_HOLD ||
                       toStatus == WorkOrder.WorkOrderStatus.CANCELLED;
            case IN_PROGRESS:
                return toStatus == WorkOrder.WorkOrderStatus.ON_HOLD ||
                       toStatus == WorkOrder.WorkOrderStatus.COMPLETED ||
                       toStatus == WorkOrder.WorkOrderStatus.CANCELLED;
            case ON_HOLD:
                return toStatus == WorkOrder.WorkOrderStatus.IN_PROGRESS ||
                       toStatus == WorkOrder.WorkOrderStatus.CANCELLED;
            case COMPLETED:
                return false; // Cannot transition from completed
            case CANCELLED:
                return false; // Cannot transition from cancelled
            default:
                return false;
        }
    }
    
    /**
     * Validate work order release
     */
    public ValidationResult validateWorkOrderRelease(UserRole userRole, String workOrderId) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canReleaseWorkOrders(userRole)) {
            errors.add("User does not have permission to release work orders");
        }
        
        // Check work order exists and is in correct status
        try {
            WorkOrder workOrder = getWorkOrderById(workOrderId);
            if (workOrder == null) {
                errors.add("Work order not found");
            } else if (workOrder.getStatus() != WorkOrder.WorkOrderStatus.DRAFT) {
                errors.add("Work order must be in DRAFT status to be released");
            }
        } catch (Exception e) {
            errors.add("Error validating work order: " + e.getMessage());
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate work order completion
     */
    public ValidationResult validateWorkOrderCompletion(UserRole userRole, String workOrderId, Integer completedQuantity) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canCompleteWorkOrders(userRole)) {
            errors.add("User does not have permission to complete work orders");
        }
        
        // Check work order exists and is in correct status
        try {
            WorkOrder workOrder = getWorkOrderById(workOrderId);
            if (workOrder == null) {
                errors.add("Work order not found");
            } else if (workOrder.getStatus() != WorkOrder.WorkOrderStatus.IN_PROGRESS) {
                errors.add("Work order must be in IN_PROGRESS status to be completed");
            } else if (completedQuantity == null || completedQuantity <= 0) {
                errors.add("Completed quantity must be greater than 0");
            } else if (completedQuantity > workOrder.getQuantity()) {
                errors.add("Completed quantity cannot exceed work order quantity");
            }
        } catch (Exception e) {
            errors.add("Error validating work order completion: " + e.getMessage());
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate work order cancellation
     */
    public ValidationResult validateWorkOrderCancellation(UserRole userRole, String workOrderId) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canCancelWorkOrders(userRole)) {
            errors.add("User does not have permission to cancel work orders");
        }
        
        // Check work order exists and can be cancelled
        try {
            WorkOrder workOrder = getWorkOrderById(workOrderId);
            if (workOrder == null) {
                errors.add("Work order not found");
            } else if (workOrder.getStatus() == WorkOrder.WorkOrderStatus.COMPLETED) {
                errors.add("Cannot cancel a completed work order");
            } else if (workOrder.getStatus() == WorkOrder.WorkOrderStatus.CANCELLED) {
                errors.add("Work order is already cancelled");
            }
        } catch (Exception e) {
            errors.add("Error validating work order cancellation: " + e.getMessage());
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate work order hold
     */
    public ValidationResult validateWorkOrderHold(UserRole userRole, String workOrderId) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canHoldWorkOrders(userRole)) {
            errors.add("User does not have permission to hold work orders");
        }
        
        // Check work order exists and is in correct status
        try {
            WorkOrder workOrder = getWorkOrderById(workOrderId);
            if (workOrder == null) {
                errors.add("Work order not found");
            } else if (workOrder.getStatus() != WorkOrder.WorkOrderStatus.IN_PROGRESS) {
                errors.add("Work order must be in IN_PROGRESS status to be held");
            }
        } catch (Exception e) {
            errors.add("Error validating work order hold: " + e.getMessage());
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate work order resume
     */
    public ValidationResult validateWorkOrderResume(UserRole userRole, String workOrderId) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canResumeWorkOrders(userRole)) {
            errors.add("User does not have permission to resume work orders");
        }
        
        // Check work order exists and is in correct status
        try {
            WorkOrder workOrder = getWorkOrderById(workOrderId);
            if (workOrder == null) {
                errors.add("Work order not found");
            } else if (workOrder.getStatus() != WorkOrder.WorkOrderStatus.ON_HOLD) {
                errors.add("Work order must be in ON_HOLD status to be resumed");
            }
        } catch (Exception e) {
            errors.add("Error validating work order resume: " + e.getMessage());
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate WIP movement
     */
    public ValidationResult validateWIPMovement(UserRole userRole, String workOrderId, String fromOperation, String toOperation) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canMoveWIP(userRole)) {
            errors.add("User does not have permission to move WIP");
        }
        
        // Check work order exists and is in progress
        try {
            WorkOrder workOrder = getWorkOrderById(workOrderId);
            if (workOrder == null) {
                errors.add("Work order not found");
            } else if (workOrder.getStatus() != WorkOrder.WorkOrderStatus.IN_PROGRESS) {
                errors.add("Work order must be in IN_PROGRESS status for WIP movement");
            }
        } catch (Exception e) {
            errors.add("Error validating WIP movement: " + e.getMessage());
        }
        
        // Validate operation codes
        if (fromOperation == null || fromOperation.trim().isEmpty()) {
            errors.add("From operation is required");
        }
        
        if (toOperation == null || toOperation.trim().isEmpty()) {
            errors.add("To operation is required");
        }
        
        if (fromOperation != null && toOperation != null && fromOperation.equals(toOperation)) {
            errors.add("From and to operations must be different");
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate capacity management
     */
    public ValidationResult validateCapacityManagement(UserRole userRole) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canManageCapacity(userRole)) {
            errors.add("User does not have permission to manage capacity");
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate routing operations
     */
    public ValidationResult validateRoutingOperation(UserRole userRole, ProductionPermissionService.RoutingAction action) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canPerformRoutingAction(userRole, action)) {
            errors.add("User does not have permission to perform routing operation: " + action);
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Validate operation management
     */
    public ValidationResult validateOperationManagement(UserRole userRole, ProductionPermissionService.OperationAction action) {
        List<String> errors = new ArrayList<>();
        
        // Check permissions
        if (!permissionService.canPerformOperationAction(userRole, action)) {
            errors.add("User does not have permission to perform operation: " + action);
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    // Helper methods
    
    private WorkOrder getWorkOrderById(String workOrderId) {
        // This would typically call the WorkOrderService
        // For now, we'll return null to indicate not found
        return null;
    }
    
    /**
     * Validation result class
     */
    public static class ValidationResult {
        private final boolean isValid;
        private final List<String> errors;
        
        public ValidationResult(boolean isValid, List<String> errors) {
            this.isValid = isValid;
            this.errors = errors;
        }
        
        public boolean isValid() {
            return isValid;
        }
        
        public List<String> getErrors() {
            return errors;
        }
        
        public String getErrorMessage() {
            return errors.isEmpty() ? null : String.join("; ", errors);
        }
    }
}