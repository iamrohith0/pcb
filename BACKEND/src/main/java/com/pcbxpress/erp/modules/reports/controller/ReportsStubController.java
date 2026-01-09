package com.pcbxpress.erp.modules.reports.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/reports",
    "/reports/**",
    "/api/reports",
    "/api/reports/**"
})
public class ReportsStubController extends AbstractStubController {
}
