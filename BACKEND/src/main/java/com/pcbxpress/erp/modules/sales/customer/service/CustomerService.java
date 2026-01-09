package com.pcbxpress.erp.modules.sales.customer.service;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.ComplianceInfo;
import com.pcbxpress.erp.modules.sales.common.CreditInfo;
import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import com.pcbxpress.erp.modules.sales.common.Preferences;
import com.pcbxpress.erp.modules.sales.customer.dto.CustomerDto;
import com.pcbxpress.erp.modules.sales.customer.dto.CustomerPayload;
import com.pcbxpress.erp.modules.sales.customer.model.Customer;
import com.pcbxpress.erp.modules.sales.customer.repository.CustomerRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<CustomerDto> list(String query, String status) {
        return customerRepository.findAll().stream()
            .filter(c -> query == null || matchesQuery(c, query))
            .filter(c -> status == null || status.isBlank() || status.equalsIgnoreCase("all")
                || safe(c.getStatus()).equalsIgnoreCase(status))
            .sorted(Comparator.comparing(Customer::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .toList();
    }

    public CustomerDto get(String id) {
        Customer customer = customerRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Customer not found: " + id));
        return toDto(customer);
    }

    public CustomerSummary summary(String id) {
        Customer customer = customerRepository.findById(parseId(id)).orElse(null);
        if (customer == null) {
            return null;
        }
        String displayName = bestCompanyName(customer);
        return new CustomerSummary(
            customer.getId().toString(),
            displayName,
            customer.getName(),
            customer.getEmail(),
            customer.getPhone()
        );
    }

    public CustomerDto create(CustomerPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        applyPayload(customer, payload, null);
        ensureNameFromCompany(customer);
        
        // Only auto-generate customer code if not provided by user
        // If user provided a code (even if generated on frontend), use it
        if (customer.getCustomerCode() == null || customer.getCustomerCode().isBlank()) {
            customer.setCustomerCode(generateCustomerCode());
        }
        
        if (customer.getStatus() == null || customer.getStatus().isBlank()) {
            customer.setStatus("ACTIVE");
        }
        
        Customer saved = customerRepository.save(customer);
        return toDto(saved);
    }

    public CustomerDto update(String id, CustomerPayload payload) {
        Customer existing = customerRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Customer not found: " + id));
        applyPayload(existing, payload, existing);
        ensureNameFromCompany(existing);
        Customer saved = customerRepository.save(existing);
        return toDto(saved);
    }

    public void delete(String id) {
        customerRepository.deleteById(parseId(id));
    }

    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(CustomerService::parseId).toList();
        customerRepository.deleteAllById(uuidList);
    }

    public Map<String, Object> stats() {
        List<Customer> all = customerRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(c -> "ACTIVE".equalsIgnoreCase(safe(c.getStatus()))).count();
        long inactive = all.stream().filter(c -> "INACTIVE".equalsIgnoreCase(safe(c.getStatus()))).count();
        long blocked = all.stream().filter(c -> "BLOCKED".equalsIgnoreCase(safe(c.getStatus()))).count();
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "blocked", blocked
        );
    }

    public String exportCsv(List<CustomerDto> data) {
        String header = "Customer Code,Name,Company,Email,Phone,City,State,GSTIN,Status";
        String rows = data.stream()
            .map(c -> String.join(",",
                safe(c.customerCode()),
                safe(c.name()),
                safe(c.companyName()),
                safe(c.email()),
                safe(c.phone()),
                safe(c.city()),
                safe(c.state()),
                safe(c.gstin()),
                safe(c.status())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Customer not found: " + id);
        }
    }

    private static String generateCustomerCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "CUST-" + token;
    }
    
    private void validateUniqueConstraints(CustomerPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate customer name
        if (payload.name() != null && !payload.name().isBlank()) {
            boolean exists = customerRepository.existsByNameIgnoreCaseAndIdNot(payload.name(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Customer name already exists: " + payload.name());
            }
        }
        
        // Check for duplicate company name
        if (payload.companyName() != null && !payload.companyName().isBlank()) {
            boolean exists = customerRepository.existsByCompanyNameIgnoreCaseAndIdNot(payload.companyName(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Company name already exists: " + payload.companyName());
            }
        }
        
        // Check for duplicate customer code
        if (payload.customerCode() != null && !payload.customerCode().isBlank()) {
            boolean exists = customerRepository.existsByCustomerCodeIgnoreCaseAndIdNot(payload.customerCode(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Customer code already exists: " + payload.customerCode());
            }
        }
        
        // Check for duplicate email
        if (payload.email() != null && !payload.email().isBlank()) {
            boolean exists = customerRepository.existsByEmailIgnoreCaseAndIdNot(payload.email(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Email already exists: " + payload.email());
            }
        }
        
        // Check for duplicate phone
        if (payload.phone() != null && !payload.phone().isBlank()) {
            boolean exists = customerRepository.existsByPhoneIgnoreCaseAndIdNot(payload.phone(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Phone number already exists: " + payload.phone());
            }
        }
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static boolean matchesQuery(Customer customer, String query) {
        String q = query.toLowerCase(Locale.ROOT);
        return contains(customer.getCustomerCode(), q)
            || contains(customer.getName(), q)
            || contains(customer.getCompanyName(), q)
            || contains(customer.getEmail(), q)
            || contains(customer.getPhone(), q)
            || contains(customer.getGstin(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private void applyPayload(Customer target, CustomerPayload payload, Customer existing) {
        target.setName(firstNonNull(payload.name(), existing != null ? existing.getName() : null));
        target.setCompanyName(firstNonNull(payload.companyName(), existing != null ? existing.getCompanyName() : null));
        target.setCustomerCode(firstNonNull(payload.customerCode(), existing != null ? existing.getCustomerCode() : null));
        target.setEmail(firstNonNull(payload.email(), existing != null ? existing.getEmail() : null));
        target.setPhone(firstNonNull(payload.phone(), existing != null ? existing.getPhone() : null));
        target.setWebsite(firstNonNull(payload.website(), existing != null ? existing.getWebsite() : null));
        target.setGstin(firstNonNull(payload.gstin(), existing != null ? existing.getGstin() : null));
        target.setPan(firstNonNull(payload.pan(), existing != null ? existing.getPan() : null));
        target.setStatus(firstNonNull(payload.status(), existing != null ? existing.getStatus() : null));
        target.setNotes(firstNonNull(payload.notes(), existing != null ? existing.getNotes() : null));

        AddressDto billing = payload.billing() != null ? payload.billing() : (existing != null ? toBilling(existing) : emptyAddress());
        AddressDto shipping = payload.shipping() != null ? payload.shipping() : (existing != null ? toShipping(existing) : emptyAddress());

        target.setBillingName(billing.name());
        target.setBillingAddressLine1(billing.addressLine1());
        target.setBillingAddressLine2(billing.addressLine2());
        target.setBillingCity(billing.city());
        target.setBillingState(billing.state());
        target.setBillingPincode(billing.pincode());
        target.setBillingCountry(billing.country());
        target.setBillingGstin(billing.gstin());

        target.setShippingName(shipping.name());
        target.setShippingAddressLine1(shipping.addressLine1());
        target.setShippingAddressLine2(shipping.addressLine2());
        target.setShippingCity(shipping.city());
        target.setShippingState(shipping.state());
        target.setShippingPincode(shipping.pincode());
        target.setShippingCountry(shipping.country());
        target.setShippingGstin(shipping.gstin());

        CreditInfo credit = payload.credit() != null ? payload.credit()
            : existing != null ? new CreditInfo(existing.getCreditLimit(), existing.getPaymentTermsDays(), existing.getCurrency())
            : new CreditInfo(null, null, "INR");
        target.setCreditLimit(credit.creditLimit());
        target.setPaymentTermsDays(credit.paymentTermsDays());
        target.setCurrency(credit.currency());

        ComplianceInfo compliance = payload.compliance() != null ? payload.compliance()
            : existing != null ? new ComplianceInfo(existing.isComplianceNdaRequired(), existing.isComplianceIpSensitive(), existing.isComplianceExportRestricted())
            : new ComplianceInfo(false, false, false);
        target.setComplianceNdaRequired(compliance.ndaRequired());
        target.setComplianceIpSensitive(compliance.ipSensitive());
        target.setComplianceExportRestricted(compliance.exportRestricted());

        Preferences preferences = payload.preferences() != null ? payload.preferences()
            : existing != null ? new Preferences(
                existing.getPreferredFinish(),
                existing.getPreferredCopperOz(),
                existing.getPreferredSolderMask(),
                existing.getPreferredLegend(),
                existing.getPreferredPackaging(),
                existing.getPreferredCourier()
            )
            : new Preferences(null, null, null, null, null, null);
        target.setPreferredFinish(preferences.preferredFinish());
        target.setPreferredCopperOz(preferences.preferredCopperOz());
        target.setPreferredSolderMask(preferences.preferredSolderMask());
        target.setPreferredLegend(preferences.preferredLegend());
        target.setPreferredPackaging(preferences.preferredPackaging());
        target.setPreferredCourier(preferences.preferredCourier());

        if (target.getStatus() == null || target.getStatus().isBlank()) {
            target.setStatus("ACTIVE");
        }
    }

    private CustomerDto toDto(Customer customer) {
        AddressDto billing = toBilling(customer);
        AddressDto shipping = toShipping(customer);
        AddressDto primary = primary(billing, shipping);
        String companyName = bestCompanyName(customer);
        return new CustomerDto(
            customer.getId().toString(),
            customer.getCustomerCode(),
            customer.getName(),
            companyName,
            customer.getEmail(),
            customer.getPhone(),
            customer.getWebsite(),
            customer.getGstin(),
            customer.getPan(),
            customer.getStatus(),
            billing,
            shipping,
            new CreditInfo(customer.getCreditLimit(), customer.getPaymentTermsDays(), customer.getCurrency()),
            new ComplianceInfo(customer.isComplianceNdaRequired(), customer.isComplianceIpSensitive(), customer.isComplianceExportRestricted()),
            new Preferences(
                customer.getPreferredFinish(),
                customer.getPreferredCopperOz(),
                customer.getPreferredSolderMask(),
                customer.getPreferredLegend(),
                customer.getPreferredPackaging(),
                customer.getPreferredCourier()
            ),
            customer.getNotes(),
            primary.addressLine1(),
            primary.addressLine2(),
            primary.city(),
            primary.state(),
            primary.country(),
            primary.pincode(),
            companyName,
            safeOffset(customer.getCreatedAt()),
            safeOffset(customer.getUpdatedAt())
        );
    }

    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }

    private static String firstNonNull(String candidate, String fallback) {
        return candidate != null ? candidate : fallback;
    }

    private static AddressDto primary(AddressDto billing, AddressDto shipping) {
        if (billing != null && billing.addressLine1() != null && !billing.addressLine1().isBlank()) {
            return billing;
        }
        return shipping != null ? shipping : emptyAddress();
    }

    private static AddressDto emptyAddress() {
        return new AddressDto(null, null, null, null, null, null, "India", null);
    }

    private static AddressDto toBilling(Customer customer) {
        return new AddressDto(
            customer.getBillingName(),
            customer.getBillingAddressLine1(),
            customer.getBillingAddressLine2(),
            customer.getBillingCity(),
            customer.getBillingState(),
            customer.getBillingPincode(),
            customer.getBillingCountry(),
            customer.getBillingGstin()
        );
    }

    private static AddressDto toShipping(Customer customer) {
        return new AddressDto(
            customer.getShippingName(),
            customer.getShippingAddressLine1(),
            customer.getShippingAddressLine2(),
            customer.getShippingCity(),
            customer.getShippingState(),
            customer.getShippingPincode(),
            customer.getShippingCountry(),
            customer.getShippingGstin()
        );
    }

    private static String bestCompanyName(Customer customer) {
        if (customer.getCompanyName() != null && !customer.getCompanyName().isBlank()) {
            return customer.getCompanyName();
        }
        return customer.getName();
    }

    private static void ensureNameFromCompany(Customer customer) {
        if (customer.getName() == null || customer.getName().isBlank()) {
            String companyName = customer.getCompanyName();
            if (companyName != null && !companyName.isBlank()) {
                customer.setName(companyName);
            }
        }
    }
}
