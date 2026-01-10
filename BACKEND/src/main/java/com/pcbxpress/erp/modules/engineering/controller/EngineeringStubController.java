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
    "/api/cam-outputs/**",
    "/dfm-checklists",
    "/dfm-checklists/**",
    "/api/dfm-checklists",
    "/api/dfm-checklists/**",
    "/stackup-templates",
    "/stackup-templates/**",
    "/api/stackup-templates",
    "/api/stackup-templates/**",
    "/material-rules",
    "/material-rules/**",
    "/api/material-rules",
    "/api/material-rules/**"
})
public class EngineeringStubController extends AbstractStubController {
}
