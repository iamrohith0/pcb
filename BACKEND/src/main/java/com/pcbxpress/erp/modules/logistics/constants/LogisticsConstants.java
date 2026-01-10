package com.pcbxpress.erp.modules.logistics.constants;

/**
 * Constants for Logistics module
 */
public class LogisticsConstants {
    
    // API Endpoints
    public static final String API_BASE_PATH = "/api/logistics";
    public static final String DISPATCH_ENDPOINT = "/dispatch";
    public static final String SHIPMENT_ENDPOINT = "/shipments";
    public static final String TRACKING_ENDPOINT = "/tracking";
    
    // Validation Constants
    public static final int MAX_TRACKING_ID_LENGTH = 100;
    public static final int MAX_CODE_LENGTH = 50;
    public static final int MAX_DESCRIPTION_LENGTH = 200;
    public static final int MAX_ADDRESS_LENGTH = 500;
    public static final int MAX_CONTACT_NAME_LENGTH = 200;
    public static final int MAX_PHONE_LENGTH = 50;
    public static final int MAX_EMAIL_LENGTH = 200;
    public static final int MAX_CARRIER_NAME_LENGTH = 200;
    public static final int MAX_LOCATION_NAME_LENGTH = 200;
    public static final int MAX_CITY_LENGTH = 100;
    public static final int MAX_STATE_LENGTH = 100;
    public static final int MAX_COUNTRY_LENGTH = 100;
    public static final int MAX_POSTAL_CODE_LENGTH = 20;
    public static final int MAX_NOTES_LENGTH = 1000;
    
    // Numeric Constants
    public static final int MAX_PACKAGE_COUNT = 999;
    public static final int MAX_ITEM_COUNT = 9999;
    public static final int MAX_DELIVERY_ATTEMPTS = 10;
    public static final double MAX_WEIGHT = 999999.999;
    public static final double MAX_DIMENSION = 9999.99;
    public static final double MAX_LATITUDE = 90.0;
    public static final double MIN_LATITUDE = -90.0;
    public static final double MAX_LONGITUDE = 180.0;
    public static final double MIN_LONGITUDE = -180.0;
    public static final double MAX_CHARGE = 9999999.99;
    
    // Date Constants
    public static final int MAX_DAYS_IN_PAST = 365;
    public static final int MAX_DAYS_IN_FUTURE = 365;
    
    // Status Constants
    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_DISPATCHED = "DISPATCHED";
    public static final String STATUS_IN_TRANSIT = "IN_TRANSIT";
    public static final String STATUS_DELIVERED = "DELIVERED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_RETURNED = "RETURNED";
    public static final String STATUS_PREPARING = "PREPARING";
    public static final String STATUS_PICKING = "PICKING";
    public static final String STATUS_PACKING = "PACKING";
    public static final String STATUS_READY_TO_SHIP = "READY_TO_SHIP";
    public static final String STATUS_SHIPPED = "SHIPPED";
    public static final String STATUS_FAILED_DELIVERY = "FAILED_DELIVERY";
    public static final String STATUS_EXCEPTION = "EXCEPTION";
    public static final String STATUS_AVAILABLE_FOR_PICKUP = "AVAILABLE_FOR_PICKUP";
    public static final String STATUS_PICKED_UP = "PICKED_UP";
    public static final String STATUS_OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY";
    
    // Priority Constants
    public static final String PRIORITY_LOW = "LOW";
    public static final String PRIORITY_NORMAL = "NORMAL";
    public static final String PRIORITY_HIGH = "HIGH";
    public static final String PRIORITY_URGENT = "URGENT";
    
    // Type Constants
    public static final String TYPE_STANDARD = "STANDARD";
    public static final String TYPE_EXPRESS = "EXPRESS";
    public static final String TYPE_OVERNIGHT = "OVERNIGHT";
    public static final String TYPE_FREIGHT = "FREIGHT";
    public static final String TYPE_COURIER = "COURIER";
    public static final String TYPE_DOMESTIC = "DOMESTIC";
    public static final String TYPE_INTERNATIONAL = "INTERNATIONAL";
    public static final String TYPE_SHIPMENT = "SHIPMENT";
    public static final String TYPE_PACKAGE = "PACKAGE";
    public static final String TYPE_PARCEL = "PARCEL";
    
    // Service Level Constants
    public static final String SERVICE_LEVEL_STANDARD = "STANDARD";
    public static final String SERVICE_LEVEL_EXPRESS = "EXPRESS";
    public static final String SERVICE_LEVEL_OVERNIGHT = "OVERNIGHT";
    public static final String SERVICE_LEVEL_SAME_DAY = "SAME_DAY";
    public static final String SERVICE_LEVEL_ECONOMY = "ECONOMY";
    
    // Unit Constants
    public static final String UNIT_KG = "KG";
    public static final String UNIT_LB = "LB";
    public static final String UNIT_G = "G";
    public static final String UNIT_OZ = "OZ";
    public static final String UNIT_CM = "CM";
    public static final String UNIT_IN = "IN";
    public static final String UNIT_M = "M";
    public static final String UNIT_FT = "FT";
    
    // Currency Constants
    public static final String CURRENCY_USD = "USD";
    public static final String CURRENCY_EUR = "EUR";
    public static final String CURRENCY_GBP = "GBP";
    public static final String CURRENCY_INR = "INR";
    
    // Error Messages
    public static final String ERROR_DISPATCH_NOT_FOUND = "Dispatch not found with ID: ";
    public static final String ERROR_SHIPMENT_NOT_FOUND = "Shipment not found with ID: ";
    public static final String ERROR_TRACKING_NOT_FOUND = "Tracking not found with ID: ";
    public static final String ERROR_DISPATCH_CODE_EXISTS = "Dispatch code already exists: ";
    public static final String ERROR_SHIPMENT_CODE_EXISTS = "Shipment code already exists: ";
    public static final String ERROR_TRACKING_ID_EXISTS = "Tracking ID already exists: ";
    public static final String ERROR_INVALID_TRACKING_ID = "Invalid tracking ID format";
    public static final String ERROR_INVALID_WEIGHT = "Weight must be between 0 and " + MAX_WEIGHT;
    public static final String ERROR_INVALID_DIMENSION = "Dimension must be between 0 and " + MAX_DIMENSION;
    public static final String ERROR_INVALID_COORDINATES = "Latitude must be between -90 and 90, Longitude must be between -180 and 180";
    public static final String ERROR_INVALID_PACKAGE_COUNT = "Package count must be between 0 and " + MAX_PACKAGE_COUNT;
    public static final String ERROR_INVALID_ITEM_COUNT = "Item count must be between 0 and " + MAX_ITEM_COUNT;
    public static final String ERROR_INVALID_DELIVERY_ATTEMPTS = "Delivery attempts must be between 0 and " + MAX_DELIVERY_ATTEMPTS;
    
    // Success Messages
    public static final String SUCCESS_DISPATCH_CREATED = "Dispatch created successfully";
    public static final String SUCCESS_DISPATCH_UPDATED = "Dispatch updated successfully";
    public static final String SUCCESS_DISPATCH_DELETED = "Dispatch deleted successfully";
    public static final String SUCCESS_SHIPMENT_CREATED = "Shipment created successfully";
    public static final String SUCCESS_SHIPMENT_UPDATED = "Shipment updated successfully";
    public static final String SUCCESS_SHIPMENT_DELETED = "Shipment deleted successfully";
    public static final String SUCCESS_TRACKING_CREATED = "Tracking record created successfully";
    public static final String SUCCESS_TRACKING_UPDATED = "Tracking record updated successfully";
    public static final String SUCCESS_TRACKING_DELETED = "Tracking record deleted successfully";
    
    // Default Values
    public static final String DEFAULT_PRIORITY = PRIORITY_NORMAL;
    public static final String DEFAULT_TYPE = TYPE_STANDARD;
    public static final String DEFAULT_SERVICE_LEVEL = SERVICE_LEVEL_STANDARD;
    public static final String DEFAULT_WEIGHT_UNIT = UNIT_KG;
    public static final String DEFAULT_DIMENSION_UNIT = UNIT_CM;
    public static final String DEFAULT_CURRENCY = CURRENCY_USD;
    
    // Report Constants
    public static final String REPORT_TYPE_SUMMARY = "SUMMARY";
    public static final String REPORT_TYPE_DETAILED = "DETAILED";
    public static final String REPORT_TYPE_ANALYTICS = "ANALYTICS";
    
    // Search Constants
    public static final int MAX_SEARCH_RESULTS = 1000;
    public static final int DEFAULT_PAGE_SIZE = 20;
    
    // File Export Constants
    public static final String EXPORT_FORMAT_CSV = "CSV";
    public static final String EXPORT_FORMAT_EXCEL = "EXCEL";
    public static final String EXPORT_FORMAT_PDF = "PDF";
    
    private LogisticsConstants() {
        // Private constructor to prevent instantiation
    }
}