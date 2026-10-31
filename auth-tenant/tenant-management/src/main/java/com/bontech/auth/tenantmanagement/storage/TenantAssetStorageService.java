package com.bontech.auth.tenantmanagement.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@Slf4j
public class TenantAssetStorageService {

    private static final String UPLOAD_DIR = "/tmp/tenants";

    public String storeLogo(String tenantCode, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("فایل لوگو معتبر نیست");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = ".png";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        Path tenantPath = Paths.get(UPLOAD_DIR, tenantCode);
        Files.createDirectories(tenantPath);

        String filename = "logo" + extension;
        Path targetPath = tenantPath.resolve(filename);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        log.info("[TenantAsset] Stored logo for tenant '{}' at {}", tenantCode, targetPath);

        // Return path relative to auth-server asset endpoint
        return "/tenant-assets/" + tenantCode + "/logo";
    }

    public Path getLogoPath(String tenantCode) {
        Path png = Paths.get(UPLOAD_DIR, tenantCode, "logo.png");
        if (Files.exists(png)) return png;
        Path svg = Paths.get(UPLOAD_DIR, tenantCode, "logo.svg");
        if (Files.exists(svg)) return svg;
        Path jpg = Paths.get(UPLOAD_DIR, tenantCode, "logo.jpg");
        if (Files.exists(jpg)) return jpg;
        return null;
    }
}
