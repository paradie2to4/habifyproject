package com.smartrental.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Sends transactional email through Resend (https://resend.com) when RESEND_API_KEY is set.
 * Without a key, emails are written to the log so every flow still works in development.
 * Sending is asynchronous and never fails the request that triggered it.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String apiKey;
    private final String from;
    private final String appBaseUrl;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public EmailService(
            @Value("${app.email.resend-api-key:}") String apiKey,
            @Value("${app.email.from:Habify <onboarding@resend.dev>}") String from,
            @Value("${app.base-url:http://localhost:3000}") String appBaseUrl,
            ObjectMapper json
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = from;
        this.appBaseUrl = appBaseUrl.replaceAll("/+$", "");
        this.json = json;
        if (this.apiKey.isEmpty()) {
            log.warn("RESEND_API_KEY is not set — emails will be logged instead of sent.");
        }
    }

    public String appUrl(String path) {
        return appBaseUrl + (path.startsWith("/") ? path : "/" + path);
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    /**
     * Branded email with a heading, paragraphs and an optional button.
     * @param link in-app path ("/messages") or absolute URL
     */
    public void send(String to, String subject, String heading, List<String> paragraphs, String buttonLabel, String link) {
        if (to == null || to.isBlank()) return;
        String url = link == null ? null : (link.startsWith("http") ? link : appUrl(link));
        String html = render(heading, paragraphs, buttonLabel, url);
        String text = heading + "\n\n" + String.join("\n\n", paragraphs) + (url != null ? "\n\n" + url : "");

        if (!isConfigured()) {
            log.info("[email:dev] to={} subject=\"{}\"\n{}", to, subject, text);
            return;
        }
        CompletableFuture.runAsync(() -> {
            try {
                String body = json.writeValueAsString(Map.of(
                        "from", from,
                        "to", List.of(to),
                        "subject", subject,
                        "html", html,
                        "text", text
                ));
                HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                        .timeout(Duration.ofSeconds(15))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();
                HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() >= 300) {
                    log.warn("Email to {} failed: HTTP {} {}", to, res.statusCode(), res.body());
                }
            } catch (Exception e) {
                log.warn("Email to {} failed: {}", to, e.getMessage());
            }
        });
    }

    private String render(String heading, List<String> paragraphs, String buttonLabel, String url) {
        StringBuilder p = new StringBuilder();
        for (String para : paragraphs) {
            p.append("<p style=\"margin:0 0 14px;font-size:15px;line-height:1.6;color:#3A443F\">")
                    .append(HtmlUtils.htmlEscape(para)).append("</p>");
        }
        String button = (buttonLabel != null && url != null)
                ? "<p style=\"margin:24px 0 8px\"><a href=\"" + HtmlUtils.htmlEscape(url) + "\" style=\"display:inline-block;background:#1F5C45;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px\">"
                + HtmlUtils.htmlEscape(buttonLabel) + "</a></p>"
                : "";
        return "<!doctype html><html><body style=\"margin:0;background:#F1F3EE;font-family:Figtree,Segoe UI,Arial,sans-serif\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:32px 16px\">"
                + "<table role=\"presentation\" width=\"100%\" style=\"max-width:520px;background:#ffffff;border-radius:20px;border:1px solid #DDE2DA\">"
                + "<tr><td style=\"background:#1F5C45;border-radius:20px 20px 0 0;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px\">habify<span style=\"color:#E5AA3C\">.</span></td></tr>"
                + "<tr><td style=\"padding:28px\"><h1 style=\"margin:0 0 16px;font-size:22px;color:#16201B\">" + HtmlUtils.htmlEscape(heading) + "</h1>"
                + p + button
                + "</td></tr></table>"
                + "<p style=\"font-size:12px;color:#6A746C;margin:16px 0 0\">Habify · Kigali, Rwanda</p>"
                + "</td></tr></table></body></html>";
    }
}
