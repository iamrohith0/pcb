package com.pcbxpress.erp.modules.auth.model;

/**
 * Permission enum defining all system permissions
 * Organized by module and operation type
 */
public enum Permission {
    
    // System Administration Permissions
    SYSTEM_ADMIN("system:admin", "System Administration"),
    SYSTEM_CONFIG("system:config", "System Configuration"),
    SYSTEM_MONITOR("system:monitor", "System Monitoring"),
    
    // User Management Permissions
    USER_READ("user:read", "View Users"),
    USER_CREATE("user:create", "Create Users"),
    USER_UPDATE("user:update", "Update Users"),
    USER_DELETE("user:delete", "Delete Users"),
    USER_MANAGE_ROLES("user:manage_roles", "Manage User Roles"),
    
    // Production Module Permissions
    PRODUCTION_READ("production:read", "View Production Data"),
    PRODUCTION_CREATE("production:create", "Create Production Orders"),
    PRODUCTION_UPDATE("production:update", "Update Production Orders"),
    PRODUCTION_DELETE("production:delete", "Delete Production Orders"),
    PRODUCTION_RELEASE("production:release", "Release Work Orders"),
    PRODUCTION_COMPLETE("production:complete", "Complete Work Orders"),
    PRODUCTION_CANCEL("production:cancel", "Cancel Work Orders"),
    PRODUCTION_HOLD("production:hold", "Hold Work Orders"),
    PRODUCTION_RESUME("production:resume", "Resume Work Orders"),
    PRODUCTION_SCHEDULE("production:schedule", "Schedule Production"),
    PRODUCTION_CAPACITY_VIEW("production:capacity:view", "View Capacity"),
    PRODUCTION_CAPACITY_MANAGE("production:capacity:manage", "Manage Capacity"),
    PRODUCTION_ROUTING_VIEW("production:routing:view", "View Routing"),
    PRODUCTION_ROUTING_CREATE("production:routing:create", "Create Routing"),
    PRODUCTION_ROUTING_UPDATE("production:routing:update", "Update Routing"),
    PRODUCTION_ROUTING_DELETE("production:routing:delete", "Delete Routing"),
    PRODUCTION_WIP_VIEW("production:wip:view", "View WIP"),
    PRODUCTION_WIP_MOVE("production:wip:move", "Move WIP"),
    PRODUCTION_WIP_HOLD("production:wip:hold", "Hold WIP"),
    PRODUCTION_WIP_RELEASE("production:wip:release", "Release WIP"),
    PRODUCTION_OPERATION_VIEW("production:operation:view", "View Operations"),
    PRODUCTION_OPERATION_CREATE("production:operation:create", "Create Operations"),
    PRODUCTION_OPERATION_UPDATE("production:operation:update", "Update Operations"),
    PRODUCTION_OPERATION_DELETE("production:operation:delete", "Delete Operations"),
    
    // Inventory Module Permissions
    INVENTORY_READ("inventory:read", "View Inventory"),
    INVENTORY_CREATE("inventory:create", "Create Inventory Items"),
    INVENTORY_UPDATE("inventory:update", "Update Inventory Items"),
    INVENTORY_DELETE("inventory:delete", "Delete Inventory Items"),
    INVENTORY_ADJUST("inventory:adjust", "Adjust Inventory"),
    INVENTORY_TRANSFER("inventory:transfer", "Transfer Inventory"),
    INVENTORY_RESERVE("inventory:reserve", "Reserve Inventory"),
    INVENTORY_RELEASE("inventory:release", "Release Inventory"),
    INVENTORY_COUNT("inventory:count", "Physical Count"),
    INVENTORY_CYCLE_COUNT("inventory:cycle_count", "Cycle Count"),
    INVENTORY_LOT_VIEW("inventory:lot:view", "View Lot Information"),
    INVENTORY_LOT_CREATE("inventory:lot:create", "Create Lot"),
    INVENTORY_LOT_UPDATE("inventory:lot:update", "Update Lot"),
    INVENTORY_SERIAL_VIEW("inventory:serial:view", "View Serial Numbers"),
    INVENTORY_SERIAL_CREATE("inventory:serial:create", "Create Serial Numbers"),
    INVENTORY_BOM_VIEW("inventory:bom:view", "View BOM"),
    INVENTORY_BOM_CREATE("inventory:bom:create", "Create BOM"),
    INVENTORY_BOM_UPDATE("inventory:bom:update", "Update BOM"),
    INVENTORY_BOM_DELETE("inventory:bom:delete", "Delete BOM"),
    
    // Sales Module Permissions
    SALES_READ("sales:read", "View Sales Data"),
    SALES_CREATE("sales:create", "Create Sales Orders"),
    SALES_UPDATE("sales:update", "Update Sales Orders"),
    SALES_DELETE("sales:delete", "Delete Sales Orders"),
    SALES_APPROVE("sales:approve", "Approve Sales Orders"),
    SALES_CANCEL("sales:cancel", "Cancel Sales Orders"),
    SALES_INVOICE_CREATE("sales:invoice:create", "Create Invoices"),
    SALES_INVOICE_UPDATE("sales:invoice:update", "Update Invoices"),
    SALES_INVOICE_DELETE("sales:invoice:delete", "Delete Invoices"),
    SALES_QUOTATION_VIEW("sales:quotation:view", "View Quotations"),
    SALES_QUOTATION_CREATE("sales:quotation:create", "Create Quotations"),
    SALES_QUOTATION_UPDATE("sales:quotation:update", "Update Quotations"),
    SALES_QUOTATION_APPROVE("sales:quotation:approve", "Approve Quotations"),
    SALES_CUSTOMER_VIEW("sales:customer:view", "View Customers"),
    SALES_CUSTOMER_CREATE("sales:customer:create", "Create Customers"),
    SALES_CUSTOMER_UPDATE("sales:customer:update", "Update Customers"),
    SALES_CUSTOMER_DELETE("sales:customer:delete", "Delete Customers"),
    SALES_RFQ_VIEW("sales:rfq:view", "View RFQs"),
    SALES_RFQ_CREATE("sales:rfq:create", "Create RFQs"),
    SALES_RFQ_UPDATE("sales:rfq:update", "Update RFQs"),
    SALES_RFQ_PROCESS("sales:rfq:process", "Process RFQs"),
    
    // Procurement Module Permissions
    PROCUREMENT_READ("procurement:read", "View Procurement Data"),
    PROCUREMENT_CREATE("procurement:create", "Create Purchase Orders"),
    PROCUREMENT_UPDATE("procurement:update", "Update Purchase Orders"),
    PROCUREMENT_DELETE("procurement:delete", "Delete Purchase Orders"),
    PROCUREMENT_APPROVE("procurement:approve", "Approve Purchase Orders"),
    PROCUREMENT_CANCEL("procurement:cancel", "Cancel Purchase Orders"),
    PROCUREMENT_RECEIVE("procurement:receive", "Receive Goods"),
    PROCUREMENT_INSPECT("procurement:inspect", "Quality Inspection"),
    PROCUREMENT_SUPPLIER_VIEW("procurement:supplier:view", "View Suppliers"),
    PROCUREMENT_SUPPLIER_CREATE("procurement:supplier:create", "Create Suppliers"),
    PROCUREMENT_SUPPLIER_UPDATE("procurement:supplier:update", "Update Suppliers"),
    PROCUREMENT_SUPPLIER_DELETE("procurement:supplier:delete", "Delete Suppliers"),
    PROCUREMENT_GRN_VIEW("procurement:grn:view", "View GRN"),
    PROCUREMENT_GRN_CREATE("procurement:grn:create", "Create GRN"),
    PROCUREMENT_PRICING_VIEW("procurement:pricing:view", "View Pricing"),
    PROCUREMENT_PRICING_UPDATE("procurement:pricing:update", "Update Pricing"),
    
    // Quality Module Permissions
    QUALITY_READ("quality:read", "View Quality Data"),
    QUALITY_CREATE("quality:create", "Create Quality Records"),
    QUALITY_UPDATE("quality:update", "Update Quality Records"),
    QUALITY_DELETE("quality:delete", "Delete Quality Records"),
    QUALITY_INSPECTION_VIEW("quality:inspection:view", "View Inspections"),
    QUALITY_INSPECTION_CREATE("quality:inspection:create", "Create Inspections"),
    QUALITY_INSPECTION_UPDATE("quality:inspection:update", "Update Inspections"),
    QUALITY_INSPECTION_APPROVE("quality:inspection:approve", "Approve Inspections"),
    QUALITY_NCR_VIEW("quality:ncr:view", "View NCRs"),
    QUALITY_NCR_CREATE("quality:ncr:create", "Create NCRs"),
    QUALITY_NCR_UPDATE("quality:ncr:update", "Update NCRs"),
    QUALITY_NCR_DISPOSITION("quality:ncr:disposition", "NCR Disposition"),
    QUALITY_CAPA_VIEW("quality:capa:view", "View CAPA"),
    QUALITY_CAPA_CREATE("quality:capa:create", "Create CAPA"),
    QUALITY_CAPA_UPDATE("quality:capa:update", "Update CAPA"),
    QUALITY_CERTIFICATE_VIEW("quality:certificate:view", "View Certificates"),
    QUALITY_CERTIFICATE_CREATE("quality:certificate:create", "Create Certificates"),
    QUALITY_ATEST_VIEW("quality:atest:view", "View ATE Test"),
    QUALITY_ATEST_CREATE("quality:atest:create", "Create ATE Test"),
    QUALITY_ATEST_UPDATE("quality:atest:update", "Update ATE Test"),
    QUALITY_AOI_VIEW("quality:aoi:view", "View AOI"),
    QUALITY_AOI_CREATE("quality:aoi:create", "Create AOI"),
    QUALITY_AOI_UPDATE("quality:aoi:update", "Update AOI"),
    
    // Warehouse Module Permissions
    WAREHOUSE_READ("warehouse:read", "View Warehouse Data"),
    WAREHOUSE_CREATE("warehouse:create", "Create Warehouse Records"),
    WAREHOUSE_UPDATE("warehouse:update", "Update Warehouse Records"),
    WAREHOUSE_DELETE("warehouse:delete", "Delete Warehouse Records"),
    WAREHOUSE_PICK("warehouse:pick", "Pick Items"),
    WAREHOUSE_PACK("warehouse:pack", "Pack Items"),
    WAREHOUSE_SHIP("warehouse:ship", "Ship Items"),
    WAREHOUSE_RECEIVE("warehouse:receive", "Receive Items"),
    WAREHOUSE_PUTAWAY("warehouse:putaway", "Put Away Items"),
    WAREHOUSE_CYCLE_COUNT("warehouse:cycle_count", "Warehouse Cycle Count"),
    WAREHOUSE_LOCATION_VIEW("warehouse:location:view", "View Locations"),
    WAREHOUSE_LOCATION_CREATE("warehouse:location:create", "Create Locations"),
    WAREHOUSE_LOCATION_UPDATE("warehouse:location:update", "Update Locations"),
    WAREHOUSE_WAREHOUSE_VIEW("warehouse:warehouse:view", "View Warehouses"),
    WAREHOUSE_WAREHOUSE_CREATE("warehouse:warehouse:create", "Create Warehouses"),
    WAREHOUSE_WAREHOUSE_UPDATE("warehouse:warehouse:update", "Update Warehouses"),
    
    // Engineering Module Permissions
    ENGINEERING_READ("engineering:read", "View Engineering Data"),
    ENGINEERING_CREATE("engineering:create", "Create Engineering Records"),
    ENGINEERING_UPDATE("engineering:update", "Update Engineering Records"),
    ENGINEERING_DELETE("engineering:delete", "Delete Engineering Records"),
    ENGINEERING_CAM_VIEW("engineering:cam:view", "View CAM Jobs"),
    ENGINEERING_CAM_CREATE("engineering:cam:create", "Create CAM Jobs"),
    ENGINEERING_CAM_UPDATE("engineering:cam:update", "Update CAM Jobs"),
    ENGINEERING_DFM_VIEW("engineering:dfm:view", "View DFM"),
    ENGINEERING_DFM_CREATE("engineering:dfm:create", "Create DFM"),
    ENGINEERING_DFM_UPDATE("engineering:dfm:update", "Update DFM"),
    ENGINEERING_PANEL_VIEW("engineering:panel:view", "View Panel Templates"),
    ENGINEERING_PANEL_CREATE("engineering:panel:create", "Create Panel Templates"),
    ENGINEERING_PANEL_UPDATE("engineering:panel:update", "Update Panel Templates"),
    ENGINEERING_REVISION_VIEW("engineering:revision:view", "View Revisions"),
    ENGINEERING_REVISION_CREATE("engineering:revision:create", "Create Revisions"),
    ENGINEERING_REVISION_UPDATE("engineering:revision:update", "Update Revisions"),
    ENGINEERING_STACKUP_VIEW("engineering:stackup:view", "View Stackup"),
    ENGINEERING_STACKUP_CREATE("engineering:stackup:create", "Create Stackup"),
    ENGINEERING_STACKUP_UPDATE("engineering:stackup:update", "Update Stackup"),
    ENGINEERING_MATERIAL_VIEW("engineering:material:view", "View Materials"),
    ENGINEERING_MATERIAL_CREATE("engineering:material:create", "Create Materials"),
    ENGINEERING_MATERIAL_UPDATE("engineering:material:update", "Update Materials"),
    
    // Maintenance Module Permissions
    MAINTENANCE_READ("maintenance:read", "View Maintenance Data"),
    MAINTENANCE_CREATE("maintenance:create", "Create Maintenance Records"),
    MAINTENANCE_UPDATE("maintenance:update", "Update Maintenance Records"),
    MAINTENANCE_DELETE("maintenance:delete", "Delete Maintenance Records"),
    MAINTENANCE_BREAKDOWN_VIEW("maintenance:breakdown:view", "View Breakdowns"),
    MAINTENANCE_BREAKDOWN_CREATE("maintenance:breakdown:create", "Create Breakdowns"),
    MAINTENANCE_BREAKDOWN_UPDATE("maintenance:breakdown:update", "Update Breakdowns"),
    MAINTENANCE_BREAKDOWN_CLOSE("maintenance:breakdown:close", "Close Breakdowns"),
    MAINTENANCE_EQUIPMENT_VIEW("maintenance:equipment:view", "View Equipment"),
    MAINTENANCE_EQUIPMENT_CREATE("maintenance:equipment:create", "Create Equipment"),
    MAINTENANCE_EQUIPMENT_UPDATE("maintenance:equipment:update", "Update Equipment"),
    MAINTENANCE_PREVENTIVE_VIEW("maintenance:preventive:view", "View Preventive Maintenance"),
    MAINTENANCE_PREVENTIVE_CREATE("maintenance:preventive:create", "Create Preventive Maintenance"),
    MAINTENANCE_PREVENTIVE_UPDATE("maintenance:preventive:update", "Update Preventive Maintenance"),
    MAINTENANCE_SPARES_VIEW("maintenance:spares:view", "View Spares"),
    MAINTENANCE_SPARES_CREATE("maintenance:spares:create", "Create Spares"),
    MAINTENANCE_SPARES_UPDATE("maintenance:spares:update", "Update Spares"),
    
    // Logistics Module Permissions
    LOGISTICS_READ("logistics:read", "View Logistics Data"),
    LOGISTICS_CREATE("logistics:create", "Create Logistics Records"),
    LOGISTICS_UPDATE("logistics:update", "Update Logistics Records"),
    LOGISTICS_DELETE("logistics:delete", "Delete Logistics Records"),
    LOGISTICS_DISPATCH_VIEW("logistics:dispatch:view", "View Dispatch"),
    LOGISTICS_DISPATCH_CREATE("logistics:dispatch:create", "Create Dispatch"),
    LOGISTICS_DISPATCH_UPDATE("logistics:dispatch:update", "Update Dispatch"),
    LOGISTICS_SHIPMENT_VIEW("logistics:shipment:view", "View Shipments"),
    LOGISTICS_SHIPMENT_CREATE("logistics:shipment:create", "Create Shipments"),
    LOGISTICS_SHIPMENT_UPDATE("logistics:shipment:update", "Update Shipments"),
    
    // Traceability Module Permissions
    TRACEABILITY_READ("traceability:read", "View Traceability Data"),
    TRACEABILITY_CREATE("traceability:create", "Create Traceability Records"),
    TRACEABILITY_UPDATE("traceability:update", "Update Traceability Records"),
    TRACEABILITY_DELETE("traceability:delete", "Delete Traceability Records"),
    TRACEABILITY_BATCH_VIEW("traceability:batch:view", "View Batch Information"),
    TRACEABILITY_BATCH_CREATE("traceability:batch:create", "Create Batch Information"),
    TRACEABILITY_BATCH_UPDATE("traceability:batch:update", "Update Batch Information"),
    TRACEABILITY_GENEALOGY_VIEW("traceability:genealogy:view", "View Genealogy"),
    TRACEABILITY_GENEALOGY_CREATE("traceability:genealogy:create", "Create Genealogy"),
    TRACEABILITY_RECALL_VIEW("traceability:recall:view", "View Recalls"),
    TRACEABILITY_RECALL_CREATE("traceability:recall:create", "Create Recalls"),
    TRACEABILITY_RECALL_UPDATE("traceability:recall:update", "Update Recalls"),
    
    // Reports Module Permissions
    REPORTS_READ("reports:read", "View Reports"),
    REPORTS_CREATE("reports:create", "Create Reports"),
    REPORTS_EXPORT("reports:export", "Export Reports"),
    REPORTS_INVENTORY_VIEW("reports:inventory:view", "View Inventory Reports"),
    REPORTS_PRODUCTION_VIEW("reports:production:view", "View Production Reports"),
    REPORTS_SALES_VIEW("reports:sales:view", "View Sales Reports"),
    REPORTS_QUALITY_VIEW("reports:quality:view", "View Quality Reports"),
    REPORTS_PROCUREMENT_VIEW("reports:procurement:view", "View Procurement Reports"),
    REPORTS_WAREHOUSE_VIEW("reports:warehouse:view", "View Warehouse Reports"),
    REPORTS_ENGINEERING_VIEW("reports:engineering:view", "View Engineering Reports"),
    REPORTS_MAINTENANCE_VIEW("reports:maintenance:view", "View Maintenance Reports"),
    REPORTS_LOGISTICS_VIEW("reports:logistics:view", "View Logistics Reports"),
    REPORTS_TRACEABILITY_VIEW("reports:traceability:view", "View Traceability Reports"),
    
    // Settings Module Permissions
    SETTINGS_READ("settings:read", "View Settings"),
    SETTINGS_UPDATE("settings:update", "Update Settings"),
    SETTINGS_CREATE("settings:create", "Create Settings"),
    SETTINGS_DELETE("settings:delete", "Delete Settings"),
    SETTINGS_COMPANY_VIEW("settings:company:view", "View Company Settings"),
    SETTINGS_COMPANY_UPDATE("settings:company:update", "Update Company Settings"),
    SETTINGS_PLANTS_VIEW("settings:plants:view", "View Plants"),
    SETTINGS_PLANTS_CREATE("settings:plants:create", "Create Plants"),
    SETTINGS_PLANTS_UPDATE("settings:plants:update", "Update Plants"),
    SETTINGS_PLANTS_DELETE("settings:plants:delete", "Delete Plants"),
    SETTINGS_NUMBERING_VIEW("settings:numbering:view", "View Numbering"),
    SETTINGS_NUMBERING_UPDATE("settings:numbering:update", "Update Numbering"),
    SETTINGS_INTEGRATIONS_VIEW("settings:integrations:view", "View Integrations"),
    SETTINGS_INTEGRATIONS_UPDATE("settings:integrations:update", "Update Integrations"),
    
    // Audit Permissions
    AUDIT_READ("audit:read", "View Audit Logs"),
    AUDIT_EXPORT("audit:export", "Export Audit Logs");

    private final String code;
    private final String description;

    Permission(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if this permission belongs to a specific module
     */
    public boolean belongsToModule(String module) {
        return code.startsWith(module + ":");
    }

    /**
     * Get the module name for this permission
     */
    public String getModule() {
        int colonIndex = code.indexOf(':');
        return colonIndex > 0 ? code.substring(0, colonIndex) : "system";
    }

    /**
     * Get the operation type for this permission
     */
    public String getOperation() {
        int colonIndex = code.indexOf(':');
        return colonIndex > 0 ? code.substring(colonIndex + 1) : code;
    }
}