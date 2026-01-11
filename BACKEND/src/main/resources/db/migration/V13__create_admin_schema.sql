-- Admin Module Database Schema
-- Creates tables for user management, roles, permissions, audit logging, and material master
-- Version: V13
-- Date: 2025-01-11
-- Assumes update_updated_at_column() function is available from earlier migrations

-- Admin Users table
-- Stores user information for the PCBXpress ERP system
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    employee_code VARCHAR(50),
    role VARCHAR(50),
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret VARCHAR(100),
    notes TEXT,
    
    CONSTRAINT chk_admin_users_failed_attempts CHECK (failed_login_attempts >= 0)
);

-- Admin Roles table
-- Stores role definitions with permissions and types
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    role_type VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    notes TEXT
);

-- Admin Permissions table
-- Stores system permissions that can be dynamically managed
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    module VARCHAR(50),
    operation VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    permission_type VARCHAR(50),
    display_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    notes TEXT,
    
    CONSTRAINT chk_admin_permissions_display_order CHECK (display_order IS NULL OR display_order > 0)
);

-- User Role Permissions bridge table
-- Manages many-to-many relationships between users, roles, and permissions
CREATE TABLE user_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES admin_permissions(id) ON DELETE CASCADE,
    granted_by VARCHAR(100),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    
    -- Ensure only one of user_id, role_id, or permission_id is set for different relationship types
    CONSTRAINT chk_user_role_permission_type 
        CHECK (
            (user_id IS NOT NULL AND role_id IS NULL AND permission_id IS NULL) OR
            (user_id IS NULL AND role_id IS NOT NULL AND permission_id IS NULL) OR
            (user_id IS NULL AND role_id IS NULL AND permission_id IS NOT NULL) OR
            (user_id IS NOT NULL AND role_id IS NOT NULL AND permission_id IS NULL) OR
            (user_id IS NOT NULL AND role_id IS NULL AND permission_id IS NOT NULL) OR
            (user_id IS NULL AND role_id IS NOT NULL AND permission_id IS NOT NULL)
        )
);

-- User Audit Log table
-- Tracks system activities and user actions for compliance and security
-- Note: This table is created in V1, so we only add additional indexes if needed
-- The table structure from V1 is compatible with our needs
-- Additional indexes for admin module performance
-- Note: action index already exists from V1, so we skip it
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON user_audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip_address ON user_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_agent ON user_audit_log(user_agent);

-- Admin Material Master table
-- Stores material specifications for PCB manufacturing
CREATE TABLE admin_material_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    material_type VARCHAR(100) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    
    -- Specifications
    thickness_mm DECIMAL(10,3),
    copper_oz DECIMAL(5,2),
    tg DECIMAL(5,1),
    material_class VARCHAR(100),
    finish VARCHAR(100),
    color VARCHAR(50),
    notes TEXT,
    
    -- Vendor Information
    preferred_vendor VARCHAR(200),
    vendor_part_no VARCHAR(100),
    lead_time_days INTEGER,
    
    -- Inventory Settings
    min_stock DECIMAL(10,3),
    reorder_point DECIMAL(10,3),
    
    -- Pricing
    currency VARCHAR(3),
    unit_price DECIMAL(15,2),
    
    -- Compliance
    is_rohs BOOLEAN NOT NULL DEFAULT true,
    is_reach BOOLEAN NOT NULL DEFAULT false,
    is_ul BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT chk_material_thickness CHECK (thickness_mm IS NULL OR thickness_mm >= 0),
    CONSTRAINT chk_material_copper_oz CHECK (copper_oz IS NULL OR copper_oz >= 0),
    CONSTRAINT chk_material_tg CHECK (tg IS NULL OR tg >= 0),
    CONSTRAINT chk_material_lead_time CHECK (lead_time_days IS NULL OR lead_time_days > 0),
    CONSTRAINT chk_material_min_stock CHECK (min_stock IS NULL OR min_stock >= 0),
    CONSTRAINT chk_material_reorder_point CHECK (reorder_point IS NULL OR reorder_point >= 0),
    CONSTRAINT chk_material_unit_price CHECK (unit_price IS NULL OR unit_price >= 0)
);

-- Indexes for performance optimization

-- Admin Users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_employee_code ON admin_users(employee_code);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_department ON admin_users(department);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON admin_users(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_updated_at ON admin_users(updated_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_last_login ON admin_users(last_login_at);

-- Admin Roles indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_key ON admin_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON admin_roles(name);
CREATE INDEX IF NOT EXISTS idx_admin_roles_status ON admin_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_roles_type ON admin_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_admin_roles_department ON admin_roles(department);
CREATE INDEX IF NOT EXISTS idx_admin_roles_created_at ON admin_roles(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_roles_updated_at ON admin_roles(updated_at);

-- Admin Permissions indexes
CREATE INDEX IF NOT EXISTS idx_admin_permissions_code ON admin_permissions(code);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_name ON admin_permissions(name);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_module ON admin_permissions(module);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_operation ON admin_permissions(operation);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_status ON admin_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_type ON admin_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_is_system ON admin_permissions(is_system);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_created_at ON admin_permissions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_updated_at ON admin_permissions(updated_at);

-- User Role Permissions indexes
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_user_id ON user_role_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_role_id ON user_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_permission_id ON user_role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_active ON user_role_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_granted_at ON user_role_permissions(granted_at);
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_expires_at ON user_role_permissions(expires_at);

-- User Audit Log indexes (only create new ones that don't exist)
-- Note: idx_audit_log_user_id, idx_audit_log_action, idx_audit_log_created_at already exist from V1
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON user_audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip_address ON user_audit_log(ip_address);

-- Admin Material Master indexes
CREATE INDEX IF NOT EXISTS idx_material_code ON admin_material_master(material_code);
CREATE INDEX IF NOT EXISTS idx_material_name ON admin_material_master(name);
CREATE INDEX IF NOT EXISTS idx_material_type ON admin_material_master(material_type);
CREATE INDEX IF NOT EXISTS idx_material_status ON admin_material_master(status);
CREATE INDEX IF NOT EXISTS idx_material_vendor ON admin_material_master(preferred_vendor);
CREATE INDEX IF NOT EXISTS idx_material_created_at ON admin_material_master(created_at);
CREATE INDEX IF NOT EXISTS idx_material_updated_at ON admin_material_master(updated_at);

-- Check constraints for enum values

-- Admin Users role constraints
ALTER TABLE admin_users 
    ADD CONSTRAINT chk_admin_users_role 
    CHECK (role IN ('ADMIN', 'SALES_MANAGER', 'SALES_REP', 'ENGINEERING_MANAGER', 'CAM_ENGINEER', 'DFM_ENGINEER', 'PRODUCTION_MANAGER', 'SUPERVISOR', 'OPERATOR', 'QUALITY_MANAGER', 'QA_INSPECTOR', 'INVENTORY_MANAGER', 'STORE_KEEPER', 'PROCUREMENT_MANAGER', 'PURCHASER', 'WAREHOUSE_MANAGER', 'LOGISTICS_COORDINATOR', 'MAINTENANCE_MANAGER', 'MAINTENANCE_TECH', 'TRACABILITY_SPECIALIST', 'VIEWER'));

-- Admin Roles type constraints
ALTER TABLE admin_roles 
    ADD CONSTRAINT chk_admin_roles_type 
    CHECK (role_type IN ('SYSTEM', 'CUSTOM', 'DEPARTMENTAL', 'PROJECT'));

-- Admin Permissions type constraints
ALTER TABLE admin_permissions 
    ADD CONSTRAINT chk_admin_permissions_type 
    CHECK (permission_type IN ('READ', 'WRITE', 'DELETE', 'ADMIN', 'CUSTOM'));

-- Note: User Audit Log severity constraint skipped - severity column doesn't exist in V1 table

-- Admin Material Master type and status constraints
ALTER TABLE admin_material_master 
    ADD CONSTRAINT chk_material_type 
    CHECK (material_type IN ('COPPER_CLAD_LAMINATE', 'PREPREG', 'COPPER_FOIL', 'SOLDER_MASK', 'SILKSCREEN_INK', 'SURFACE_FINISH_CHEMICAL', 'DRILL_BIT', 'TOOLING_CONSUMABLE', 'PACKAGING', 'OTHER'));

ALTER TABLE admin_material_master 
    ADD CONSTRAINT chk_material_status 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'OBSOLETE'));

-- Triggers for updated_at timestamps
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_permissions_updated_at
    BEFORE UPDATE ON admin_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_material_master_updated_at
    BEFORE UPDATE ON admin_material_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE admin_users IS 'Stores user information for the PCBXpress ERP system';
COMMENT ON TABLE admin_roles IS 'Stores role definitions with permissions and types';
COMMENT ON TABLE admin_permissions IS 'Stores system permissions that can be dynamically managed';
COMMENT ON TABLE user_role_permissions IS 'Manages many-to-many relationships between users, roles, and permissions';
COMMENT ON TABLE user_audit_log IS 'Tracks system activities and user actions for compliance and security';
COMMENT ON TABLE admin_material_master IS 'Stores material specifications for PCB manufacturing';

COMMENT ON COLUMN admin_users.username IS 'Unique username for system login';
COMMENT ON COLUMN admin_users.role IS 'User role in the system (ADMIN, SALES_MANAGER, etc.)';
COMMENT ON COLUMN admin_users.is_active IS 'Indicates if user account is active';
COMMENT ON COLUMN admin_users.failed_login_attempts IS 'Number of failed login attempts';
COMMENT ON COLUMN admin_users.two_factor_enabled IS 'Indicates if two-factor authentication is enabled';

COMMENT ON COLUMN admin_roles.role_key IS 'Unique key identifier for the role';
COMMENT ON COLUMN admin_roles.role_type IS 'Type of role (SYSTEM, CUSTOM, DEPARTMENTAL, PROJECT)';
COMMENT ON COLUMN admin_roles.is_active IS 'Indicates if role is active';

COMMENT ON COLUMN admin_permissions.code IS 'Unique permission code';
COMMENT ON COLUMN admin_permissions.module IS 'Module this permission belongs to';
COMMENT ON COLUMN admin_permissions.operation IS 'Operation this permission allows';
COMMENT ON COLUMN admin_permissions.is_system IS 'Indicates if this is a system-defined permission';
COMMENT ON COLUMN admin_permissions.permission_type IS 'Type of permission (READ, WRITE, DELETE, ADMIN, CUSTOM)';

COMMENT ON COLUMN user_role_permissions.user_id IS 'User ID for direct permission assignment';
COMMENT ON COLUMN user_role_permissions.role_id IS 'Role ID for role-based permission assignment';
COMMENT ON COLUMN user_role_permissions.permission_id IS 'Permission ID for direct permission assignment';
COMMENT ON COLUMN user_role_permissions.granted_by IS 'User who granted this permission';

-- Note: User Audit Log comments skipped - columns don't match V1 table structure
-- V1 table has: id, user_id, action, resource_type, resource_id, ip_address, user_agent, request_data, response_data, created_at

COMMENT ON COLUMN admin_material_master.material_code IS 'Unique code for the material';
COMMENT ON COLUMN admin_material_master.material_type IS 'Type of material (COPPER_CLAD_LAMINATE, PREPREG, etc.)';
COMMENT ON COLUMN admin_material_master.status IS 'Status of the material (ACTIVE, INACTIVE, OBSOLETE)';
COMMENT ON COLUMN admin_material_master.thickness_mm IS 'Material thickness in millimeters';
COMMENT ON COLUMN admin_material_master.copper_oz IS 'Copper thickness in ounces';
COMMENT ON COLUMN admin_material_master.tg IS 'Glass transition temperature';
COMMENT ON COLUMN admin_material_master.is_rohs IS 'Indicates if material is RoHS compliant';
COMMENT ON COLUMN admin_material_master.is_reach IS 'Indicates if material is REACH compliant';
COMMENT ON COLUMN admin_material_master.is_ul IS 'Indicates if material has UL certification';

-- Display completion message
SELECT 'Admin module tables created successfully' AS migration_status;