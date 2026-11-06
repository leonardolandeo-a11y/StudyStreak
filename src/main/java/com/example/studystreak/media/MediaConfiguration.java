package com.example.studystreak.media;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "study.media")
public class MediaConfiguration {
    private boolean enabled;
    private String url = "";
    private String internalUrl = "";
    private String apiKey = "";
    private String apiSecret = "";
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean value) { enabled = value; }
    public String getUrl() { return url; }
    public void setUrl(String value) { url = value; }
    public String getInternalUrl() { return internalUrl; }
    public void setInternalUrl(String value) { internalUrl = value; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String value) { apiKey = value; }
    public String getApiSecret() { return apiSecret; }
    public void setApiSecret(String value) { apiSecret = value; }
    public boolean ready() {
        return enabled && url.matches("wss?://.+") && internalUrl.matches("https?://.+")
                && !apiKey.isBlank() && apiSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length >= 32;
    }
}
