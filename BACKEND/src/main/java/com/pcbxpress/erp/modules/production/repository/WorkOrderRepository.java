package com.pcbxpress.erp.modules.production.repository;

import com.pcbxpress.erp.modules.production.model.WorkOrder;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Work Orders
 */
@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {
    
    /**
     * Find work order by work order number (case insensitive)
     */
    WorkOrder findByWorkOrderNumberIgnoreCase(String workOrderNumber);
    
    /**
     * Find work order by customer PO
     */
    WorkOrder findByCustomerPO(String customerPO);
    
    /**
     * Find work orders by item code
     */
    List<WorkOrder> findByItemCodeIgnoreCase(String itemCode);
    
    /**
     * Find work orders by status
     */
    List<WorkOrder> findByStatus(WorkOrder.WorkOrderStatus status);
    
    /**
     * Find work orders by priority
     */
    List<WorkOrder> findByPriority(WorkOrder.Priority priority);
    
    /**
     * Find work orders by routing ID
     */
    List<WorkOrder> findByRoutingId(UUID routingId);
    
    /**
     * Find work orders by customer ID
     */
    List<WorkOrder> findByCustomerId(UUID customerId);
    
    /**
     * Find work orders by sales order ID
     */
    List<WorkOrder> findBySalesOrderId(UUID salesOrderId);
    
    /**
     * Find work orders by project ID
     */
    List<WorkOrder> findByProjectId(UUID projectId);
    
    /**
     * Find work orders by rush status
     */
    List<WorkOrder> findByIsRush(boolean isRush);
    
    /**
     * Find work orders by critical status
     */
    List<WorkOrder> findByIsCritical(boolean isCritical);
    
    /**
     * Find work orders by status and due date range
     */
    List<WorkOrder> findByStatusAndDueDateBetween(WorkOrder.WorkOrderStatus status, LocalDate startDate, LocalDate endDate);
    
    /**
     * Find work orders by status and start date range
     */
    List<WorkOrder> findByStatusAndStartDateBetween(WorkOrder.WorkOrderStatus status, LocalDate startDate, LocalDate endDate);
    
    /**
     * Find work orders due today
     */
    @Query("SELECT w FROM WorkOrder w WHERE w.dueDate = :today AND w.status IN :statuses")
    List<WorkOrder> findDueToday(@Param("today") LocalDate today, @Param("statuses") List<WorkOrder.WorkOrderStatus> statuses);
    
    /**
     * Find work orders overdue
     */
    @Query("SELECT w FROM WorkOrder w WHERE w.dueDate < :today AND w.status IN :statuses")
    List<WorkOrder> findOverdue(@Param("today") LocalDate today, @Param("statuses") List<WorkOrder.WorkOrderStatus> statuses);
    
    /**
     * Find work orders by multiple criteria
     */
    @Query("SELECT w FROM WorkOrder w WHERE " +
           "(:status IS NULL OR w.status = :status) " +
           "AND (:priority IS NULL OR w.priority = :priority) " +
           "AND (:itemCode IS NULL OR LOWER(w.itemCode) = LOWER(:itemCode)) " +
           "AND (:customerPO IS NULL OR LOWER(w.customerPO) LIKE LOWER(CONCAT('%', :customerPO, '%'))) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(w.workOrderNumber) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(w.itemDescription) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<WorkOrder> findByCriteria(@Param("status") WorkOrder.WorkOrderStatus status,
                                  @Param("priority") WorkOrder.Priority priority,
                                  @Param("itemCode") String itemCode,
                                  @Param("customerPO") String customerPO,
                                  @Param("searchText") String searchText);
    
    /**
     * Find work orders in progress
     */
    @Query("SELECT w FROM WorkOrder w WHERE w.status = :status")
    List<WorkOrder> findInProgress(@Param("status") WorkOrder.WorkOrderStatus status);
    
    /**
     * Find work orders completed today
     */
    @Query("SELECT w FROM WorkOrder w WHERE w.completedDate = :today AND w.status = :status")
    List<WorkOrder> findCompletedToday(@Param("today") LocalDate today, @Param("status") WorkOrder.WorkOrderStatus status);
    
    /**
     * Get work order statistics
     */
    @Query("SELECT w.status, COUNT(w) FROM WorkOrder w GROUP BY w.status")
    List<Object[]> getWorkOrderStatistics();
    
    /**
     * Get work orders by date range
     */
    @Query("SELECT w FROM WorkOrder w WHERE w.createdAt BETWEEN :startDate AND :endDate")
    List<WorkOrder> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}