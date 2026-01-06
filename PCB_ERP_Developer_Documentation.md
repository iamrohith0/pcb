# PCB Manufacturing ERP System - Developer Documentation

██████╗  ███████╗ ███████╗ ██████╗  ██████╗  ███████╗ ██████╗  ██╗       ██████╗  ██╗   ██╗
██╔══██╗ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔══██╗ ██╔════╝ ██╔══██╗ ██║      ██╔═══██╗ ╚██╗ ██╔╝
██║  ██║ █████╗   █████╗   ██████╔╝ ██║  ██║ █████╗   ██████╔╝ ██║      ██║   ██║  ╚████╔╝ 
██║  ██║ ██╔══╝   ██╔══╝   ██╔═══╝  ██║  ██║ ██╔══╝   ██╔═══╝  ██║      ██║   ██║   ╚██╔╝  
██║  ██║ ██║      ██║      ██║      ██║  ██║ ██║      ██║      ██║      ██║   ██║    ██║   
██████╔╝ ███████╗ ███████╗ ██║      ██████╔╝ ███████╗ ██║      ███████╗ ╚██████╔╝    ██║   
╚═════╝  ╚══════╝ ╚══════╝ ╚═╝      ╚═════╝  ╚══════╝ ╚═╝      ╚══════╝  ╚═════╝     ╚═╝   



## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Module Breakdown](#module-breakdown)
5. [API Service Structure](#api-service-structure)
6. [Component Organization](#component-organization)
7. [Data Flow Patterns](#data-flow-patterns)
8. [Business Domain Concepts](#business-domain-concepts)
9. [Development Setup](#development-setup)
10. [Coding Conventions](#coding-conventions)
11. [Deployment](#deployment)

## Project Overview

### What is PCBxpress ERP?

PCBxpress is a comprehensive **React-based Enterprise Resource Planning (ERP) system** specifically designed for **Printed Circuit Board (PCB) manufacturing** operations. It provides end-to-end management of PCB production workflows from customer RFQ to final dispatch.

### Core Objectives

- **On-time delivery** - Track production schedules and deadlines
- **Full traceability** - Order → Panel → Lot → Process → Inspection
- **Quality assurance** - Integrated quality management with AOI/E-test
- **Inventory optimization** - Real-time stock tracking and reordering
- **Process standardization** - Consistent workflows across departments
- **Data-driven decisions** - Comprehensive reporting and analytics

### Key Differentiators

Unlike generic ERPs, PCBxpress understands PCB manufacturing constraints:
- Multilayer stackups and panelization
- Process-stage WIP tracking
- Material chemistry and specifications
- Tight quality checkpoints
- Engineering change management

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.2.0 | UI framework |
| **React Router** | ^6.16.0 | Client-side routing |
| **Tailwind CSS** | ^3.3.3 | Utility-first CSS framework |
| **Radix UI** | ^1.0.0+ | Accessible UI primitives |
| **Recharts** | ^3.1.2 | Data visualization |
| **TanStack Query** | ^5.90.6 | Server state management |
| **Mantine** | ^8.2.7 | Component library |
| **Lucide React** | ^0.285.0 | Icon library |
| **Date-fns** | ^4.1.0 | Date manipulation |
| **Day.js** | ^1.11.13 | Lightweight date library |

### Build Tools & Development

| Tool | Purpose |
|------|---------|
| **Vite** | Fast build tool and dev server |
| **ESLint** | Code linting |
| **PostCSS** | CSS processing |
| **Autoprefixer** | CSS vendor prefixes |
| **Node.js** | Runtime environment |

### Backend Integration

The frontend is designed to integrate with a RESTful API backend:
- **Base URL**: `http://localhost:8000/api` (configurable via environment)
- **Authentication**: JWT tokens with automatic refresh
- **Error handling**: Centralized with user-friendly messages

## System Architecture

### Architecture Pattern

PCBxpress follows a **component-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Components    │  │     Pages       │  │   Layouts    │ │
│  │                 │  │                 │  │              │ │
│  │ • UI Components │  │ • Route Pages   │  │ • Dashboard  │ │
│  │ • Forms         │  │ • Auth Pages    │  │ • Sidebar    │ │
│  │ • Cards         │  │ • Error Pages   │  │ • Topbar     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Services      │  │   Context       │  │   Utilities  │ │
│  │                 │  │                 │  │              │ │
│  │ • API Calls     │  │ • Auth Context  │  │ • Formatters │ │
│  │ • Data Models   │  │ • User Context  │  │ • Validators │ │
│  │ • Error Handling│  │ • Theme Context │  │ • Helpers    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   API Layer     │  │   HTTP Client   │  │   Storage    │ │
│  │                 │  │                 │  │              │ │
│  │ • Axios Config  │  │ • Interceptors  │  │ • Local      │ │
│  │ • Endpoints     │  │ • Auth Headers  │  │ • Session    │ │
│  │ • Response      │  │ • Error Handling│  │ • Cookies    │ │
│  │   Processing    │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### State Management Strategy

1. **Server State** (TanStack Query)
   - API data caching and synchronization
   - Background refetching
   - Optimistic updates
   - Error boundaries

2. **Client State** (React Context)
   - Authentication state
   - User preferences
   - UI state (modals, notifications)

3. **Local State** (React useState/useReducer)
   - Component-specific state
   - Form state
   - Temporary UI state

### Routing Strategy

- **Protected Routes**: Authenticated users only
- **Public Routes**: Login, forgot password, etc.
- **Role-based Access**: Different views based on user permissions
- **Nested Routes**: Hierarchical URL structure
- **Lazy Loading**: Code splitting for performance

## Module Breakdown

### 1. Dashboard & Analytics

**Location**: `src/pages/dashboard/`

**Purpose & Business Value**:
The Dashboard serves as the central command center for PCB manufacturing operations, providing executives and managers with real-time visibility into key performance indicators across all departments. This module transforms raw operational data into actionable business intelligence, enabling proactive decision-making and rapid response to production issues.

**Key Workflows & Processes**:
- **Morning Production Review**: Managers start their day by reviewing overnight production metrics, WIP status, and quality trends
- **Daily KPI Monitoring**: Real-time tracking of on-time delivery rates, first-pass yield, and capacity utilization
- **Alert Response**: Automated notifications for critical events like material shortages, quality excursions, or equipment downtime
- **Performance Trending**: Historical analysis to identify patterns and improvement opportunities

**Important Business Rules & Logic**:
- **KPI Calculation**: On-time delivery = (Orders delivered on time / Total orders due) × 100%
- **Alert Thresholds**: Configurable limits for inventory levels, quality defect rates, and production delays
- **Data Refresh**: Real-time updates every 30 seconds for critical metrics, hourly for trend data
- **Role-Based Views**: Different dashboard layouts based on user permissions and responsibilities

**Integration Points with Other Modules**:
- **Sales**: Pulls order status, delivery dates, and customer information
- **Production**: Real-time WIP (Work in Progress) tracking, machine utilization, and capacity data
- **Quality**: Defect rates, inspection results, and NCR status
- **Inventory**: Stock levels, material availability, and reorder point status
- **Engineering**: DFM approval status and engineering change impact

**Key Data Entities & Relationships**:
- **KPI Metrics**: Production efficiency, quality yield, delivery performance
- **Alerts**: Critical notifications with severity levels and action required
- **Trends**: Historical data points for performance analysis
- **User Preferences**: Customizable dashboard layouts and metric selections

**User Roles & Permissions**:
- **Executives**: High-level KPIs, financial metrics, overall plant performance
- **Department Managers**: Detailed metrics for their specific areas
- **Supervisors**: Operational data, real-time alerts, team performance
- **Operators**: Limited view showing only relevant production data

**Real-World PCB Manufacturing Scenarios**:
- **Material Shortage Alert**: System flags when copper foil inventory drops below reorder point, preventing production delays
- **Quality Trend Analysis**: Identifies increasing defect rates in soldermask application, prompting process investigation
- **Capacity Planning**: Shows machine utilization trends to optimize scheduling and prevent bottlenecks
- **Customer Delivery Tracking**: Monitors critical orders with tight deadlines requiring special attention

**Components**:
- `Dashboard.jsx` - Main dashboard with KPIs and real-time data visualization
- `KpiCard.jsx` - Individual KPI display with trend indicators and target comparisons
- `QuickActionCard.jsx` - Action shortcuts for common tasks like creating work orders or checking inventory
- `InventoryAlertCard.jsx` - Stock alerts with severity indicators and recommended actions
- `ProductionStatusCard.jsx` - Real-time production floor status and bottleneck identification
- `QualityMetricsCard.jsx` - Quality performance metrics with drill-down capabilities

### 2. Admin Module

**Location**: `src/pages/admin/`, `src/services/users.service.js`, `src/services/roles.service.js`, `src/services/permissions.service.js`

**Purpose & Business Value**:
The Admin Module is the central governance hub for PCBxpress ERP, providing comprehensive user management, role-based access control, and system administration capabilities. This module ensures secure, compliant, and efficient operation of the entire ERP system by managing user access, permissions, and system configuration. It directly impacts data security, regulatory compliance, and operational efficiency by preventing unauthorized access and ensuring users have appropriate system privileges.

**Key Workflows & Processes**:
- **User Lifecycle Management**: User creation → Role assignment → Permission configuration → Access provisioning → Deactivation/termination
- **Role-Based Access Control**: Role definition → Permission mapping → User assignment → Access validation → Periodic review
- **Permission Management**: Permission creation → Role association → User inheritance → Access auditing → Compliance verification
- **System Administration**: User activity monitoring → Security policy enforcement → Audit trail maintenance → System health monitoring

**Important Business Rules & Logic**:
- **Principle of Least Privilege**: Users receive minimum permissions necessary for their job functions
- **Role Hierarchy**: Clear role structure with escalation paths and approval workflows
- **Access Review**: Regular permission audits with automated compliance reporting
- **User Status Management**: Active/inactive states with automatic access revocation for terminated users
- **Audit Trail**: Complete logging of user actions, permission changes, and system access
- **Password Security**: Enforced password complexity, expiration, and multi-factor authentication

**Integration Points with Other Modules**:
- **All Operational Modules**: User authentication and authorization for every system interaction
- **Sales**: Sales role permissions for customer data, pricing, and order management
- **Production**: Operator and supervisor access levels for work order management and shop floor control
- **Quality**: Inspector permissions for quality data entry, NCR management, and compliance reporting
- **Inventory**: Warehouse staff permissions for stock management and material tracking
- **Engineering**: CAM engineer access for design validation and manufacturing data management

**Key Data Entities & Relationships**:
- **Users**: Complete user profiles with authentication, contact information, and employment details
- **Roles**: Hierarchical role definitions with associated permissions and responsibilities
- **Permissions**: Granular system permissions mapped to specific functions and data access levels
- **User-Roles**: Many-to-many relationships between users and roles with assignment tracking
- **Role-Permissions**: Role-to-permission mappings defining access control matrices
- **Audit Logs**: Comprehensive logs of user activities, permission changes, and system events

**User Roles & Permissions**:
- **System Administrators**: Full system access, user management, role creation, and system configuration
- **Department Managers**: User management within their departments, role assignment, and access monitoring
- **Department Users**: Standard users with role-based access to their respective modules
- **Auditors**: Read-only access to audit logs and compliance reports
- **External Users**: Limited access for customers, suppliers, or partners as needed

**Real-World PCB Manufacturing Scenarios**:
- **New Employee Onboarding**: HR creates user account → Assigns role based on job function → System automatically grants appropriate permissions → User can access relevant modules
- **Role Change Management**: Employee promotion → Manager updates role assignment → System automatically adjusts permissions → Audit trail records the change
- **Security Incident Response**: Suspicious activity detected → Administrator reviews audit logs → Can immediately disable user account → Investigates access patterns and permissions
- **Compliance Audit Preparation**: Auditor requests access logs → System generates comprehensive reports → Shows user activities, permission changes, and system access over specified period
- **Department Restructuring**: New department created → Administrator defines new roles → Maps permissions to new organizational structure → Users reassigned with updated access

**Business Logic Examples**:
```javascript
// User role assignment workflow
const userRoleWorkflow = {
  user_creation: 'HR creates user with basic profile information',
  role_assignment: 'Manager assigns appropriate role based on job function',
  permission_granting: 'System automatically grants permissions associated with the role',
  access_validation: 'System validates access during login and critical operations',
  periodic_review: 'Regular audits ensure permissions remain appropriate',
  termination: 'Immediate access revocation upon user status change to inactive'
};

// Permission hierarchy for PCB manufacturing
const permissionHierarchy = {
  system_admin: 'Full system access, user management, configuration',
  plant_manager: 'All department access, production oversight, reporting',
  department_manager: 'Department-specific access, team management, approvals',
  supervisor: 'Operational access, team oversight, quality control',
  operator: 'Task-specific access, data entry, status updates',
  quality_inspector: 'Quality data access, inspection workflows, compliance'
};

// Access control validation
const accessControlLogic = {
  authentication: 'Verify user identity through credentials and MFA',
  authorization: 'Check user roles and permissions for requested action',
  audit_logging: 'Record all access attempts and permission checks',
  exception_handling: 'Deny access with clear error messages for unauthorized requests'
};
```

**Modules**:
- **User Management** (`/admin/users/`)
  - Complete user lifecycle management from creation to termination
  - User profile management with contact information and employment details
  - User status tracking (active/inactive) with automatic access control
  - Bulk user operations for efficient administration
  - User activity monitoring and access pattern analysis

- **Role Management** (`/admin/roles/`)
  - Role definition and hierarchy management
  - Role-based permission assignment and inheritance
  - Role validation and conflict resolution
  - Role usage tracking and optimization recommendations
  - Role template creation for standardized departmental roles

- **Permission Management** (`/admin/permissions/`)
  - Granular permission definition for all system functions
  - Permission auditing and compliance verification
  - Permission conflict detection and resolution
  - Permission inheritance and override mechanisms
  - Real-time permission validation and enforcement

- **Audit & Compliance** (`/admin/audit-logs/`)
  - Comprehensive audit trail for all user activities
  - Security event monitoring and alerting
  - Compliance report generation for regulatory requirements
  - Access pattern analysis for security optimization
  - Audit log retention and archival management

- **System Administration** (`/admin/settings/`)
  - System-wide configuration and settings management
  - Security policy definition and enforcement
  - Integration management for external systems
  - System health monitoring and performance optimization
  - Backup and disaster recovery configuration

### 3. Super Settings Module

**Location**: `src/pages/settings/`, `src/services/settings.service.js`

**Purpose & Business Value**:
The Super Settings Module is the comprehensive configuration hub for PCBxpress ERP, providing centralized management of all system-wide settings, company configuration, integrations, numbering systems, and plant management. This module ensures consistent system behavior, accurate business processes, and seamless integration with external systems. It directly impacts operational efficiency, data accuracy, and system reliability by providing a single source of truth for all configuration parameters.

**Key Workflows & Processes**:
- **Company Configuration**: Company profile setup → Branding configuration → Compliance settings → Document templates → System defaults
- **Integration Management**: Integration discovery → Configuration setup → Connection testing → Data mapping → Monitoring and maintenance
- **Numbering System Management**: Document series definition → Format configuration → Sequence management → Reset rules → Validation and enforcement
- **Plant Management**: Plant creation → Location configuration → Capacity planning → Resource allocation → Operational parameters

**Important Business Rules & Logic**:
- **Configuration Validation**: All settings validated against business rules and system requirements
- **Change Management**: Configuration changes require approval workflows for critical settings
- **Version Control**: Configuration changes tracked with rollback capabilities
- **Integration Monitoring**: Real-time monitoring of integration health and data synchronization
- **Numbering Integrity**: Document numbering sequences maintained with conflict prevention
- **Plant Configuration**: Plant settings optimized for PCB manufacturing workflows

**Integration Points with Other Modules**:
- **All Modules**: System-wide settings affect behavior across all operational modules
- **Sales**: Company profile and branding used in customer-facing documents
- **Production**: Plant configuration and capacity settings drive production planning
- **Inventory**: Numbering systems used for inventory tracking and document generation
- **Quality**: Compliance settings and document templates used in quality processes
- **Finance**: Integration settings enable seamless financial data exchange

**Key Data Entities & Relationships**:
- **Company Settings**: Complete company profile, branding, compliance information, and operational parameters
- **Integration Configurations**: Connection details, data mapping rules, synchronization schedules, and error handling
- **Numbering Series**: Document type configurations, format rules, sequence management, and validation logic
- **Plant Configurations**: Plant details, location information, capacity parameters, operational settings, and resource allocation
- **System Preferences**: Global system settings, default values, business rules, and configuration parameters

**User Roles & Permissions**:
- **System Administrators**: Full access to all configuration settings and system parameters
- **Plant Managers**: Access to plant-specific configurations and operational settings
- **Integration Administrators**: Specialized access for integration management and monitoring
- **Configuration Auditors**: Read-only access for configuration review and compliance verification
- **Department Managers**: Limited access to department-specific settings and preferences

**Real-World PCB Manufacturing Scenarios**:
- **New Plant Setup**: Administrator configures new manufacturing facility → Sets up plant-specific numbering sequences → Configures integration with plant equipment → Establishes capacity parameters → Enables production operations
- **Integration with Accounting System**: Administrator configures Tally/QuickBooks integration → Maps ERP accounts to accounting ledgers → Sets up automatic invoice synchronization → Monitors data flow and resolves issues
- **Document Numbering Standardization**: Administrator defines company-wide numbering formats → Configures reset rules for fiscal year → Validates sequence integrity → Ensures compliance with document control requirements
- **Compliance Configuration**: Administrator configures RoHS/REACH compliance settings → Sets up certificate generation templates → Configures audit trail requirements → Ensures regulatory compliance
- **System Migration**: Administrator configures new system settings → Migrates existing configurations → Validates integration compatibility → Ensures seamless transition

**Business Logic Examples**:
```javascript
// Company configuration workflow
const companyConfigWorkflow = {
  company_profile: 'Define company name, address, contact information, and legal details',
  branding_setup: 'Configure logo, colors, document templates, and visual identity',
  compliance_config: 'Set up regulatory requirements, certificate templates, and audit settings',
  integration_setup: 'Configure external system connections and data exchange parameters',
  system_defaults: 'Establish default values, business rules, and operational parameters'
};

// Numbering system management
const numberingSystemLogic = {
  document_types: 'Define numbering rules for RFQ, Quotation, Work Order, Invoice, etc.',
  format_configuration: 'Set up prefix, suffix, padding, separators, and sequence rules',
  reset_rules: 'Configure sequence reset based on daily, monthly, or yearly cycles',
  validation_rules: 'Ensure unique numbering and prevent conflicts or duplicates',
  audit_trail: 'Track numbering changes and sequence modifications for compliance'
};

// Integration management workflow
const integrationWorkflow = {
  discovery: 'Identify required integrations with external systems (accounting, CRM, etc.)',
  configuration: 'Set up connection parameters, authentication, and data mapping',
  testing: 'Validate integration functionality and data accuracy',
  monitoring: 'Monitor integration health, data synchronization, and error handling',
  maintenance: 'Update configurations, handle errors, and optimize performance'
};
```

**Modules**:
- **Company Configuration** (`/settings/company/`)
  - Complete company profile management with legal and operational details
  - Branding configuration including logos, colors, and document templates
  - Compliance settings for regulatory requirements and industry standards
  - System defaults and operational parameters configuration
  - Document template management for standardized output

- **Integration Management** (`/settings/integrations/`)
  - Accounting system integration (Tally, QuickBooks, Zoho Books, SAP)
  - Email and communication system configuration
  - Barcode and scanning system integration
  - ERP webhooks and API endpoint management
  - Integration monitoring and error handling

- **Numbering System** (`/settings/numbering/`)
  - Document series configuration for all document types
  - Format definition with prefixes, suffixes, padding, and separators
  - Sequence management with automatic increment and conflict prevention
  - Reset rules for different time periods (daily, monthly, yearly)
  - Validation and integrity checking for numbering sequences

- **Plant Management** (`/settings/plants/`)
  - Plant creation and configuration with location details
  - Capacity planning and resource allocation settings
  - Shift scheduling and working hours configuration
  - Operational parameters and manufacturing settings
  - Plant-specific numbering and document configuration

- **System Preferences** (`/settings/system/`)
  - Global system settings and default values
  - Business rule configuration and validation rules
  - User interface preferences and customization options
  - Security settings and access control parameters
  - Performance optimization and system tuning

**Configuration Management Best Practices**:
- **Change Control**: All configuration changes require approval and documentation
- **Backup and Recovery**: Regular configuration backups with tested recovery procedures
- **Testing Environment**: Configuration changes tested in staging before production deployment
- **Documentation**: Complete documentation of all configuration settings and their purposes
- **Monitoring**: Continuous monitoring of configuration health and system performance
- **Compliance**: Regular audits to ensure configuration compliance with industry standards

**Integration with PCB Manufacturing Workflows**:
- **Document Control**: Numbering systems ensure traceability and compliance with document control requirements
- **Production Planning**: Plant configurations optimize capacity planning and resource allocation
- **Quality Management**: Compliance settings support quality system requirements and audit readiness
- **Financial Integration**: Accounting integrations ensure accurate financial reporting and compliance
- **Supply Chain Management**: Integration settings enable seamless supplier and customer communication

### 4. Sales Management

**Location**: `src/pages/sales/`

**Purpose & Business Value**:
The Sales Management module serves as the customer-facing gateway to the PCB manufacturing process, transforming customer requirements into production-ready orders. This module is critical for maintaining strong customer relationships, ensuring accurate order capture, and providing the foundation for successful production planning. It directly impacts revenue generation and customer satisfaction.

**Key Workflows & Processes**:
- **RFQ to Quote Process**: Customer requirements → Technical validation → Cost calculation → Quote generation → Approval workflow
- **Order Conversion**: Approved quotes → Sales order creation → Production scheduling → Material planning
- **Customer Lifecycle Management**: New customer onboarding → Order history tracking → Account management → Payment processing
- **Pricing Strategy**: Material cost analysis → Labor estimation → Margin calculation → Competitive pricing

**Important Business Rules & Logic**:
- **Quote Validity**: Quotes typically expire after 30-90 days based on material price volatility
- **Approval Thresholds**: Quotes above certain values require managerial approval
- **Customer Credit Limits**: Orders blocked if they exceed customer credit terms
- **Revision Control**: Quote revisions maintain audit trail for pricing changes
- **Material Price Updates**: Automatic price recalculation based on current material costs

**Integration Points with Other Modules**:
- **Engineering**: Technical feasibility assessment, DFM requirements, stackup validation
- **Inventory**: Material availability checking, lead time calculation
- **Procurement**: Supplier pricing, material cost updates
- **Production**: Capacity planning, scheduling constraints
- **Finance**: Credit checks, payment terms, invoicing

**Key Data Entities & Relationships**:
- **RFQ (Request for Quotation)**: Customer requirements, technical specifications, target quantities
- **Quote**: Pricing breakdown, terms, validity period, approval status
- **Sales Order**: Confirmed order details, delivery schedule, payment terms
- **Customer**: Account information, credit history, contact details
- **Pricing**: Material costs, labor rates, overhead allocation, profit margins

**User Roles & Permissions**:
- **Sales Representatives**: Create RFQs, generate quotes, manage customer accounts
- **Sales Managers**: Approve quotes above thresholds, override pricing, manage team
- **Sales Administrators**: Process orders, handle customer communications, manage documentation
- **Customer Service**: Order tracking, status updates, issue resolution

**Real-World PCB Manufacturing Scenarios**:
- **Complex Multilayer Board**: Customer requests quote for 12-layer HDI board → Engineering validates feasibility → Procurement checks exotic material availability → Quote includes specialized tooling costs
- **High-Volume Production**: Customer provides annual forecast → Volume pricing tiers applied → Material contracts negotiated → Production capacity reserved
- **Prototype vs Production**: Customer requests prototype run → Different pricing structure applied → Tooling costs amortized → Transition plan to volume production
- **Engineering Change Impact**: Customer modifies design after quote approval → Re-pricing triggered → Lead time adjustment → Customer approval required

**Business Logic Examples**:
```javascript
// Quote approval workflow with escalation
const quoteApprovalWorkflow = {
  draft: 'Sales Rep creates quote with standard pricing',
  pending_approval: 'Manager approval required for quotes > $10,000',
  approved: 'Quote ready for customer review and order conversion',
  rejected: 'Quote needs revision - pricing or technical issues',
  expired: 'Quote validity period has ended - requires renewal'
};

// Customer credit check logic
const creditCheckLogic = {
  new_customer: 'Require credit application and references',
  existing_customer: 'Check current balance vs credit limit',
  order_blocked: 'Order exceeds available credit - requires payment or limit increase',
  approved: 'Order can proceed to production planning'
};

// Material cost calculation
const materialCostCalculation = {
  base_material: 'Copper foil + substrate cost per square foot',
  processing_cost: 'Labor + machine time per operation',
  overhead_allocation: 'Factory overhead based on machine hours',
  profit_margin: 'Target margin percentage applied to total cost'
};
```

**Modules**:
- **RFQ Management** (`/sales/rfq/`)
  - Customer requirement capture with technical specifications
  - File upload for Gerber files, stackup requirements, and special instructions
  - Automatic material identification and preliminary cost estimation
  - Technical validation workflow with engineering collaboration

- **Quotation** (`/sales/quotations/`)
  - Detailed quote creation with cost breakdown by material, labor, and overhead
  - Multi-level approval workflow based on quote value and complexity
  - Quote revision tracking with change history and customer communication
  - Integration with CRM for customer relationship management

- **Sales Orders** (`/sales/orders/`)
  - Order confirmation with delivery scheduling and milestone tracking
  - Customer order history and trend analysis
  - Order modification workflow with change order management
  - Integration with production planning for capacity allocation

- **Invoicing** (`/sales/invoices/`)
  - Automated invoice generation based on order completion and delivery
  - Payment tracking with aging reports and collection management
  - Credit management with limit monitoring and exception handling
  - Integration with accounting systems for financial reporting

### 5. Engineering & CAM

**Location**: `src/pages/engineering/`

**Purpose & Business Value**:
The Engineering & CAM module is the technical bridge between customer designs and manufacturable products. This critical module ensures that customer PCB designs can be successfully produced while maintaining quality standards and cost efficiency. It prevents costly production errors and rework by validating designs before they reach the shop floor, directly impacting yield rates and customer satisfaction.

**Key Workflows & Processes**:
- **Design Validation Workflow**: Gerber file import → DFM analysis → Stackup verification → Manufacturing approval
- **Panelization Process**: Individual board design → Panel layout optimization → Material utilization analysis → Production panel creation
- **Engineering Change Management**: Design modification request → Impact analysis → Approval workflow → Version control → Production update
- **Tooling Data Generation**: Panel design → Drill data → Routing paths → Test points → Production documentation

**Important Business Rules & Logic**:
- **DFM Rule Compliance**: Minimum trace width, spacing, annular ring requirements based on technology capabilities
- **Material Optimization**: Panel utilization targets (typically 85-95%) to minimize waste and cost
- **Revision Control**: Sequential numbering with backward compatibility requirements
- **Approval Hierarchies**: Technical manager approval required for design changes affecting manufacturability
- **Version Management**: Clear version history with rollback capabilities for critical designs

**Integration Points with Other Modules**:
- **Sales**: Technical feasibility assessment during quoting process
- **Production**: Manufacturing instructions, routing definitions, and process parameters
- **Quality**: Inspection criteria, test point definitions, and quality checkpoints
- **Inventory**: Material specifications, component requirements, and BOM validation
- **Procurement**: Special material requirements and supplier qualifications

**Key Data Entities & Relationships**:
- **Gerber Files**: Layer definitions, copper patterns, soldermask, and silkscreen data
- **Stackup Configuration**: Layer sequence, material types, thickness specifications, and impedance requirements
- **Panel Layout**: Board arrangement, tooling holes, fiducials, and production rails
- **Engineering Changes**: Change requests, impact analysis, approval records, and implementation tracking
- **Manufacturing Data**: Drill files, routing paths, test points, and assembly instructions

**User Roles & Permissions**:
- **CAD Engineers**: Design validation, panelization, and tooling data creation
- **DFM Engineers**: Manufacturing rule checking and design optimization recommendations
- **Engineering Managers**: Change approval, design release, and technical oversight
- **Process Engineers**: Manufacturing process definition and optimization
- **Quality Engineers**: Inspection criteria definition and quality gate validation

**Real-World PCB Manufacturing Scenarios**:
- **High-Density Design**: Customer provides complex HDI design → DFM analysis identifies via placement issues → Engineering suggests design modifications → Panelization optimized for yield
- **Impedance Control**: Customer requires controlled impedance → Stackup validation confirms capability → Special material selection → Test coupon design for validation
- **Mixed Technology**: Customer needs both through-hole and surface mount → Panelization considers assembly constraints → Tooling design accommodates both processes
- **Quick Turn Prototype**: Customer requests 24-hour turnaround → Expedited DFM review → Simplified panelization → Priority tooling generation

**Key Concepts Explained**:
- **Stackup**: The complete layer configuration of a PCB, including copper layers, dielectric materials, prepreg, and core materials. Critical for electrical performance, thermal management, and mechanical stability.
- **Panelization**: The process of arranging multiple individual PCBs on a production panel to optimize material usage and manufacturing efficiency. Includes routing paths, tooling holes, and fiducial markers.
- **DFM Rules**: Manufacturing design constraints that ensure producibility, including minimum feature sizes, spacing requirements, and manufacturability guidelines specific to the facility's capabilities.
- **CAM Data**: Computer-aided manufacturing files that translate design data into machine instructions for drilling, routing, plating, and other production processes.

**Business Logic Examples**:
```javascript
// DFM validation rules
const dfmValidationRules = {
  minimum_trace_width: '0.004 inches for standard processes',
  minimum_spacing: '0.004 inches between conductors',
  annular_ring: 'Minimum 0.002 inches around drilled holes',
  via_size: 'Minimum 0.008 inches for mechanical drilling',
  aspect_ratio: 'Maximum 10:1 for reliable plating'
};

// Panel utilization optimization
const panelOptimizationLogic = {
  material_utilization: 'Target 90% or higher panel usage',
  board_spacing: 'Minimum 0.100 inches between boards',
  routing_channels: '0.060 inches for routing tools',
  tooling_holes: 'Standard 0.125 inches at panel corners',
  fiducials: 'Optical alignment markers at strategic locations'
};

// Engineering change workflow
const engineeringChangeWorkflow = {
  request_submitted: 'Customer or internal request for design change',
  impact_analysis: 'Review effect on manufacturability, cost, and schedule',
  approval_required: 'Technical manager approval for critical changes',
  implementation: 'Update design files and manufacturing data',
  validation: 'Verify changes don\'t introduce new issues',
  release_to_production: 'Final approval for manufacturing'
};
```

**Modules**:
- **DFM (Design for Manufacturing)** (`/engineering/dfm/`)
  - Automated Gerber file validation against manufacturing capabilities
  - Design rule checking with detailed violation reporting and suggestions
  - Stackup validation for impedance control and thermal requirements
  - Manufacturing feasibility assessment with cost impact analysis
  - Interactive design review tools for engineering collaboration

- **CAM (Computer-Aided Manufacturing)** (`/engineering/cam/`)
  - Tooling data generation including drill files, routing paths, and test points
  - Production output creation for various manufacturing processes
  - Process documentation generation with step-by-step instructions
  - Manufacturing data validation and verification
  - Integration with shop floor equipment for automated data transfer

- **Panelization** (`/engineering/panelization/`)
  - Intelligent panel layout design optimizing material utilization
  - Array configuration for different production volumes and technologies
  - Production efficiency analysis including setup time and throughput
  - Panel documentation with tooling specifications and handling instructions
  - Cost analysis comparing different panelization strategies

- **Revisions** (`/engineering/revisions/`)
  - Engineering change order (ECO) management with complete audit trail
  - Version control system with branching and merging capabilities
  - Approval workflow management with role-based permissions
  - Impact analysis tools for assessing change effects on production
  - Change implementation tracking and status monitoring

### 6. Production Management

**Location**: `src/pages/production/`

**Purpose & Business Value**:
The Production Management module is the operational heart of the PCB manufacturing system, transforming sales orders into finished products through efficient shop floor control. This module directly impacts on-time delivery performance, production efficiency, and resource utilization. It provides real-time visibility into manufacturing operations, enabling supervisors to optimize workflows and respond quickly to production issues.

**Key Workflows & Processes**:
- **Order Release Process**: Sales order → Work order creation → Material allocation → Shop floor release
- **Production Tracking**: Real-time WIP monitoring → Stage completion → Quality checkpoint validation → Next operation assignment
- **Capacity Management**: Demand forecasting → Resource planning → Schedule optimization → Bottleneck resolution
- **Material Flow**: Raw material issue → Process stage tracking → Component consumption → Finished goods completion

**Important Business Rules & Logic**:
- **Work Order Prioritization**: Orders prioritized by delivery date, customer importance, and material availability
- **Resource Allocation**: Machines and labor assigned based on skill requirements and capacity constraints
- **Quality Gates**: Mandatory quality checks at critical process stages before proceeding
- **Material Traceability**: Complete tracking of materials from issue to finished product
- **OEE Calculation**: Overall Equipment Effectiveness = Availability × Performance × Quality

**Integration Points with Other Modules**:
- **Sales**: Order details, delivery schedules, and customer requirements
- **Engineering**: Manufacturing instructions, routing definitions, and process parameters
- **Inventory**: Material availability, stock movements, and consumption tracking
- **Quality**: Inspection checkpoints, quality standards, and defect tracking
- **Warehouse**: Material picking, staging, and finished goods storage

**Key Data Entities & Relationships**:
- **Work Orders**: Order details, quantities, routing, and scheduling information
- **Operations**: Individual manufacturing steps with time standards and resource requirements
- **Resources**: Machines, labor, and tools with availability and capability data
- **WIP Tracking**: Real-time status of orders at each production stage
- **Production Events**: Time-stamped records of operations completed, delays, and quality issues

**User Roles & Permissions**:
- **Production Supervisors**: Order release, resource assignment, and production monitoring
- **Shop Floor Operators**: Operation completion reporting and issue logging
- **Production Planners**: Capacity planning, scheduling, and resource optimization
- **Shift Managers**: Shift-level production oversight and performance monitoring
- **Operations Managers**: Overall production performance analysis and improvement initiatives

**Real-World PCB Manufacturing Scenarios**:
- **High-Priority Rush Order**: Customer requests expedited delivery → Work order prioritized → Additional shifts scheduled → Material allocation expedited → Real-time tracking for status updates
- **Multi-Layer Board Production**: Complex 8-layer board → Sequential processing through multiple departments → Material tracking across stages → Quality checkpoints at critical operations → Yield monitoring and optimization
- **Capacity Bottleneck Resolution**: Drilling operation becomes bottleneck → Alternative routing identified → Additional equipment scheduled → Work order sequencing optimized → Production flow restored
- **Material Shortage Impact**: Copper foil shortage detected → Affected work orders identified → Alternative materials evaluated → Customer communication initiated → Production schedule adjusted

**Production Flow & Tracking**:
```
Sales Order → Work Order Creation → Material Issue →
Stage 1 (Inner Layer) → Stage 2 (Lamination) → Stage 3 (Drilling) →
Stage 4 (Plating) → Stage 5 (Outer Layer) → Stage 6 (Soldermask) →
Stage 7 (Legend) → Stage 8 (Surface Finish) → Stage 9 (Routing) →
Electrical Test → Final QC → Packing → Complete
```

**Business Logic Examples**:
```javascript
// Work order prioritization logic
const workOrderPrioritization = {
  delivery_date_priority: 'Orders with closest delivery dates get highest priority',
  customer_tier_priority: 'Premium customers receive expedited processing',
  material_availability: 'Orders blocked if critical materials not available',
  capacity_constraints: 'Orders scheduled based on machine and labor availability'
};

// OEE calculation
const oeeCalculation = {
  availability: '(Operating Time - Downtime) / Scheduled Time',
  performance: '(Total Parts Produced × Ideal Cycle Time) / Operating Time',
  quality: 'Good Parts / Total Parts Produced',
  overall_oee: 'Availability × Performance × Quality'
};

// Resource allocation algorithm
const resourceAllocation = {
  machine_assignment: 'Assign based on capability, availability, and setup time',
  labor_scheduling: 'Match operator skills to operation requirements',
  shift_optimization: 'Maximize throughput while respecting labor regulations',
  bottleneck_management: 'Identify and resolve capacity constraints proactively'
};
```

**Modules**:
- **Work Orders** (`/production/work-orders/`)
  - Order creation with detailed specifications and routing
  - Material requirement calculation and allocation
  - Production scheduling with resource assignment
  - Order status tracking and progress monitoring
  - Change order management for production modifications

- **WIP (Work in Progress)** (`/production/wip/`)
  - Real-time tracking of orders through all production stages
  - Visual workflow representation with current status indicators
  - Bottleneck identification and alerting for delayed operations
  - Production lead time analysis and cycle time optimization
  - Work order completion validation and quality gate enforcement

- **Capacity Planning** (`/production/capacity/`)
  - Machine utilization analysis with historical performance data
  - Labor capacity planning with skill matrix and availability tracking
  - Overall Equipment Effectiveness (OEE) monitoring and improvement tracking
  - Capacity constraint identification and resolution planning
  - Production forecasting and resource requirement planning

- **Routing** (`/production/routing/`)
  - Detailed process sequence definition for different product types
  - Operation standards with time estimates and resource requirements
  - Alternative routing options for capacity optimization
  - Process documentation and standard operating procedures
  - Routing validation and optimization recommendations

- **Scheduling** (`/production/scheduling/`)
  - Production calendar management with holidays and maintenance schedules
  - Machine and labor allocation optimization
  - Shift planning with break schedules and overtime management
  - Production sequencing for optimal throughput
  - Schedule conflict resolution and real-time adjustments

### 7. Quality Management

**Location**: `src/pages/quality/`

**Purpose & Business Value**:
The Quality Management module is the guardian of product excellence, ensuring that every PCB meets stringent quality standards and customer specifications. This module directly impacts customer satisfaction, brand reputation, and production costs by preventing defects, managing quality issues, and maintaining compliance with industry standards. It provides a systematic approach to quality control throughout the entire manufacturing process.

**Key Workflows & Processes**:
- **Incoming Quality Control**: Material receipt → Inspection against specifications → Acceptance/rejection decision → Supplier feedback
- **In-Process Quality Checks**: Stage-specific inspections → Defect detection → Immediate corrective action → Process adjustment
- **Final Quality Assurance**: Complete product inspection → Electrical testing → Documentation verification → Customer release approval
- **Quality Issue Resolution**: Defect identification → Root cause analysis → Corrective action planning → Implementation tracking → Effectiveness verification

**Important Business Rules & Logic**:
- **Acceptance Criteria**: Clear quality standards for each inspection point based on customer requirements and industry standards
- **Defect Classification**: Severity levels (Critical, Major, Minor) with corresponding escalation procedures
- **Hold/Release Authority**: Designated personnel with authority to quarantine materials or release products
- **Trending Analysis**: Statistical process control to identify quality trends and prevent recurring issues
- **Compliance Requirements**: Mandatory documentation and testing for regulatory compliance (RoHS, REACH, IPC standards)

**Integration Points with Other Modules**:
- **Production**: Real-time quality feedback for process adjustments and operator training
- **Inventory**: Material quarantine and release management for non-conforming items
- **Engineering**: Design validation and process capability analysis
- **Procurement**: Supplier quality performance tracking and improvement initiatives
- **Sales**: Customer-specific quality requirements and compliance documentation

**Key Data Entities & Relationships**:
- **Inspection Records**: Detailed inspection results with pass/fail criteria and measurement data
- **Defect Reports**: Comprehensive defect documentation with images, descriptions, and impact analysis
- **Quality Metrics**: First Pass Yield (FPY), Defects Per Million Opportunities (DPMO), and quality cost analysis
- **Compliance Documentation**: Certificates, test reports, and regulatory compliance records
- **Corrective Actions**: Problem descriptions, root cause analysis, action plans, and effectiveness verification

**User Roles & Permissions**:
- **Quality Inspectors**: Perform inspections, document findings, and make accept/reject decisions
- **Quality Engineers**: Analyze quality data, develop inspection procedures, and lead improvement initiatives
- **Quality Managers**: Oversee quality systems, approve corrective actions, and manage compliance
- **Production Supervisors**: Implement quality improvements and monitor process performance
- **Customer Quality Representatives**: Review customer-specific requirements and approve special releases

**Real-World PCB Manufacturing Scenarios**:
- **Incoming Material Defect**: Supplier delivers copper foil with surface contamination → Material quarantined → Supplier notified → Alternative material sourced → Process adjusted to prevent delays
- **Process Drift Detection**: AOI system detects increasing soldermask defects → Statistical analysis identifies process parameter drift → Equipment recalibrated → Yield restored → Preventive measures implemented
- **Customer Audit Preparation**: Customer requests quality system audit → Compliance documentation compiled → Process capability studies reviewed → Corrective actions verified → Audit readiness confirmed
- **High-Reliability Product**: Military/aerospace customer requires zero-defect production → Enhanced inspection procedures → Additional testing protocols → Special documentation requirements → Extended quality hold periods

**Quality Control Points in PCB Manufacturing**:
```
Material Receiving → Inner Layer Inspection → Lamination Quality Check →
Drilling Quality Verification → Plating Thickness Check → Outer Layer Inspection →
Soldermask Coverage Check → Legend Legibility Test → Surface Finish Verification →
Electrical Test Validation → Final Visual Inspection → Packaging Quality Check
```

**Business Logic Examples**:
```javascript
// Quality gate logic
const qualityGateLogic = {
  incoming_qc: 'Material must pass specification checks before production use',
  in_process_qc: 'Each stage must meet quality criteria before proceeding',
  final_qc: 'Complete product must pass all tests before customer release',
  hold_authority: 'Designated quality personnel can quarantine non-conforming items'
};

// Defect classification system
const defectClassification = {
  critical: 'Defect that affects product functionality or safety - immediate stop required',
  major: 'Defect that affects product performance - requires immediate attention',
  minor: 'Defect that affects appearance but not function - can be repaired or accepted'
};

// First Pass Yield calculation
const firstPassYieldCalculation = {
  fpy_formula: 'FPY = (Units passing first inspection / Total units started) × 100%',
  target_fpy: 'Industry standard typically 95% or higher for quality manufacturers',
  improvement_tracking: 'Monitor FPY trends to identify process improvement opportunities'
};
```

**Modules**:
- **Inspections** (`/quality/inspections/`)
  - Incoming quality control for received materials and components
  - In-process inspections at critical manufacturing stages
  - Final inspection and testing before customer release
  - Inspection template management for standardized procedures
  - Quality gate enforcement with hold/release authority

- **AOI (Automated Optical Inspection)** (`/quality/aoi/`)
  - Automated defect detection using high-resolution imaging systems
  - Image analysis and defect classification with machine learning algorithms
  - Rework management with detailed defect location and repair instructions
  - Statistical analysis of defect trends and process capability
  - Integration with production systems for real-time quality feedback

- **E-Test (Electrical Testing)** (`/quality/etest/`)
  - Continuity testing to verify electrical connections
  - Netlist verification against design specifications
  - Test result management with detailed pass/fail criteria
  - Test program management for different product types
  - Integration with automated test equipment for high-volume production

- **NCR (Non-Conformance Reports)** (`/quality/ncr/`)
  - Comprehensive defect reporting with detailed documentation
  - Root cause analysis using structured problem-solving methodologies
  - Corrective action planning with responsibility assignment and timelines
  - Effectiveness verification and follow-up tracking
  - Trend analysis to identify recurring quality issues

- **CAPA (Corrective Action)** (`/quality/capa/`)
  - Systematic problem resolution using PDCA (Plan-Do-Check-Act) methodology
  - Preventive measures to avoid recurrence of quality issues
  - Effectiveness tracking with measurable improvement indicators
  - Cross-functional team collaboration for complex quality challenges
  - Continuous improvement initiative management

- **Certificates** (`/quality/certificates/`)
  - Certificate of Compliance (CoC) generation for customer requirements
  - RoHS/REACH compliance documentation and material declarations
  - Quality system certification maintenance and audit preparation
  - Customer-specific quality documentation and reporting
  - Regulatory compliance tracking and reporting

### 8. Inventory Management

**Location**: `src/pages/inventory/`

**Purpose & Business Value**:
The Inventory Management module is the backbone of material control in PCB manufacturing, ensuring that the right materials are available at the right time while minimizing carrying costs and waste. This module directly impacts production efficiency, cash flow, and customer service levels by maintaining optimal inventory levels and providing complete material traceability throughout the manufacturing process.

**Key Workflows & Processes**:
- **Material Receiving**: Supplier delivery → Quality inspection → Stock receipt → Location assignment → Inventory update
- **Material Issue**: Production requirement → Material picking → Issue authorization → Stock deduction → Traceability recording
- **Inventory Reconciliation**: Physical count → System reconciliation → Adjustment processing → Variance analysis → Process improvement
- **Material Traceability**: Lot tracking → Usage recording → Quality linkage → Recall capability → Compliance reporting

**Important Business Rules & Logic**:
- **Inventory Accuracy**: Target 98%+ accuracy through regular cycle counting and process controls
- **Material Rotation**: FIFO (First-In-First-Out) for most materials, special handling for date-sensitive items
- **Reorder Point Management**: Automatic triggers based on lead times, usage rates, and safety stock levels
- **Lot Tracking**: Complete traceability from supplier receipt through production to finished goods
- **Inventory Valuation**: Accurate costing using standard cost, FIFO, or actual cost methods

**Integration Points with Other Modules**:
- **Production**: Material requirements planning, work order material allocation, consumption tracking
- **Procurement**: Purchase order status, supplier performance, material availability
- **Warehouse**: Storage location management, picking optimization, receiving processes
- **Quality**: Material quarantine, inspection status, non-conformance tracking
- **Engineering**: BOM validation, material specifications, alternative material identification

**Key Data Entities & Relationships**:
- **Material Master**: Complete material specifications, supplier information, and cost data
- **Stock Records**: Real-time inventory levels with location, lot, and status information
- **BOM Structures**: Hierarchical material relationships with quantities and alternatives
- **Transaction History**: Complete audit trail of all inventory movements and adjustments
- **Inventory Valuation**: Cost calculations and financial reporting data

**User Roles & Permissions**:
- **Inventory Controllers**: Inventory accuracy management, reconciliation oversight, and reporting
- **Storekeepers**: Material receiving, issuing, and location management
- **Material Planners**: Reorder point management, demand forecasting, and stock optimization
- **Production Supervisors**: Material requisition, consumption tracking, and usage analysis
- **Quality Inspectors**: Material quarantine, inspection status updates, and release authorization

**Real-World PCB Manufacturing Scenarios**:
- **High-Value Material Control**: Gold plating solution with high cost → Strict usage tracking → Waste minimization → Cost recovery analysis → Supplier reconciliation
- **Date-Sensitive Material**: Photoresist with shelf life → Expiration date tracking → Automatic alerts → Usage prioritization → Waste reduction
- **Critical Material Shortage**: Copper foil shortage → Alternative supplier identification → Usage optimization → Customer communication → Production schedule adjustment
- **Lot Traceability Requirement**: Customer requires complete traceability → Lot tracking implementation → Usage recording → Quality linkage → Compliance reporting

**Inventory Management in PCB Manufacturing**:
```
Supplier Delivery → Incoming Inspection → Stock Receipt → Location Assignment →
Material Storage → Pick List Generation → Material Issue → Production Usage →
Waste Recording → Inventory Update → Reconciliation → Reporting
```

**Business Logic Examples**:
```javascript
// Reorder point calculation
const reorderPointLogic = {
  reorder_point: 'Safety Stock + (Average Daily Usage × Lead Time)',
  safety_stock: 'Buffer for demand variability and supplier reliability',
  lead_time_calculation: 'Average time from order placement to material availability',
  automatic_reorder: 'System triggers purchase requisition when stock reaches reorder point'
};

// ABC analysis for inventory classification
const abcAnalysisLogic = {
  class_a: 'High-value items (10-20% of SKUs, 70-80% of value) - frequent monitoring',
  class_b: 'Medium-value items (20-30% of SKUs, 15-25% of value) - moderate monitoring',
  class_c: 'Low-value items (50-70% of SKUs, 5-10% of value) - minimal monitoring'
};

// Inventory accuracy calculation
const inventoryAccuracyLogic = {
  accuracy_formula: 'Accurate Locations / Total Locations Counted × 100%',
  target_accuracy: '98% or higher for well-managed inventory systems',
  cycle_counting: 'Regular counting of ABC-classified items for continuous accuracy'
};
```

**Modules**:
- **Items** (`/inventory/items/`)
  - Material master data management with complete specifications
  - Supplier information and approved vendor lists
  - Material classification and coding systems
  - Cost tracking and price history management
  - Alternative material identification and substitution rules

- **Stock Management** (`/inventory/stock/`)
  - Real-time inventory tracking with multi-location support
  - Stock movement recording with complete audit trails
  - Inventory valuation using various costing methods
  - Stock status management (available, reserved, quarantined, etc.)
  - Inventory aging and obsolescence tracking

- **BOM (Bill of Materials)** (`/inventory/bom/`)
  - Hierarchical material requirements for different product types
  - Component relationships with quantities and alternatives
  - Version control for engineering changes and revisions
  - BOM validation against inventory availability
  - Cost roll-up and material requirement planning integration

- **Adjustments** (`/inventory/adjustments/`)
  - Stock correction processing for discrepancies
  - Cycle counting management with ABC analysis integration
  - Inventory audit support and variance analysis
  - Adjustment approval workflows for material value thresholds
  - Root cause analysis for recurring inventory issues

- **Lots & Serials** (`/inventory/lots/`, `/inventory/serials/`)
  - Batch tracking from supplier receipt through production
  - Serial number management for high-value or regulated items
  - Complete traceability for quality and compliance requirements
  - Expiration date tracking for date-sensitive materials
  - Recall capability for quality issues or regulatory requirements

**Inventory Optimization Strategies**:
- **Just-in-Time (JIT)**: Minimize inventory while maintaining production continuity
- **Safety Stock Management**: Balance stockouts against carrying costs
- **Vendor Managed Inventory (VMI)**: Supplier-managed stock levels for critical materials
- **Consignment Inventory**: Supplier-owned materials used as needed
- **Inventory Turnover**: Maximize material flow to reduce carrying costs and obsolescence

### 9. Procurement

**Location**: `src/pages/procurement/`

**Purpose & Business Value**:
The Procurement module is the strategic gateway for material acquisition in PCB manufacturing, ensuring reliable supply of critical materials while optimizing costs and managing supplier relationships. This module directly impacts production continuity, material costs, and overall profitability by maintaining strong supplier partnerships and implementing effective purchasing strategies for specialized PCB materials.

**Key Workflows & Processes**:
- **Supplier Management**: Supplier identification → Qualification process → Performance monitoring → Contract negotiation → Relationship management
- **Purchase Requisition**: Material requirement identification → Approval workflow → Supplier selection → Purchase order creation → Order tracking
- **Goods Receipt**: Delivery notification → Quality inspection → Quantity verification → System receipt → Invoice processing
- **Supplier Performance**: Delivery performance tracking → Quality metrics monitoring → Cost analysis → Continuous improvement initiatives

**Important Business Rules & Logic**:
- **Supplier Qualification**: Rigorous evaluation process for new suppliers including technical capability, quality systems, and financial stability
- **Approval Hierarchies**: Purchase authorization levels based on material value and strategic importance
- **Contract Management**: Long-term agreements for critical materials with price stability and volume commitments
- **Quality Gates**: Mandatory inspection and approval before material acceptance and payment
- **Cost Optimization**: Strategic sourcing, volume discounts, and alternative material evaluation

**Integration Points with Other Modules**:
- **Inventory**: Reorder point triggers, stock level monitoring, and material availability planning
- **Production**: Material requirements from work orders, lead time considerations, and production scheduling
- **Quality**: Supplier quality performance, material inspection results, and non-conformance management
- **Engineering**: Material specifications, alternative material approval, and technical requirements
- **Finance**: Budget controls, payment terms, and cost analysis

**Key Data Entities & Relationships**:
- **Supplier Master**: Complete supplier information including capabilities, certifications, and performance history
- **Purchase Orders**: Detailed order information with pricing, delivery schedules, and approval workflows
- **Supplier Contracts**: Long-term agreements with pricing terms, volume commitments, and service level agreements
- **Performance Metrics**: Delivery performance, quality metrics, cost analysis, and supplier scorecards
- **Material Specifications**: Technical requirements, quality standards, and approved alternatives

**User Roles & Permissions**:
- **Procurement Managers**: Supplier relationship management, contract negotiation, and strategic sourcing
- **Buyers**: Purchase order creation, supplier communication, and order tracking
- **Supplier Quality Engineers**: Supplier qualification, performance monitoring, and quality improvement
- **Receiving Clerks**: Goods receipt processing and initial quality checks
- **Finance Controllers**: Budget monitoring, cost analysis, and payment authorization

**Real-World PCB Manufacturing Scenarios**:
- **Critical Material Sourcing**: Specialized high-frequency laminate material → Supplier qualification → Long-term contract negotiation → Dual sourcing strategy → Risk mitigation planning
- **Price Volatility Management**: Copper price fluctuations → Supplier contract renegotiation → Alternative material evaluation → Customer price adjustment → Cost recovery strategies
- **Supplier Quality Issue**: Consistent material defects from supplier → Performance review → Corrective action plan → Alternative supplier qualification → Risk assessment and mitigation
- **Just-in-Time Implementation**: Customer demands JIT delivery → Supplier capability assessment → Process optimization → Inventory reduction → Service level improvement

**Procurement Process Flow**:
```
Material Requirement → Supplier Selection → Price Negotiation →
Purchase Order Creation → Order Approval → Supplier Confirmation →
Delivery Scheduling → Goods Receipt → Quality Inspection →
Invoice Processing → Payment Authorization → Supplier Performance Review
```

**Business Logic Examples**:
```javascript
// Supplier evaluation criteria
const supplierEvaluationLogic = {
  technical_capability: 'Assessment of supplier\'s technical expertise and equipment',
  quality_systems: 'Evaluation of quality management systems and certifications',
  delivery_performance: 'Historical on-time delivery performance and reliability',
  financial_stability: 'Financial health and ability to sustain long-term relationships',
  cost_competitiveness: 'Pricing analysis compared to market rates and alternatives'
};

// Purchase approval workflow
const purchaseApprovalLogic = {
  threshold_levels: {
    under_1000: 'Manager approval required',
    under_10000: 'Department head approval required',
    over_10000: 'Executive approval required'
  },
  strategic_materials: 'Additional approval for critical or strategic materials',
  emergency_purchases: 'Expedited approval process for urgent requirements'
};

// Supplier performance scoring
const supplierPerformanceLogic = {
  delivery_score: 'On-time delivery percentage over evaluation period',
  quality_score: 'Defect rate and quality compliance metrics',
  cost_score: 'Cost competitiveness and price stability',
  service_score: 'Responsiveness and problem resolution effectiveness',
  overall_rating: 'Weighted average of all performance criteria'
};
```

**Modules**:
- **Suppliers** (`/procurement/suppliers/`)
  - Supplier master data management with complete company information
  - Supplier qualification and certification tracking
  - Performance monitoring with automated scorecards and KPIs
  - Supplier relationship management and communication history
  - Approved vendor list management with material-specific qualifications

- **Purchase Orders** (`/procurement/purchase-orders/`)
  - Purchase order creation with detailed material specifications
  - Multi-level approval workflows based on value and material type
  - Order status tracking from creation to completion
  - Supplier communication and order confirmation management
  - Integration with inventory and production planning systems

- **GRN (Goods Receipt)** (`/procurement/grn/`)
  - Goods receipt processing with quantity and quality verification
  - Integration with quality inspection workflows and hold/release authority
  - Invoice matching and three-way matching (PO, GRN, Invoice)
  - Supplier performance tracking based on delivery accuracy
  - Material quarantine and release management for quality issues

- **Pricing** (`/procurement/pricing/`)
  - Price contract management with effective dates and terms
  - Cost analysis and trend monitoring for strategic decision-making
  - Price history tracking for negotiation and budgeting purposes
  - Alternative material pricing comparison and evaluation
  - Volume discount structures and pricing tier management

**Strategic Procurement Considerations for PCB Manufacturing**:
- **Material Criticality**: Classification of materials based on strategic importance and supply risk
- **Dual Sourcing**: Risk mitigation through multiple qualified suppliers for critical materials
- **Long-term Contracts**: Price stability and supply security for high-volume materials
- **Supplier Development**: Collaborative improvement initiatives with key suppliers
- **Market Intelligence**: Monitoring of material markets and price trends for proactive management

### 10. Warehouse & Logistics

**Location**: `src/pages/warehouse/`, `src/pages/logistics/`

**Purpose & Business Value**:
The Warehouse & Logistics module orchestrates the physical flow of materials and finished goods, ensuring efficient storage, accurate picking, and timely delivery. This module directly impacts customer satisfaction, operational efficiency, and logistics costs by optimizing warehouse operations and coordinating seamless product delivery from finished goods to customer destinations.

**Key Workflows & Processes**:
- **Receiving & Putaway**: Supplier delivery → Quality inspection → Location assignment → Putaway execution → Inventory update
- **Order Picking**: Customer order → Pick list generation → Material location → Picking execution → Verification and staging
- **Packing & Shipping**: Order consolidation → Packaging selection → Label generation → Carrier selection → Shipment execution
- **Returns Management**: Customer returns → Inspection and sorting → Restocking or disposal → Credit processing → Root cause analysis

**Important Business Rules & Logic**:
- **Storage Optimization**: Strategic location assignment based on material characteristics, turnover rates, and picking frequency
- **Picking Strategies**: Zone picking, batch picking, or wave picking based on order volume and complexity
- **Packaging Standards**: Appropriate packaging selection based on product type, destination, and handling requirements
- **Carrier Selection**: Automated carrier selection based on cost, service level, and delivery requirements
- **Inventory Accuracy**: Real-time inventory updates with location-specific tracking and reconciliation

**Integration Points with Other Modules**:
- **Inventory**: Real-time stock level updates, location management, and material traceability
- **Production**: Finished goods receipt, staging area management, and material issue coordination
- **Sales**: Customer order processing, delivery scheduling, and shipment status updates
- **Quality**: Material quarantine, inspection status, and non-conformance handling
- **Procurement**: Supplier delivery coordination and receiving process management

**Key Data Entities & Relationships**:
- **Warehouse Locations**: Detailed storage location hierarchy with capacity and characteristic information
- **Pick Lists**: Optimized picking sequences with material locations and quantities
- **Shipping Documents**: Packing lists, bills of lading, and shipping labels with tracking information
- **Carrier Information**: Carrier contracts, service levels, and performance metrics
- **Return Authorizations**: Return reasons, inspection results, and disposition decisions

**User Roles & Permissions**:
- **Warehouse Managers**: Overall warehouse operations, layout optimization, and performance management
- **Receiving Clerks**: Material receipt, inspection coordination, and putaway execution
- **Pickers**: Order picking, location verification, and material staging
- **Packers**: Order consolidation, packaging selection, and shipment preparation
- **Dispatch Coordinators**: Carrier selection, shipment scheduling, and delivery tracking

**Real-World PCB Manufacturing Scenarios**:
- **High-Value Component Storage**: Gold-plated connectors requiring secure storage → Access-controlled location → Specialized packaging → Insurance documentation → Chain of custody tracking
- **Temperature-Sensitive Materials**: Photoresist requiring climate control → Temperature-monitored storage → Special handling procedures → Expiration date tracking → Usage prioritization
- **Just-in-Time Delivery**: Customer demands exact delivery timing → Carrier coordination → Real-time tracking → Delivery confirmation → Exception handling for delays
- **International Shipping**: Export orders requiring customs documentation → Compliance verification → Documentation preparation → Carrier coordination → Tracking and status updates

**Warehouse Operations Flow**:
```
Supplier Delivery → Receiving Inspection → Location Assignment → Putaway →
Storage Management → Pick List Generation → Order Picking → Verification →
Packing & Labeling → Carrier Selection → Shipment Execution → Tracking & Confirmation
```

**Business Logic Examples**:
```javascript
// Storage location optimization
const storageOptimizationLogic = {
  fast_moving: 'Store in easily accessible locations near packing areas',
  slow_moving: 'Store in higher or less accessible locations to optimize space',
  hazardous: 'Store in designated areas with proper safety measures and access control',
  temperature_sensitive: 'Store in climate-controlled areas with monitoring systems',
  high_value: 'Store in secure areas with access restrictions and surveillance'
};

// Picking strategy selection
const pickingStrategyLogic = {
  single_order: 'Pick individual orders for high-priority or urgent shipments',
  batch_picking: 'Combine multiple orders for efficiency in high-volume operations',
  zone_picking: 'Assign pickers to specific warehouse zones for large facilities',
  wave_picking: 'Schedule picking waves based on carrier departure times'
};

// Carrier selection algorithm
const carrierSelectionLogic = {
  cost_optimization: 'Select carrier based on lowest cost meeting service requirements',
  service_level: 'Prioritize carriers based on delivery speed and reliability',
  destination_coverage: 'Choose carriers with best coverage for specific destinations',
  volume_discounts: 'Leverage volume-based discounts with preferred carriers'
};
```

**Modules**:
- **Warehouses** (`/warehouse/warehouses/`)
  - Warehouse configuration with layout design and capacity planning
  - Storage location management with hierarchical organization and characteristics
  - Capacity management with real-time utilization monitoring
  - Warehouse zoning for different material types and handling requirements
  - Equipment and resource allocation for warehouse operations

- **Picking & Packing** (`/warehouse/picking/`, `/warehouse/packing/`)
  - Order fulfillment with optimized pick list generation and route planning
  - Picking execution with location verification and quantity confirmation
  - Packing optimization with appropriate packaging selection and consolidation
  - Packing list generation with detailed item descriptions and quantities
  - Label generation with barcodes, tracking numbers, and handling instructions

- **Dispatch** (`/logistics/dispatch/`)
  - Shipment planning with carrier selection and route optimization
  - Carrier management with contract terms and performance monitoring
  - Delivery tracking with real-time status updates and exception handling
  - Shipping document generation including bills of lading and customs documentation
  - Delivery confirmation and customer notification management

**Warehouse Management Best Practices**:
- **5S Methodology**: Sort, Set in order, Shine, Standardize, Sustain for warehouse organization
- **Cross-Docking**: Direct transfer from receiving to shipping to minimize storage time
- **Slotting Optimization**: Strategic placement of materials based on turnover and picking frequency
- **Inventory Cycle Counting**: Regular counting of high-value or fast-moving items
- **Warehouse Automation**: Implementation of barcode scanning, pick-to-light systems, and automated storage

**Logistics Coordination**:
- **Carrier Relationship Management**: Negotiation of rates, service level agreements, and performance monitoring
- **Freight Consolidation**: Combining shipments to optimize transportation costs
- **Customs Compliance**: Management of international shipping documentation and regulations
- **Delivery Scheduling**: Coordination with customers for optimal delivery timing
- **Exception Management**: Handling of delivery delays, damaged goods, and customer complaints

### 11. Traceability

**Location**: `src/pages/traceability/`

**Purpose & Business Value**:
The Traceability module provides complete visibility into the material and process history of every PCB, from raw material receipt through final delivery. This module is critical for quality assurance, regulatory compliance, and customer confidence, enabling rapid identification of issues, efficient recalls, and detailed product history for high-reliability applications.

**Key Workflows & Processes**:
- **Material Traceability**: Supplier receipt → Lot assignment → Usage tracking → Finished product linkage → Customer delivery
- **Process Traceability**: Operation execution → Parameter recording → Quality checkpoint → Operator identification → Time tracking
- **Component Traceability**: Component receipt → Serial/lot tracking → Assembly usage → Test results → Final product association
- **Recall Management**: Issue identification → Impact analysis → Affected product identification → Customer notification → Return processing

**Important Business Rules & Logic**:
- **One-Up, One-Down Traceability**: Ability to trace one step forward and one step backward in the supply chain
- **Lot Integrity**: Complete tracking of material lots through all processing stages
- **Serialization Requirements**: Unique identification for high-reliability or regulated products
- **Data Retention**: Long-term storage of traceability data for compliance and warranty purposes
- **Recall Readiness**: Rapid identification and isolation of affected products within specified timeframes

**Integration Points with Other Modules**:
- **Inventory**: Lot and serial number tracking, material movement recording, stock status management
- **Production**: Work order linkage, operation execution tracking, quality checkpoint integration
- **Quality**: Defect tracking, inspection results, non-conformance linkage to specific lots/components
- **Procurement**: Supplier lot information, material specifications, quality documentation
- **Sales**: Customer order linkage, delivery tracking, warranty claim processing

**Key Data Entities & Relationships**:
- **Material Lots**: Complete history of material batches from supplier to finished product
- **Serial Numbers**: Individual product identification with complete manufacturing history
- **Process Records**: Detailed operation execution with parameters, operators, and timestamps
- **Component Relationships**: Bill of materials with specific component lot/serial associations
- **Traceability Links**: Connections between materials, processes, and finished products

**User Roles & Permissions**:
- **Traceability Coordinators**: Overall traceability system management and compliance monitoring
- **Quality Engineers**: Traceability data analysis for quality improvement and issue resolution
- **Production Supervisors**: Process traceability recording and verification
- **Customer Service**: Traceability data retrieval for customer inquiries and warranty claims
- **Regulatory Compliance**: Audit preparation and regulatory reporting

**Real-World PCB Manufacturing Scenarios**:
- **Quality Issue Investigation**: Defect discovered in field → Traceability analysis identifies specific production batch → Root cause analysis of materials and processes → Corrective actions implemented → Affected customers notified
- **Regulatory Audit**: Customer requires complete traceability for aerospace application → System generates complete material and process history → Compliance documentation provided → Audit passed successfully
- **Supplier Material Issue**: Supplier notifies of potential contamination → Traceability system identifies all affected lots → Customer notification initiated → Product recall planned → Alternative materials sourced
- **Warranty Claim Processing**: Customer returns defective product → Serial number lookup provides complete manufacturing history → Root cause identified → Warranty claim processed → Process improvement implemented

**Traceability Chain in PCB Manufacturing**:
```
Supplier Material → Incoming Inspection → Lot Assignment →
Material Storage → Production Issue → Process Steps →
Quality Checks → Assembly → Testing → Final Inspection →
Packaging → Customer Delivery → Warranty Tracking
```

**Business Logic Examples**:
```javascript
// One-up, one-down traceability logic
const traceabilityLogic = {
  one_up: 'Trace material/component to immediate supplier or previous process',
  one_down: 'Trace material/component to immediate customer or next process',
  complete_chain: 'Full traceability from raw material to finished product',
  recall_scope: 'Identify all products affected by specific material or process issue'
};

// Lot tracking requirements
const lotTrackingLogic = {
  material_lots: 'Track all raw materials by supplier lot number',
  component_lots: 'Track all components by manufacturer lot/serial numbers',
  process_lots: 'Track production batches with unique identifiers',
  finished_lots: 'Associate finished products with all input lots and processes'
};

// Recall impact analysis
const recallAnalysisLogic = {
  affected_products: 'Identify all products using affected materials or processes',
  customer_notification: 'Generate list of customers requiring notification',
  return_processing: 'Plan for product return and replacement logistics',
  regulatory_reporting: 'Prepare required regulatory notifications and documentation'
};
```

**Modules**:
- **Batch Management** (`/traceability/batch/`)
  - Batch creation with unique identifiers and specifications
  - Batch tracking through all manufacturing stages
  - Complete batch history with material and process associations
  - Batch status monitoring and expiration date tracking
  - Batch-level quality and compliance documentation

- **Lot Genealogy** (`/traceability/lot-genealogy/`)
  - Component relationship mapping with complete material flow visualization
  - Supplier traceability with quality and performance linkage
  - Process genealogy showing all operations and parameters used
  - Finished product association with all input materials and processes
  - Interactive genealogy trees for easy navigation and analysis

- **Recall Management** (`/traceability/recall/`)
  - Recall initiation with issue description and scope definition
  - Impact analysis to identify all affected products and customers
  - Communication tracking with customer notifications and responses
  - Return processing coordination with logistics and quality teams
  - Recall effectiveness verification and closure documentation

**Traceability Technologies and Standards**:
- **Barcode/RFID**: Automated data capture for material and product identification
- **ERP Integration**: Seamless traceability data flow across all business systems
- **Regulatory Compliance**: Support for industry-specific traceability requirements (IPC, ISO, AS9100)
- **Data Analytics**: Advanced analysis tools for traceability data mining and trend identification
- **Cloud Storage**: Secure, scalable storage for long-term traceability data retention

**Benefits of Comprehensive Traceability**:
- **Quality Improvement**: Rapid identification of quality issues and root causes
- **Regulatory Compliance**: Meeting industry and customer traceability requirements
- **Customer Confidence**: Demonstrating product quality and safety
- **Risk Mitigation**: Reducing impact of quality issues through rapid response
- **Process Optimization**: Identifying process improvements through data analysis

### 12. Maintenance

**Location**: `src/pages/maintenance/`

**Purpose & Business Value**:
The Maintenance module ensures optimal equipment availability and performance through proactive maintenance management and rapid response to equipment failures. This module directly impacts production uptime, equipment lifespan, and overall manufacturing efficiency by preventing unexpected breakdowns and optimizing maintenance resource allocation.

**Key Workflows & Processes**:
- **Preventive Maintenance Planning**: Equipment analysis → Maintenance schedule creation → Resource allocation → Task execution → Performance verification
- **Breakdown Management**: Failure detection → Emergency response → Repair execution → Root cause analysis → Preventive measures implementation
- **Asset Lifecycle Management**: Equipment acquisition → Performance monitoring → Maintenance optimization → Replacement planning → Disposal management
- **Maintenance Optimization**: Performance data analysis → Maintenance strategy refinement → Cost-benefit analysis → Continuous improvement

**Important Business Rules & Logic**:
- **Maintenance Scheduling**: Preventive maintenance scheduled during planned downtime to minimize production impact
- **Priority Classification**: Maintenance tasks prioritized based on equipment criticality and production impact
- **Spare Parts Management**: Critical spare parts inventory maintained based on equipment failure analysis and lead times
- **MTBF/MTTR Tracking**: Mean Time Between Failures and Mean Time To Repair monitored for continuous improvement
- **Maintenance Budgeting**: Maintenance costs tracked and optimized while maintaining equipment reliability

**Integration Points with Other Modules**:
- **Production**: Equipment availability planning, maintenance scheduling coordination, and downtime impact analysis
- **Inventory**: Spare parts management, maintenance material requirements, and tool tracking
- **Procurement**: Maintenance service contracts, spare parts purchasing, and vendor management
- **Quality**: Equipment calibration tracking, maintenance impact on product quality, and preventive quality measures
- **Warehouse**: Tool and spare parts storage, maintenance material staging, and equipment staging areas

**Key Data Entities & Relationships**:
- **Equipment Assets**: Complete equipment inventory with specifications, location, and criticality ratings
- **Maintenance Work Orders**: Detailed maintenance tasks with scheduling, resource allocation, and completion tracking
- **Maintenance History**: Complete record of all maintenance activities with costs, durations, and outcomes
- **Spare Parts Inventory**: Critical spare parts with usage patterns, lead times, and reorder points
- **Performance Metrics**: Equipment uptime, maintenance costs, and reliability indicators

**User Roles & Permissions**:
- **Maintenance Managers**: Overall maintenance strategy, resource planning, and performance monitoring
- **Maintenance Supervisors**: Work order management, technician assignment, and maintenance execution oversight
- **Maintenance Technicians**: Equipment inspection, preventive maintenance execution, and repair work
- **Production Supervisors**: Equipment usage reporting, maintenance request initiation, and downtime coordination
- **Planners**: Maintenance scheduling, resource allocation, and preventive maintenance program management

**Real-World PCB Manufacturing Scenarios**:
- **Critical Equipment Failure**: Drilling machine breakdown during high-volume production → Emergency repair coordination → Production rescheduling → Root cause analysis → Preventive measures implementation
- **Preventive Maintenance Optimization**: Analysis shows excessive unplanned downtime → Maintenance schedule review → Predictive maintenance implementation → Equipment reliability improvement → Production uptime increase
- **Spare Parts Strategy**: Frequent component failures → Spare parts analysis → Critical parts identification → Inventory optimization → Lead time reduction → Downtime minimization
- **Equipment Lifecycle Planning**: Aging plating equipment approaching end-of-life → Replacement analysis → New equipment specification → Budget approval → Installation planning → Training coordination

**Maintenance Management Flow**:
```
Equipment Monitoring → Maintenance Planning → Work Order Creation →
Resource Allocation → Maintenance Execution → Performance Verification →
Data Analysis → Strategy Optimization → Continuous Improvement
```

**Business Logic Examples**:
```javascript
// Equipment criticality classification
const equipmentCriticalityLogic = {
  critical: 'Equipment whose failure causes complete production line shutdown',
  important: 'Equipment whose failure reduces production capacity significantly',
  standard: 'Equipment whose failure has minimal impact on production',
  non_critical: 'Support equipment with backup availability or minimal production impact'
};

// Maintenance priority calculation
const maintenancePriorityLogic = {
  emergency: 'Immediate response required for safety or production-critical equipment',
  high: 'Repair needed within 24 hours to prevent production impact',
  medium: 'Repair needed within 1 week to maintain optimal performance',
  low: 'Routine maintenance that can be scheduled during planned downtime'
};

// MTBF/MTTR tracking
const reliabilityMetricsLogic = {
  mtbf_calculation: 'Total operating time / Number of failures',
  mttr_calculation: 'Total downtime / Number of repairs',
  availability_calculation: 'MTBF / (MTBF + MTTR) × 100%',
  improvement_tracking: 'Monitor trends to identify reliability improvements'
};
```

**Modules**:
- **Equipment** (`/maintenance/equipment/`)
  - Complete asset tracking with equipment specifications and location information
  - Maintenance history with detailed records of all maintenance activities
  - Performance metrics tracking including uptime, downtime, and reliability indicators
  - Equipment criticality classification and maintenance strategy assignment
  - Lifecycle management from acquisition through disposal

- **Preventive Maintenance** (`/maintenance/preventive/`)
  - Maintenance schedule creation with automated task generation
  - Detailed maintenance checklists with step-by-step procedures
  - Work order management with resource allocation and completion tracking
  - Maintenance planning with production schedule coordination
  - Performance verification and maintenance effectiveness analysis

- **Breakdowns** (`/maintenance/breakdowns/`)
  - Failure reporting with detailed incident documentation
  - Downtime tracking with real-time impact assessment
  - Root cause analysis using structured problem-solving methodologies
  - Emergency response coordination with priority-based resource allocation
  - Preventive measure implementation to avoid recurrence

**Maintenance Strategies for PCB Manufacturing**:
- **Predictive Maintenance**: Using sensors and data analysis to predict equipment failures before they occur
- **Total Productive Maintenance (TPM)**: Operator involvement in basic maintenance tasks and equipment care
- **Reliability-Centered Maintenance (RCM)**: Maintenance strategy based on equipment criticality and failure modes
- **Condition-Based Monitoring**: Real-time monitoring of equipment parameters to detect anomalies
- **Maintenance KPIs**: Key performance indicators for maintenance effectiveness and equipment reliability

**Benefits of Effective Maintenance Management**:
- **Increased Uptime**: Reduced unplanned downtime through proactive maintenance
- **Extended Equipment Life**: Proper maintenance extends equipment operational lifespan
- **Reduced Maintenance Costs**: Optimized maintenance reduces emergency repair costs
- **Improved Safety**: Regular maintenance reduces equipment-related safety hazards
- **Better Quality**: Well-maintained equipment produces higher quality products

### 13. Reports & Analytics

**Location**: `src/pages/reports/`

**Purpose & Business Value**:
The Reports & Analytics module transforms raw operational data into actionable business intelligence, enabling data-driven decision-making across all levels of the organization. This module provides comprehensive insights into performance, trends, and opportunities for improvement, supporting strategic planning and operational excellence in PCB manufacturing.

**Key Workflows & Processes**:
- **Performance Monitoring**: Data collection → KPI calculation → Trend analysis → Performance reporting → Action planning
- **Compliance Reporting**: Regulatory requirement identification → Data extraction → Report generation → Audit trail maintenance → Submission tracking
- **Financial Analysis**: Cost data aggregation → Profitability analysis → Budget comparison → Forecasting → Financial planning
- **Operational Analytics**: Process data analysis → Bottleneck identification → Efficiency optimization → Continuous improvement initiatives

**Important Business Rules & Logic**:
- **Data Accuracy**: All reports based on validated, real-time data from integrated systems
- **Report Scheduling**: Automated report generation with customizable frequency and distribution
- **Role-Based Access**: Report visibility and access controlled based on user roles and responsibilities
- **Historical Data**: Long-term data retention for trend analysis and historical comparisons
- **Export Capabilities**: Multiple export formats (PDF, Excel, CSV) for external analysis and sharing

**Integration Points with Other Modules**:
- **All Operational Modules**: Real-time data extraction from sales, production, quality, inventory, and maintenance systems
- **Dashboard**: KPI data feeds for real-time performance monitoring
- **Business Intelligence**: Data warehouse integration for advanced analytics and data mining
- **External Systems**: Integration with ERP, accounting, and customer relationship management systems
- **Regulatory Systems**: Automated compliance reporting for industry-specific requirements

**Key Data Entities & Relationships**:
- **KPI Metrics**: Key performance indicators with targets, actuals, and variance analysis
- **Trend Data**: Historical performance data for trend analysis and forecasting
- **Cost Centers**: Detailed cost allocation and profitability analysis by department or product line
- **Customer Analytics**: Customer behavior, profitability, and satisfaction metrics
- **Operational Data**: Production efficiency, quality rates, inventory turns, and maintenance performance

**User Roles & Permissions**:
- **Executives**: Strategic dashboards, financial reports, and high-level performance metrics
- **Department Managers**: Operational reports specific to their areas with detailed analysis
- **Supervisors**: Tactical reports for daily operations and team performance monitoring
- **Analysts**: Advanced analytics tools, custom report creation, and data mining capabilities
- **External Stakeholders**: Compliance reports, customer-specific reports, and regulatory submissions

**Real-World PCB Manufacturing Scenarios**:
- **Monthly Performance Review**: Comprehensive analysis of production efficiency, quality trends, and financial performance → Management presentation → Strategic decisions → Action plans implementation
- **Customer Profitability Analysis**: Customer order history analysis → Cost allocation by customer → Profitability ranking → Customer relationship strategy → Pricing optimization
- **Quality Trend Analysis**: Defect data collection → Statistical analysis → Trend identification → Root cause analysis → Process improvement → Quality enhancement
- **Capacity Planning**: Production data analysis → Capacity utilization trends → Demand forecasting → Equipment investment planning → Workforce planning

**Report Categories and Business Impact**:

**Production Reports**:
- **OEE (Overall Equipment Effectiveness)**: Equipment availability, performance, and quality analysis
- **Throughput Analysis**: Production volume trends and bottleneck identification
- **Efficiency Metrics**: Labor efficiency, machine utilization, and process optimization
- **Yield Analysis**: First-pass yield, rework rates, and scrap analysis

**Quality Reports**:
- **FPY (First Pass Yield)**: Initial quality performance measurement and trend analysis
- **Defect Analysis**: Defect categorization, Pareto analysis, and root cause identification
- **NCR (Non-Conformance) Trends**: Quality issue tracking and resolution effectiveness
- **Customer Returns**: Return analysis, warranty claims, and customer satisfaction metrics

**Inventory Reports**:
- **Stock Aging**: Inventory age analysis and obsolescence risk identification
- **Consumption Analysis**: Material usage patterns and demand forecasting
- **Turnover Analysis**: Inventory turnover rates and working capital optimization
- **ABC Analysis**: Inventory classification for optimized management strategies

**Sales Reports**:
- **Order Status**: Order tracking, delivery performance, and customer service metrics
- **Customer Analysis**: Customer profitability, order patterns, and relationship management
- **Sales Forecasting**: Demand prediction and production planning support
- **Quote Analysis**: Quote conversion rates and pricing effectiveness

**Finance Reports**:
- **Costing Analysis**: Detailed cost breakdown by product, process, and department
- **Profitability Reports**: Margin analysis, cost control, and financial performance
- **Budget vs. Actual**: Financial planning, variance analysis, and cost control
- **ROI Analysis**: Return on investment for equipment, processes, and initiatives

**Business Logic Examples**:
```javascript
// KPI calculation logic
const kpiCalculationLogic = {
  oee_calculation: 'Availability × Performance × Quality',
  fpy_calculation: 'Good Units Produced / Total Units Started × 100%',
  inventory_turnover: 'Cost of Goods Sold / Average Inventory Value',
  on_time_delivery: 'Orders Delivered On Time / Total Orders Due × 100%'
};

// Report scheduling logic
const reportSchedulingLogic = {
  real_time: 'Dashboard updates every 30 seconds for critical metrics',
  daily: 'End-of-day reports for operational review and planning',
  weekly: 'Weekly summaries for management review and trend analysis',
  monthly: 'Comprehensive monthly reports for strategic planning and analysis'
};

// Data aggregation logic
const dataAggregationLogic = {
  real_time_aggregation: 'Live data collection from all operational systems',
  historical_trends: 'Long-term data storage for trend analysis and forecasting',
  drill_down_capability: 'Detailed analysis from summary to transaction level',
  comparative_analysis: 'Period-over-period and target vs. actual comparisons'
};
```

**Advanced Analytics Features**:
- **Predictive Analytics**: Forecasting future trends based on historical data and machine learning
- **Prescriptive Analytics**: Recommendations for optimal actions based on data analysis
- **Real-time Dashboards**: Live performance monitoring with interactive data visualization
- **Mobile Reporting**: Access to key reports and dashboards on mobile devices
- **Custom Report Builder**: User-friendly tools for creating custom reports and analyses

**Benefits of Comprehensive Reporting and Analytics**:
- **Informed Decision Making**: Data-driven insights for strategic and operational decisions
- **Performance Improvement**: Identification of improvement opportunities and tracking of progress
- **Cost Reduction**: Analysis of cost drivers and optimization opportunities
- **Customer Satisfaction**: Understanding customer needs and improving service levels
- **Competitive Advantage**: Better insights leading to faster, more effective responses to market changes

## API Service Structure

### Service Organization

Services are organized by business domain in `src/services/`:

```
services/
├── auth.service.js              # Authentication
├── dashboard/                   # Dashboard APIs
├── engineering/                 # Engineering services
├── inventory/                   # Inventory services
├── production/                  # Production services
├── quality/                     # Quality services
├── procurement/                 # Procurement services
├── sales/                       # Sales services
├── warehouse/                   # Warehouse services
├── logistics/                   # Logistics services
├── traceability/                # Traceability services
├── maintenance/                 # Maintenance services
└── reports/                     # Reporting services
```

### Service Pattern

Each service follows a consistent pattern:

```javascript
// Example service structure
import axios from "@/lib/axios";

class ServiceName {
  async list(params = {}) {
    try {
      const response = await axios.get("/api/endpoint", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }

  async get(id) {
    try {
      const response = await axios.get(`/api/endpoint/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching item:", error);
      throw error;
    }
  }

  async create(data) {
    try {
      const response = await axios.post("/api/endpoint", data);
      return response.data;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const response = await axios.put(`/api/endpoint/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await axios.delete(`/api/endpoint/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }
}

export default new ServiceName();
```

### HTTP Client Configuration

Located in `src/lib/axios.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Component Organization

### Component Hierarchy

```
components/
├── layout/                      # Layout components
│   ├── DashboardLayout.jsx     # Main application layout
│   ├── Sidebar.jsx             # Navigation sidebar
│   ├── Topbar.jsx              # Top navigation
│   └── ProtectedRoute.jsx      # Route protection
├── ui/                         # Reusable UI components
│   ├── button.jsx              # Button component
│   ├── card.jsx                # Card component
│   ├── input.jsx               # Input component
│   ├── modal.jsx               # Modal dialog
│   └── [other Radix components]
├── forms/                      # Form components
│   ├── admin/                  # Admin forms
│   ├── engineering/            # Engineering forms
│   ├── inventory/              # Inventory forms
│   └── [other domain forms]
├── charts/                     # Data visualization
│   ├── ProductionWipChart.jsx  # WIP visualization
│   ├── FPYTrendChart.jsx       # First Pass Yield
│   └── [other charts]
├── cards/                      # Dashboard cards
│   ├── KpiCard.jsx             # KPI display
│   ├── WorkOrderCard.jsx       # Work order summary
│   └── [other cards]
├── tables/                     # Data tables
│   ├── DataTable.jsx           # Generic data table
│   ├── RowActions.jsx          # Row action buttons
│   └── TableToolbar.jsx        # Table controls
└── pcb/                        # PCB-specific components
    ├── PanelizationPreview.jsx # Panel layout preview
    ├── StackupViewer.jsx       # Layer stackup display
    └── [other PCB components]
```

### Component Patterns

#### 1. Page Components
- Located in `src/pages/`
- Handle route-level logic
- Coordinate between services and UI components
- Manage page-specific state

#### 2. Feature Components
- Reusable across pages
- Focused on specific functionality
- Props-driven for flexibility

#### 3. Presentational Components
- Pure UI components
- No business logic
- Styled with Tailwind CSS

#### 4. Container Components
- Connect data to presentational components
- Handle API calls and state management
- Often use TanStack Query

### Styling Strategy

**Tailwind CSS Configuration** (`tailwind.config.js`):
```javascript
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

**CSS Architecture** (`src/css/app.css`):
- Custom component styles
- Dashboard theming
- Sidebar styling
- Responsive design utilities

## Data Flow Patterns

### 1. Request-Response Flow

```
User Action → Component → Service → API → Backend → Response → Service → Component → UI Update
```

### 2. State Management Flow

```
API Response → TanStack Query Cache → Component State → UI Rendering
```

### 3. Form Data Flow

```
User Input → Form State → Validation → Service Call → API → Response → Success/Error Handling
```

### 4. Authentication Flow

```
Login → Auth Service → Token Storage → Protected Routes → API Requests → Token Validation
```

### Data Fetching Strategy

**TanStack Query Usage**:
```javascript
import { useQuery } from '@tanstack/react-query';

// Example: Fetching work orders
const useWorkOrders = (params) => {
  return useQuery({
    queryKey: ['work-orders', params],
    queryFn: () => workOrderService.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

**Query Invalidation**:
```javascript
// Example: Invalidating related queries after update
const { mutate } = useMutation({
  mutationFn: workOrderService.update,
  onSuccess: () => {
    queryClient.invalidateQueries(['work-orders']);
    queryClient.invalidateQueries(['dashboard']);
  }
});
```

## Business Domain Concepts

### PCB Manufacturing Fundamentals

#### 1. PCB Stackup
A PCB stackup defines the arrangement of copper layers, dielectric materials, and other layers that make up a printed circuit board.

**Key Parameters**:
- **Layer Count**: Number of copper layers (1, 2, 4, 6, 8, etc.)
- **Material Types**: FR4, High-TG, Rogers, etc.
- **Copper Weight**: 0.5oz, 1oz, 2oz, etc.
- **Dielectric Thickness**: Prepreg and core thickness
- **Surface Finish**: HASL, ENIG, Immersion Silver, etc.

#### 2. Production Process Flow

```
1. Material Receiving → 2. Inner Layer Imaging → 3. Etching → 4. Lamination
5. Drilling → 6. Plating → 7. Outer Layer Imaging → 8. Etching
9. Soldermask → 10. Legend → 11. Surface Finish → 12. Routing/Cutting
13. Electrical Test → 14. Final Inspection → 15. Packing → 16. Dispatch
```

#### 3. Quality Control Points

- **Incoming QC**: Material inspection upon receipt
- **In-Process QC**: Checks at critical process steps
- **AOI**: Automated Optical Inspection for visual defects
- **E-Test**: Electrical continuity and isolation testing
- **Final QC**: Comprehensive inspection before shipment

#### 4. Inventory Management

**Material Categories**:
- **Raw Materials**: Copper foil, prepreg, core materials
- **Chemicals**: Etchants, plating solutions, developers
- **Consumables**: Drill bits, saw blades, cleaning supplies
- **Components**: If assembly is included

**Tracking Methods**:
- **Lot Tracking**: Batch-level traceability
- **Serial Tracking**: Individual item traceability
- **FIFO**: First-In-First-Out inventory rotation

#### 5. Work Order Management

**Work Order Lifecycle**:
1. **Planned**: Order created, materials not yet issued
2. **Released**: Materials issued, production started
3. **In Progress**: Currently being manufactured
4. **On Hold**: Production paused (quality issues, material shortage)
5. **Completed**: Manufacturing finished, ready for shipment

**Key Metrics**:
- **On-Time Delivery**: % of orders delivered on schedule
- **First Pass Yield**: % of boards passing first inspection
- **Cycle Time**: Time from order to completion
- **Capacity Utilization**: % of available production capacity used

### PCB-Specific Terminology

| Term | Definition |
|------|------------|
| **Gerber Files** | Standard format for PCB design data |
| **Drill Files** | NC drill data for hole placement |
| **Netlist** | Electrical connectivity information |
| **Soldermask** | Protective coating over copper traces |
| **Legend** | Silkscreen printing for component identification |
| **Annular Ring** | Copper around drilled holes |
| **Aspect Ratio** | Hole depth to diameter ratio |
| **Tg (Glass Transition)** | Temperature at which material changes state |
| **Impedance Control** | Controlled electrical characteristics |
| **Via** | Electrical connection between layers |

## Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: For version control

### Installation

1. **Clone the repository**:
```bash
git clone [repository-url]
cd pcbxpress-erp
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment configuration**:
```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME="PCBxpress ERP"
```

4. **Start development server**:
```bash
npm run dev
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

### Code Structure Conventions

#### File Naming
- **Components**: PascalCase (`WorkOrderCard.jsx`)
- **Pages**: PascalCase (`WorkOrdersList.jsx`)
- **Services**: camelCase (`workOrderService.js`)
- **Utilities**: camelCase (`formatDate.js`)
- **Styles**: kebab-case (`app.css`)

#### Directory Structure
```
src/
├── components/          # Reusable components
├── pages/              # Route components
├── services/           # API services
├── lib/                # Utilities and helpers
├── context/            # React context providers
├── hooks/              # Custom hooks
├── styles/             # Global styles
└── assets/             # Images, icons, fonts
```

#### Component Structure
```javascript
// Component file structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import service from '@/services/exampleService';

const ComponentName = () => {
  // State and hooks
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: service.getData
  });

  // Event handlers
  const handleClick = () => {
    // Handle click
  };

  // Render
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default ComponentName;
```

### Git Workflow

#### Branching Strategy
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/***: Feature development
- **hotfix/***: Emergency fixes

#### Commit Message Format
```
<type>: <description>

Examples:
feat: add work order creation form
fix: resolve inventory count discrepancy
docs: update API documentation
refactor: simplify component structure
```

#### Pull Request Guidelines
- Create feature branches from `develop`
- Include relevant tests
- Update documentation if needed
- Ensure all checks pass
- Get code review approval

## Deployment

### Build Process

1. **Production build**:
```bash
npm run build
```

2. **Build artifacts**:
- Output directory: `dist/`
- Optimized for production
- Minified and bundled

### Deployment Options

#### 
custom vps server availiable.

#### 3. Docker
Create a Dockerfile for containerized deployment:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["node", "serve-dist.js"]
```

### Environment Configuration

#### Production Environment Variables
```bash
# .env.production
VITE_API_BASE_URL=https://api.pcbxpress.com
VITE_APP_NAME="PCBxpress ERP"
VITE_APP_VERSION="1.0.0"
```

#### Security Considerations
- Never commit sensitive data to repository
- Use environment variables for API keys
- Implement proper CORS configuration
- Enable HTTPS in production

### Monitoring and Logging

#### Error Tracking
- Implement error boundaries
- Use logging service (e.g., Sentry)
- Monitor API response times

#### Performance Monitoring
- Track bundle size
- Monitor page load times
- Use performance metrics

## Conclusion

This documentation provides a comprehensive guide to developing and maintaining the PCBxpress ERP system. The architecture is designed for scalability, maintainability, and ease of development while addressing the specific needs of PCB manufacturing operations.

### Key Takeaways

1. **Domain-Specific Design**: The system is tailored for PCB manufacturing workflows
2. **Modern Architecture**: Uses React, TanStack Query, and Tailwind CSS
3. **Modular Structure**: Clear separation of concerns across modules
4. **Developer-Friendly**: Comprehensive tooling and conventions
5. **Scalable**: Designed to grow with business needs

### Getting Help

- **Code Comments**: Inline documentation for complex logic
- **Issue Tracking**: Use GitHub issues for bug reports and feature requests
- **Team Communication**: Regular code reviews and knowledge sharing

For additional questions or clarifications, please refer to the codebase or consult with the development team.



+------------------------------------------------------------------------------+
|  ████████████████████████████████████████████████████████████████████████  |
|  █  END OF DEVELOPER DOCUMENTATION  |  REV: ____  |  STATUS: FINAL       █  |
|  ████████████████████████████████████████████████████████████████████████  |
|                                                                              |
|  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |
|  NOTE: Keep this footer unchanged for traceability.                          |
+------------------------------------------------------------------------------+

