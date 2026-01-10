package com.pcbxpress.erp.modules.logistics.utils;

import com.pcbxpress.erp.modules.logistics.constants.LogisticsConstants;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Utility class for logistics validation
 */
public class LogisticsValidationUtils {
    
    private static final Pattern TRACKING_ID_PATTERN = Pattern.compile("^[A-Z0-9]{8,20}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9\\-\\s\\(\\)]{7,20}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$");
    
    /**
     * Validate dispatch code
     */
    public static boolean isValidDispatchCode(String code) {
        return StringUtils.hasText(code) && code.length() <= LogisticsConstants.MAX_CODE_LENGTH;
    }
    
    /**
     * Validate shipment code
     */
    public static boolean isValidShipmentCode(String code) {
        return StringUtils.hasText(code) && code.length() <= LogisticsConstants.MAX_CODE_LENGTH;
    }
    
    /**
     * Validate tracking ID
     */
    public static boolean isValidTrackingId(String trackingId) {
        return StringUtils.hasText(trackingId) && 
               trackingId.length() <= LogisticsConstants.MAX_TRACKING_ID_LENGTH &&
               TRACKING_ID_PATTERN.matcher(trackingId).matches();
    }
    
    /**
     * Validate description
     */
    public static boolean isValidDescription(String description) {
        return description == null || description.length() <= LogisticsConstants.MAX_DESCRIPTION_LENGTH;
    }
    
    /**
     * Validate address
     */
    public static boolean isValidAddress(String address) {
        return address == null || address.length() <= LogisticsConstants.MAX_ADDRESS_LENGTH;
    }
    
    /**
     * Validate contact name
     */
    public static boolean isValidContactName(String contactName) {
        return contactName == null || contactName.length() <= LogisticsConstants.MAX_CONTACT_NAME_LENGTH;
    }
    
    /**
     * Validate phone number
     */
    public static boolean isValidPhone(String phone) {
        return phone == null || (phone.length() <= LogisticsConstants.MAX_PHONE_LENGTH && 
               PHONE_PATTERN.matcher(phone).matches());
    }
    
    /**
     * Validate email
     */
    public static boolean isValidEmail(String email) {
        return email == null || (email.length() <= LogisticsConstants.MAX_EMAIL_LENGTH && 
               EMAIL_PATTERN.matcher(email).matches());
    }
    
    /**
     * Validate carrier name
     */
    public static boolean isValidCarrierName(String carrierName) {
        return carrierName == null || carrierName.length() <= LogisticsConstants.MAX_CARRIER_NAME_LENGTH;
    }
    
    /**
     * Validate location name
     */
    public static boolean isValidLocationName(String locationName) {
        return locationName == null || locationName.length() <= LogisticsConstants.MAX_LOCATION_NAME_LENGTH;
    }
    
    /**
     * Validate city
     */
    public static boolean isValidCity(String city) {
        return city == null || city.length() <= LogisticsConstants.MAX_CITY_LENGTH;
    }
    
    /**
     * Validate state
     */
    public static boolean isValidState(String state) {
        return state == null || state.length() <= LogisticsConstants.MAX_STATE_LENGTH;
    }
    
    /**
     * Validate country
     */
    public static boolean isValidCountry(String country) {
        return country == null || country.length() <= LogisticsConstants.MAX_COUNTRY_LENGTH;
    }
    
    /**
     * Validate postal code
     */
    public static boolean isValidPostalCode(String postalCode) {
        return postalCode == null || postalCode.length() <= LogisticsConstants.MAX_POSTAL_CODE_LENGTH;
    }
    
    /**
     * Validate weight
     */
    public static boolean isValidWeight(BigDecimal weight) {
        return weight == null || (weight.compareTo(BigDecimal.ZERO) >= 0 && 
               weight.compareTo(new BigDecimal(LogisticsConstants.MAX_WEIGHT)) <= 0);
    }
    
    /**
     * Validate dimension
     */
    public static boolean isValidDimension(BigDecimal dimension) {
        return dimension == null || (dimension.compareTo(BigDecimal.ZERO) >= 0 && 
               dimension.compareTo(new BigDecimal(LogisticsConstants.MAX_DIMENSION)) <= 0);
    }
    
    /**
     * Validate latitude
     */
    public static boolean isValidLatitude(BigDecimal latitude) {
        return latitude == null || (latitude.compareTo(new BigDecimal(LogisticsConstants.MIN_LATITUDE)) >= 0 && 
               latitude.compareTo(new BigDecimal(LogisticsConstants.MAX_LATITUDE)) <= 0);
    }
    
    /**
     * Validate longitude
     */
    public static boolean isValidLongitude(BigDecimal longitude) {
        return longitude == null || (longitude.compareTo(new BigDecimal(LogisticsConstants.MIN_LONGITUDE)) >= 0 && 
               longitude.compareTo(new BigDecimal(LogisticsConstants.MAX_LONGITUDE)) <= 0);
    }
    
    /**
     * Validate package count
     */
    public static boolean isValidPackageCount(Integer packageCount) {
        return packageCount == null || (packageCount >= 0 && packageCount <= LogisticsConstants.MAX_PACKAGE_COUNT);
    }
    
    /**
     * Validate item count
     */
    public static boolean isValidItemCount(Integer itemCount) {
        return itemCount == null || (itemCount >= 0 && itemCount <= LogisticsConstants.MAX_ITEM_COUNT);
    }
    
    /**
     * Validate delivery attempt count
     */
    public static boolean isValidDeliveryAttemptCount(Integer deliveryAttemptCount) {
        return deliveryAttemptCount == null || (deliveryAttemptCount >= 0 && deliveryAttemptCount <= LogisticsConstants.MAX_DELIVERY_ATTEMPTS);
    }
    
    /**
     * Validate charge
     */
    public static boolean isValidCharge(BigDecimal charge) {
        return charge == null || (charge.compareTo(BigDecimal.ZERO) >= 0 && 
               charge.compareTo(new BigDecimal(LogisticsConstants.MAX_CHARGE)) <= 0);
    }
    
    /**
     * Validate notes
     */
    public static boolean isValidNotes(String notes) {
        return notes == null || notes.length() <= LogisticsConstants.MAX_NOTES_LENGTH;
    }
    
    /**
     * Validate date range
     */
    public static boolean isValidDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !startDate.isAfter(endDate);
    }
    
    /**
     * Validate that date is not too far in the past
     */
    public static boolean isValidPastDate(OffsetDateTime date) {
        if (date == null) {
            return true;
        }
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(LogisticsConstants.MAX_DAYS_IN_PAST);
        return !date.isBefore(cutoff);
    }
    
    /**
     * Validate that date is not too far in the future
     */
    public static boolean isValidFutureDate(OffsetDateTime date) {
        if (date == null) {
            return true;
        }
        OffsetDateTime cutoff = OffsetDateTime.now().plusDays(LogisticsConstants.MAX_DAYS_IN_FUTURE);
        return !date.isAfter(cutoff);
    }
    
    /**
     * Validate required fields for dispatch
     */
    public static boolean validateDispatchRequiredFields(String code, UUID orderId, UUID customerId, UUID warehouseId) {
        return StringUtils.hasText(code) && orderId != null && customerId != null && warehouseId != null;
    }
    
    /**
     * Validate required fields for shipment
     */
    public static boolean validateShipmentRequiredFields(String code, UUID orderId, UUID customerId, UUID warehouseId, UUID carrierId) {
        return StringUtils.hasText(code) && orderId != null && customerId != null && warehouseId != null && carrierId != null;
    }
    
    /**
     * Validate required fields for tracking
     */
    public static boolean validateTrackingRequiredFields(String trackingId, UUID carrierId) {
        return StringUtils.hasText(trackingId) && carrierId != null;
    }
    
    /**
     * Validate status transition for dispatch
     */
    public static boolean isValidDispatchStatusTransition(String fromStatus, String toStatus) {
        if (fromStatus == null || toStatus == null) {
            return true;
        }
        
        // Define valid status transitions
        switch (fromStatus.toUpperCase()) {
            case LogisticsConstants.STATUS_DRAFT:
                return toStatus.equals(LogisticsConstants.STATUS_PENDING) || 
                       toStatus.equals(LogisticsConstants.STATUS_CANCELLED);
            case LogisticsConstants.STATUS_PENDING:
                return toStatus.equals(LogisticsConstants.STATUS_DISPATCHED) || 
                       toStatus.equals(LogisticsConstants.STATUS_CANCELLED);
            case LogisticsConstants.STATUS_DISPATCHED:
                return toStatus.equals(LogisticsConstants.STATUS_IN_TRANSIT) || 
                       toStatus.equals(LogisticsConstants.STATUS_DELIVERED) ||
                       toStatus.equals(LogisticsConstants.STATUS_RETURNED);
            case LogisticsConstants.STATUS_IN_TRANSIT:
                return toStatus.equals(LogisticsConstants.STATUS_DELIVERED) || 
                       toStatus.equals(LogisticsConstants.STATUS_RETURNED);
            case LogisticsConstants.STATUS_DELIVERED:
                return false; // Cannot transition from delivered
            case LogisticsConstants.STATUS_CANCELLED:
                return false; // Cannot transition from cancelled
            case LogisticsConstants.STATUS_RETURNED:
                return false; // Cannot transition from returned
            default:
                return true;
        }
    }
    
    /**
     * Validate status transition for shipment
     */
    public static boolean isValidShipmentStatusTransition(String fromStatus, String toStatus) {
        if (fromStatus == null || toStatus == null) {
            return true;
        }
        
        // Define valid status transitions
        switch (fromStatus.toUpperCase()) {
            case LogisticsConstants.STATUS_DRAFT:
                return toStatus.equals(LogisticsConstants.STATUS_PREPARING) || 
                       toStatus.equals(LogisticsConstants.STATUS_CANCELLED);
            case LogisticsConstants.STATUS_PREPARING:
                return toStatus.equals(LogisticsConstants.STATUS_PICKING) || 
                       toStatus.equals(LogisticsConstants.STATUS_CANCELLED);
            case LogisticsConstants.STATUS_PICKING:
                return toStatus.equals(LogisticsConstants.STATUS_PACKING) || 
                       toStatus.equals(LogisticsConstants.STATUS_CANCELLED);
            case LogisticsConstants.STATUS_PACKING:
                return toStatus.equals(LogisticsConstants.STATUS_READY_TO_SHIP) || 
                       toStatus.equals(LogisticsConstants.STATUS_CANCELLED);
            case LogisticsConstants.STATUS_READY_TO_SHIP:
                return toStatus.equals(LogisticsConstants.STATUS_SHIPPED) || 
                       toStatus.equals(LogisticsConstants.STATUS_CANCELLED);
            case LogisticsConstants.STATUS_SHIPPED:
                return toStatus.equals(LogisticsConstants.STATUS_IN_TRANSIT) || 
                       toStatus.equals(LogisticsConstants.STATUS_DELIVERED) ||
                       toStatus.equals(LogisticsConstants.STATUS_RETURNED);
            case LogisticsConstants.STATUS_IN_TRANSIT:
                return toStatus.equals(LogisticsConstants.STATUS_DELIVERED) || 
                       toStatus.equals(LogisticsConstants.STATUS_RETURNED);
            case LogisticsConstants.STATUS_DELIVERED:
                return false; // Cannot transition from delivered
            case LogisticsConstants.STATUS_CANCELLED:
                return false; // Cannot transition from cancelled
            case LogisticsConstants.STATUS_RETURNED:
                return false; // Cannot transition from returned
            default:
                return true;
        }
    }
    
    /**
     * Validate status transition for tracking
     */
    public static boolean isValidTrackingStatusTransition(String fromStatus, String toStatus) {
        if (fromStatus == null || toStatus == null) {
            return true;
        }
        
        // For tracking, most transitions are allowed as it represents real-time status updates
        // Only restrict some impossible transitions
        switch (fromStatus.toUpperCase()) {
            case LogisticsConstants.STATUS_DELIVERED:
                return toStatus.equals(LogisticsConstants.STATUS_DELIVERED); // Stay delivered
            case LogisticsConstants.STATUS_CANCELLED:
                return toStatus.equals(LogisticsConstants.STATUS_CANCELLED); // Stay cancelled
            default:
                return true;
        }
    }
}