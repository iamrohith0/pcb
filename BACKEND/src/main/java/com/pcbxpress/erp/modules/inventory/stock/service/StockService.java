package com.pcbxpress.erp.modules.inventory.stock.service;

import com.pcbxpress.erp.modules.inventory.stock.dto.StockDto;
import com.pcbxpress.erp.modules.inventory.stock.dto.StockSummaryDto;
import com.pcbxpress.erp.modules.inventory.stock.model.Stock;
import com.pcbxpress.erp.modules.inventory.stock.repository.StockRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for Stock Management
 */
@Service
@Transactional(readOnly = true)
public class StockService {
    
    private final StockRepository stockRepository;
    
    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }
    
    /**
     * Get stock summary for dashboard
     */
    public Map<String, Object> getSummary() {
        List<Object[]> summaryData = stockRepository.getStockSummary();
        
        // Calculate totals
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal totalAvailable = BigDecimal.ZERO;
        int totalItems = 0;
        int totalWarehouses = 0;
        
        for (Object[] row : summaryData) {
            totalValue = totalValue.add((BigDecimal) row[8]);
            totalQuantity = totalQuantity.add((BigDecimal) row[3]);
            totalAvailable = totalAvailable.add((BigDecimal) row[5]);
            totalItems++;
            totalWarehouses += ((Long) row[9]).intValue();
        }
        
        return Map.of(
            "totalValue", totalValue,
            "totalQuantity", totalQuantity,
            "totalAvailable", totalAvailable,
            "totalItems", totalItems,
            "totalWarehouses", totalWarehouses,
            "summaryData", summaryData.stream()
                .map(this::mapToStockSummaryDto)
                .collect(Collectors.toList())
        );
    }
    
    /**
     * Get stock alerts
     */
    public List<StockDto> getAlerts() {
        OffsetDateTime alertDate = OffsetDateTime.now().plusDays(30); // Items expiring in 30 days
        OffsetDateTime inactiveDate = OffsetDateTime.now().minus(3, ChronoUnit.MONTHS); // No movement in 3 months
        
        List<Stock> alerts = stockRepository.getStockAlerts(alertDate, inactiveDate);
        return alerts.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get recent stock movements
     */
    public List<Object[]> getMovements(int days) {
        OffsetDateTime fromDate = OffsetDateTime.now().minus(days, ChronoUnit.DAYS);
        OffsetDateTime toDate = OffsetDateTime.now();
        
        return stockRepository.getStockMovements(fromDate, toDate);
    }
    
    /**
     * Get stock by item
     */
    public List<StockDto> getByItem(String itemId) {
        List<Stock> stocks = stockRepository.findByItemId(UUID.fromString(itemId));
        return stocks.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get stock by warehouse
     */
    public List<StockDto> getByWarehouse(String warehouseId) {
        List<Stock> stocks = stockRepository.findByWarehouseId(UUID.fromString(warehouseId));
        return stocks.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get stock adjustments (this would typically be from a separate adjustments table)
     */
    public List<Map<String, Object>> getAdjustments(String itemId, int limit) {
        // This is a placeholder - in a real implementation, this would query an adjustments table
        return List.of();
    }
    
    /**
     * Create stock adjustment (placeholder for actual implementation)
     */
    @Transactional
    public Map<String, Object> createAdjustment(Map<String, Object> adjustmentData) {
        // This would implement actual stock adjustment logic
        return Map.of("message", "Adjustment created", "success", true);
    }
    
    /**
     * Get stock lots
     */
    public List<StockDto> getLots(String itemId) {
        List<Stock> stocks = stockRepository.findByItemIdAndStockStatus(
            UUID.fromString(itemId), 
            Stock.StockStatus.AVAILABLE
        );
        return stocks.stream()
            .filter(s -> s.getLotId() != null)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get stock serials
     */
    public List<StockDto> getSerials(String itemId) {
        List<Stock> stocks = stockRepository.findByItemIdAndStockStatus(
            UUID.fromString(itemId), 
            Stock.StockStatus.AVAILABLE
        );
        return stocks.stream()
            .filter(s -> s.getSerialId() != null)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get stock by location
     */
    public List<StockDto> getByLocation(String locationId) {
        List<Stock> stocks = stockRepository.findByLocationId(UUID.fromString(locationId));
        return stocks.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get stock by status
     */
    public List<StockDto> getByStatus(Stock.StockStatus status) {
        List<Stock> stocks = stockRepository.findByStockStatus(status);
        return stocks.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get expiring stock
     */
    public List<StockDto> getExpiringStock(int days) {
        OffsetDateTime expirationDate = OffsetDateTime.now().plusDays(days);
        List<Stock> stocks = stockRepository.findExpiringStock(expirationDate);
        return stocks.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get inactive stock
     */
    public List<StockDto> getInactiveStock(int months) {
        OffsetDateTime lastMovementDate = OffsetDateTime.now().minus(months, ChronoUnit.MONTHS);
        List<Stock> stocks = stockRepository.findInactiveStock(lastMovementDate);
        return stocks.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Get stock statistics
     */
    public Map<String, Object> getStats() {
        List<Object[]> summaryData = stockRepository.getStockSummary();
        
        // Calculate statistics
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal totalAvailable = BigDecimal.ZERO;
        BigDecimal totalReserved = BigDecimal.ZERO;
        BigDecimal totalOnOrder = BigDecimal.ZERO;
        BigDecimal totalCommitted = BigDecimal.ZERO;
        
        int itemsWithStock = 0;
        int itemsOutOfStock = 0;
        int itemsLowStock = 0;
        
        for (Object[] row : summaryData) {
            BigDecimal quantity = (BigDecimal) row[3];
            BigDecimal available = (BigDecimal) row[5];
            BigDecimal reserved = (BigDecimal) row[4];
            BigDecimal onOrder = (BigDecimal) row[6];
            BigDecimal committed = (BigDecimal) row[7];
            
            totalQuantity = totalQuantity.add(quantity);
            totalAvailable = totalAvailable.add(available);
            totalReserved = totalReserved.add(reserved);
            totalOnOrder = totalOnOrder.add(onOrder);
            totalCommitted = totalCommitted.add(committed);
            totalValue = totalValue.add((BigDecimal) row[8]);
            
            if (quantity.compareTo(BigDecimal.ZERO) > 0) {
                itemsWithStock++;
                if (available.compareTo(BigDecimal.ZERO) == 0) {
                    itemsOutOfStock++;
                } else if (available.compareTo(new BigDecimal("10")) < 0) {
                    itemsLowStock++;
                }
            }
        }
        
        return Map.of(
            "totalValue", totalValue,
            "totalQuantity", totalQuantity,
            "totalAvailable", totalAvailable,
            "totalReserved", totalReserved,
            "totalOnOrder", totalOnOrder,
            "totalCommitted", totalCommitted,
            "itemsWithStock", itemsWithStock,
            "itemsOutOfStock", itemsOutOfStock,
            "itemsLowStock", itemsLowStock,
            "avgTurnoverRate", calculateTurnoverRate()
        );
    }
    
    // Private helper methods
    
    private StockSummaryDto mapToStockSummaryDto(Object[] row) {
        return new StockSummaryDto(
            ((UUID) row[0]).toString(),
            (String) row[1],
            (String) row[2],
            (BigDecimal) row[3],
            (BigDecimal) row[4],
            (BigDecimal) row[5],
            (BigDecimal) row[6],
            (BigDecimal) row[7],
            (BigDecimal) row[8],
            (Long) row[9],
            (Long) row[10]
        );
    }
    
    private StockDto toDto(Stock stock) {
        return new StockDto(
            stock.getId().toString(),
            stock.getItemId().toString(),
            stock.getWarehouseId().toString(),
            stock.getLocationId() != null ? stock.getLocationId().toString() : null,
            stock.getLotId() != null ? stock.getLotId().toString() : null,
            stock.getSerialId() != null ? stock.getSerialId().toString() : null,
            stock.getQuantity(),
            stock.getReservedQuantity(),
            stock.getAvailableQuantity(),
            stock.getOnOrderQuantity(),
            stock.getCommittedQuantity(),
            stock.getStockStatus(),
            stock.getCostPerUnit(),
            stock.getTotalValue(),
            stock.getLastMovementDate(),
            stock.getExpirationDate(),
            stock.getCreatedAt(),
            stock.getUpdatedAt()
        );
    }
    
    private BigDecimal calculateTurnoverRate() {
        // Placeholder implementation
        // In a real system, this would calculate based on movement data
        return new BigDecimal("2.5");
    }
}