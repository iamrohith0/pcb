package com.pcbxpress.erp.modules.procurement.suppliers.service;

import com.pcbxpress.erp.modules.procurement.suppliers.dto.SupplierDto;
import com.pcbxpress.erp.modules.procurement.suppliers.dto.SupplierPayload;
import com.pcbxpress.erp.modules.procurement.suppliers.model.Supplier;
import com.pcbxpress.erp.modules.procurement.suppliers.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<SupplierDto> list(String query, String status) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "updatedAt"));
        
        if ((status == null || status.isBlank() || "all".equalsIgnoreCase(status)) && 
            (query == null || query.isBlank())) {
            return supplierRepository.findAll(pageable).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        }
        
        Page<Supplier> page = supplierRepository.findByStatusAndQuery(
            status, query != null ? query.trim() : "", pageable);
        
        return page.getContent().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public SupplierDto get(String id) {
        Supplier supplier = supplierRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        return toDto(supplier);
    }

    public SupplierDto create(SupplierPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Supplier supplier = new Supplier();
        supplier.setId(UUID.randomUUID());
        applyPayload(supplier, payload, null);
        
        // Auto-generate supplier code if not provided
        if (supplier.getSupplierCode() == null || supplier.getSupplierCode().isBlank()) {
            supplier.setSupplierCode(generateSupplierCode());
        }
        
        if (supplier.getStatus() == null || supplier.getStatus().isBlank()) {
            supplier.setStatus("ACTIVE");
        }
        
        Supplier saved = supplierRepository.save(supplier);
        return toDto(saved);
    }

    public SupplierDto update(String id, SupplierPayload payload) {
        Supplier existing = supplierRepository.findById(parseId(id))
            .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId());
        applyPayload(existing, payload, existing);
        
        Supplier saved = supplierRepository.save(existing);
        return toDto(saved);
    }

    public void delete(String id) {
        supplierRepository.deleteById(parseId(id));
    }

    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(SupplierService::parseId).collect(Collectors.toList());
        supplierRepository.deleteAllById(uuidList);
    }

    public Map<String, Object> stats() {
        List<Supplier> all = supplierRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus())).count();
        long inactive = all.stream().filter(s -> "INACTIVE".equalsIgnoreCase(s.getStatus())).count();
        long blocked = all.stream().filter(s -> "BLOCKED".equalsIgnoreCase(s.getStatus())).count();
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "blocked", blocked
        );
    }

    public String exportCsv(List<SupplierDto> data) {
        String header = "Supplier Code,Name,Company,Email,Phone,City,State,GSTIN,PAN,Status,Lead Time,Payment Terms";
        String rows = data.stream()
            .map(s -> String.join(",",
                safe(s.supplierCode()),
                safe(s.name()),
                safe(s.companyName()),
                safe(s.email()),
                safe(s.phone()),
                safe(s.city()),
                safe(s.state()),
                safe(s.gstin()),
                safe(s.pan()),
                safe(s.status()),
                String.valueOf(s.leadTimeDays() != null ? s.leadTimeDays() : ""),
                safe(s.paymentTerms())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid supplier ID: " + id);
        }
    }

    private static String generateSupplierCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "SUP-" + token;
    }
    
    private void validateUniqueConstraints(SupplierPayload payload, UUID existingId) {
        // Check for duplicate supplier name
        if (payload.name() != null && !payload.name().isBlank()) {
            boolean exists = supplierRepository.existsByNameIgnoreCaseAndIdNot(payload.name(), existingId);
            if (exists) {
                throw new IllegalArgumentException("Supplier name already exists: " + payload.name());
            }
        }
        
        // Check for duplicate company name
        if (payload.companyName() != null && !payload.companyName().isBlank()) {
            boolean exists = supplierRepository.existsByCompanyNameIgnoreCaseAndIdNot(payload.companyName(), existingId);
            if (exists) {
                throw new IllegalArgumentException("Company name already exists: " + payload.companyName());
            }
        }
        
        // Check for duplicate supplier code
        if (payload.supplierCode() != null && !payload.supplierCode().isBlank()) {
            boolean exists = supplierRepository.existsBySupplierCodeIgnoreCaseAndIdNot(payload.supplierCode(), existingId);
            if (exists) {
                throw new IllegalArgumentException("Supplier code already exists: " + payload.supplierCode());
            }
        }
        
        // Check for duplicate email
        if (payload.email() != null && !payload.email().isBlank()) {
            boolean exists = supplierRepository.existsByEmailIgnoreCaseAndIdNot(payload.email(), existingId);
            if (exists) {
                throw new IllegalArgumentException("Email already exists: " + payload.email());
            }
        }
        
        // Check for duplicate GSTIN
        if (payload.gstin() != null && !payload.gstin().isBlank()) {
            boolean exists = supplierRepository.existsByGstinIgnoreCaseAndIdNot(payload.gstin(), existingId);
            if (exists) {
                throw new IllegalArgumentException("GSTIN already exists: " + payload.gstin());
            }
        }
        
        // Check for duplicate PAN
        if (payload.pan() != null && !payload.pan().isBlank()) {
            boolean exists = supplierRepository.existsByPanIgnoreCaseAndIdNot(payload.pan(), existingId);
            if (exists) {
                throw new IllegalArgumentException("PAN already exists: " + payload.pan());
            }
        }
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }

    private static boolean matchesQuery(Supplier supplier, String query) {
        String q = query.toLowerCase();
        return contains(supplier.getSupplierCode(), q)
            || contains(supplier.getName(), q)
            || contains(supplier.getCompanyName(), q)
            || contains(supplier.getEmail(), q)
            || contains(supplier.getPhone(), q)
            || contains(supplier.getGstin(), q)
            || contains(supplier.getPan(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }

    private void applyPayload(Supplier target, SupplierPayload payload, Supplier existing) {
        target.setName(firstNonNull(payload.name(), existing != null ? existing.getName() : null));
        target.setCompanyName(firstNonNull(payload.companyName(), existing != null ? existing.getCompanyName() : null));
        target.setSupplierCode(firstNonNull(payload.supplierCode(), existing != null ? existing.getSupplierCode() : null));
        target.setEmail(firstNonNull(payload.email(), existing != null ? existing.getEmail() : null));
        target.setPhone(firstNonNull(payload.phone(), existing != null ? existing.getPhone() : null));
        target.setWebsite(firstNonNull(payload.website(), existing != null ? existing.getWebsite() : null));
        target.setGstin(firstNonNull(payload.gstin(), existing != null ? existing.getGstin() : null));
        target.setPan(firstNonNull(payload.pan(), existing != null ? existing.getPan() : null));
        target.setStatus(firstNonNull(payload.status(), existing != null ? existing.getStatus() : null));
        target.setNotes(firstNonNull(payload.notes(), existing != null ? existing.getNotes() : null));
        
        target.setContactPerson(firstNonNull(payload.contactPerson(), existing != null ? existing.getContactPerson() : null));
        target.setAddressLine1(firstNonNull(payload.addressLine1(), existing != null ? existing.getAddressLine1() : null));
        target.setAddressLine2(firstNonNull(payload.addressLine2(), existing != null ? existing.getAddressLine2() : null));
        target.setCity(firstNonNull(payload.city(), existing != null ? existing.getCity() : null));
        target.setState(firstNonNull(payload.state(), existing != null ? existing.getState() : null));
        target.setPincode(firstNonNull(payload.pincode(), existing != null ? existing.getPincode() : null));
        target.setCountry(firstNonNull(payload.country(), existing != null ? existing.getCountry() : null));
        
        target.setLeadTimeDays(firstNonNull(payload.leadTimeDays(), existing != null ? existing.getLeadTimeDays() : null));
        target.setPaymentTerms(firstNonNull(payload.paymentTerms(), existing != null ? existing.getPaymentTerms() : null));
        target.setCreditLimit(firstNonNull(payload.creditLimit(), existing != null ? existing.getCreditLimit() : null));
        target.setCurrency(firstNonNull(payload.currency(), existing != null ? existing.getCurrency() : null));
        
        target.setPreferredPaymentMethod(firstNonNull(payload.preferredPaymentMethod(), existing != null ? existing.getPreferredPaymentMethod() : null));
        target.setBankName(firstNonNull(payload.bankName(), existing != null ? existing.getBankName() : null));
        target.setBankAccountNo(firstNonNull(payload.bankAccountNo(), existing != null ? existing.getBankAccountNo() : null));
        target.setBankIfsc(firstNonNull(payload.bankIfsc(), existing != null ? existing.getBankIfsc() : null));

        if (target.getStatus() == null || target.getStatus().isBlank()) {
            target.setStatus("ACTIVE");
        }
    }

    private SupplierDto toDto(Supplier supplier) {
        return new SupplierDto(
            supplier.getId().toString(),
            supplier.getSupplierCode(),
            supplier.getName(),
            supplier.getCompanyName(),
            supplier.getEmail(),
            supplier.getPhone(),
            supplier.getWebsite(),
            supplier.getGstin(),
            supplier.getPan(),
            supplier.getStatus(),
            supplier.getContactPerson(),
            supplier.getAddressLine1(),
            supplier.getAddressLine2(),
            supplier.getCity(),
            supplier.getState(),
            supplier.getPincode(),
            supplier.getCountry(),
            supplier.getLeadTimeDays(),
            supplier.getPaymentTerms(),
            supplier.getCreditLimit() != null ? supplier.getCreditLimit().toString() : null,
            supplier.getCurrency(),
            supplier.getPreferredPaymentMethod(),
            supplier.getBankName(),
            supplier.getBankAccountNo(),
            supplier.getBankIfsc(),
            supplier.getNotes(),
            safeOffset(supplier.getCreatedAt()),
            safeOffset(supplier.getUpdatedAt())
        );
    }

    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }

    private static <T> T firstNonNull(T candidate, T fallback) {
        return candidate != null ? candidate : fallback;
    }
}