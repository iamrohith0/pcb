package com.pcbxpress.erp.modules.production.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/production",
    "/production/**",
    "/api/production",
    "/api/production/**"
})
public class ProductionStubController extends AbstractStubController {
}
