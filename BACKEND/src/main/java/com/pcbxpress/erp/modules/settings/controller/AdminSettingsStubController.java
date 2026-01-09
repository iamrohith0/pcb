package com.pcbxpress.erp.modules.settings.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/settings",
    "/settings/**",
    "/api/settings",
    "/api/settings/**",
    "/permissions",
    "/permissions/**",
    "/api/permissions",
    "/api/permissions/**",
    "/roles",
    "/roles/**",
    "/api/roles",
    "/api/roles/**",
    "/users",
    "/users/**",
    "/api/users",
    "/api/users/**",
    "/masters",
    "/masters/**",
    "/api/masters",
    "/api/masters/**",
    "/plants",
    "/plants/**",
    "/api/plants",
    "/api/plants/**",
    "/smtp",
    "/smtp/**",
    "/api/smtp",
    "/api/smtp/**",
    "/barcodes",
    "/barcodes/**",
    "/api/barcodes",
    "/api/barcodes/**",
    "/lot-numbering",
    "/lot-numbering/**",
    "/api/lot-numbering",
    "/api/lot-numbering/**",
    "/settings/lot-numbering",
    "/settings/lot-numbering/**",
    "/api/settings/lot-numbering",
    "/api/settings/lot-numbering/**",
    "/audit-logs",
    "/audit-logs/**",
    "/api/audit-logs",
    "/api/audit-logs/**"
})
public class AdminSettingsStubController extends AbstractStubController {
}
