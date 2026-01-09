package com.pcbxpress.erp.modules.sales.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/sales/pricing",
    "/sales/pricing/**",
    "/api/sales/pricing",
    "/api/sales/pricing/**"
})
public class SalesStubController extends AbstractStubController {
}
