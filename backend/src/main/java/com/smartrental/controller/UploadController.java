package com.smartrental.controller;

import com.smartrental.entity.UploadedImage;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.UploadedImageRepository;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Photo uploads. With CLOUDINARY_URL set, the browser uploads straight to Cloudinary using a
 * short-lived signature from here. Otherwise images are stored by this API and served from /api/uploads/{id}.
 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final Set<String> FOLDERS = Set.of("listings", "avatars", "maintenance");
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int MAX_BYTES = 3 * 1024 * 1024;

    private final UploadedImageRepository images;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public UploadController(UploadedImageRepository images, @Value("${app.cloudinary.url:}") String cloudinaryUrl) {
        this.images = images;
        String name = null, key = null, secret = null;
        if (cloudinaryUrl != null && cloudinaryUrl.startsWith("cloudinary://")) {
            URI uri = URI.create(cloudinaryUrl);
            String[] creds = uri.getUserInfo() == null ? new String[0] : uri.getUserInfo().split(":", 2);
            if (creds.length == 2 && uri.getHost() != null) {
                key = creds[0];
                secret = creds[1];
                name = uri.getHost();
            }
        }
        this.cloudName = name;
        this.apiKey = key;
        this.apiSecret = secret;
    }

    /** Tells the browser how to upload: directly to Cloudinary (signed) or to this API. */
    @GetMapping("/signature")
    public ResponseEntity<Map<String, Object>> signature(@RequestParam(defaultValue = "listings") String folder) {
        CurrentUser.get();
        if (!FOLDERS.contains(folder)) throw ApiException.badRequest("Unknown upload folder");
        Map<String, Object> out = new LinkedHashMap<>();
        if (cloudName == null) {
            out.put("provider", "server");
            out.put("maxBytes", MAX_BYTES);
            return ResponseEntity.ok(out);
        }
        long timestamp = Instant.now().getEpochSecond();
        String fullFolder = "habify/" + folder;
        out.put("provider", "cloudinary");
        out.put("cloudName", cloudName);
        out.put("apiKey", apiKey);
        out.put("timestamp", timestamp);
        out.put("folder", fullFolder);
        out.put("signature", sha1("folder=" + fullFolder + "&timestamp=" + timestamp + apiSecret));
        out.put("uploadUrl", "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload");
        return ResponseEntity.ok(out);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws Exception {
        String owner = CurrentUser.get().id();
        if (file.isEmpty()) throw ApiException.badRequest("The file is empty");
        if (file.getSize() > MAX_BYTES) throw ApiException.badRequest("Photos can be up to 3 MB");
        byte[] bytes = file.getBytes();
        String type = sniff(bytes);
        if (type == null || !TYPES.contains(type)) throw ApiException.badRequest("Upload a JPEG, PNG or WebP photo");

        UploadedImage img = new UploadedImage();
        img.setId(NotificationService.newId("img"));
        img.setOwnerId(owner);
        img.setContentType(type);
        img.setSizeBytes(bytes.length);
        img.setData(bytes);
        images.save(img);

        String url = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/uploads/{id}").buildAndExpand(img.getId()).toUriString();
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", img.getId(), "url", url));
    }

    /** Public: images are referenced from listings everyone can see. */
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable String id) {
        UploadedImage img = images.findById(id).orElseThrow(() -> ApiException.notFound("Image"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(img.getData());
    }

    /** Trust the bytes, not the declared content type. */
    private static String sniff(byte[] b) {
        if (b.length < 12) return null;
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8) return "image/jpeg";
        if ((b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }

    private static String sha1(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-1").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
