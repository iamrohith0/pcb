package com.pcbxpress.erp.modules.engineering.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/engineering",
    "/engineering/**",
    "/api/engineering",
    "/api/engineering/**",
    "/cam-jobs",
    "/cam-jobs/**",
    "/api/cam-jobs",
    "/api/cam-jobs/**",
    "/cam-outputs",
    "/cam-outputs/**",
    "/api/cam-outputs",
    "/api/cam-outputs/**"
})
public class EngineeringStubController extends AbstractStubController {
}
