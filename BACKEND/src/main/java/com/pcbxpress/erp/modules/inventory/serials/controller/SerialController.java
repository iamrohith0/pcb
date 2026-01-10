package com.pcbxpress.erp.modules.inventory.serials.controller;

import com.pcbxpress.erp.modules.inventory.serials.dto.SerialDto;
import com.pcbxpress.erp.modules.inventory.serials.dto.SerialPayload;
import com.pcbxpress.erp.modules.inventory.serials.service.SerialService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Serial Management
 */
@RestController
@RequestMapping("/api/inventory/serials")
public class SerialController {
    
    private final SerialService serialService;
    
    public SerialController(SerialService serialService) {
        this.serialService = serialService;
    }
    
    /**
     * Register serials for a work order and lot
     */
    @PostMapping("/register")
    public List<SerialDto> registerSerials(@RequestBody Map<String, Object> request) {
        List<String> serialNumbers = (List<String>) request.get("serialNumbers");
        String itemId = (String) request.get("itemId");
        String lotId = (String) request.get("lotId");
        String workOrderId = (String) request.get("workOrderId");
        
        return serialService.registerSerials(serialNumbers, itemId, lotId, workOrderId);
    }
    
    /**
     * Get a single serial by ID
     */
    @GetMapping("/{id}")
    public SerialDto getById(@PathVariable String id) {
        return serialService.getById(id);
    }
    
    /**
     * Search serials
     */
    @GetMapping("/search")
    public List<SerialDto> search(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        String itemId = params.get("itemId");
        String workOrderId = params.get("workOrderId");
        
        return serialService.search(query, status, itemId, workOrderId);
    }
    
    /**
     * Get serial history
     */
    @GetMapping("/{id}/history")
    public List<Map<String, Object>> getHistory(@PathVariable String id, 
                                               @RequestParam(defaultValue = "50") int limit) {
        return serialService.getHistory(id, limit);
    }
    
    /**
     * Get serial genealogy
     */
    @GetMapping("/{id}/genealogy")
    public Map<String, Object> getGenealogy(@PathVariable String id) {
        return serialService.getGenealogy(id);
    }
    
    /**
     * Update serial status
     */
    @PutMapping("/{id}/status")
    public SerialDto updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return serialService.updateStatus(id, status);
    }
    
    /**
     * Link serial to lot
     */
    @PostMapping("/{id}/link/lot")
    public SerialDto linkToLot(@PathVariable String id, @RequestBody Map<String, String> request) {
        String lotId = request.get("lotId");
        return serialService.linkToLot(id, lotId);
    }
    
    /**
     * Link serial to work order
     */
    @PostMapping("/{id}/link/workorder")
    public SerialDto linkToWorkOrder(@PathVariable String id, @RequestBody Map<String, String> request) {
        String workOrderId = request.get("workOrderId");
        return serialService.linkToWorkOrder(id, workOrderId);
    }
    
    /**
     * Get serials by work order
     */
    @GetMapping("/workorder/{workOrderId}")
    public List<SerialDto> getByWorkOrder(@PathVariable String workOrderId, 
                                         @RequestParam(defaultValue = "100") int limit) {
        return serialService.getByWorkOrder(workOrderId, limit);
    }
    
    /**
     * Get serials by lot
     */
    @GetMapping("/lot/{lotId}")
    public List<SerialDto> getByLot(@PathVariable String lotId, 
                                   @RequestParam(defaultValue = "100") int limit) {
        return serialService.getByLot(lotId, limit);
    }
    
    /**
     * Validate serial format
     */
    @PostMapping("/validate")
    public Map<String, Object> validateSerial(@RequestBody Map<String, String> request) {
        String serial = request.get("serial");
        return serialService.validateSerial(serial);
    }
    
    /**
     * Get serial statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return serialService.getStats();
    }
}