package com.pcbxpress.erp.modules.traceability.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/traceability",
    "/traceability/**",
    "/api/traceability",
    "/api/traceability/**"
})
public class TraceabilityStubController extends AbstractStubController {
}
