package com.pcbxpress.erp.modules.integrations.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/integrations",
    "/integrations/**",
    "/api/integrations",
    "/api/integrations/**"
})
public class IntegrationsStubController extends AbstractStubController {
}
