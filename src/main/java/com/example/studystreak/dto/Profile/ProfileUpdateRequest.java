package com.example.studystreak.dto.Profile;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/** Absent fields are unchanged; explicit null clears the field. */
public final class ProfileUpdateRequest {
    private final Map<String, Object> fields;

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public ProfileUpdateRequest(Map<String, Object> fields) {
        if (fields == null || !Set.of("displayName", "bio").containsAll(fields.keySet())) {
            throw new IllegalArgumentException("Only displayName and bio can be updated");
        }
        for (Object value : fields.values()) {
            if (value != null && !(value instanceof String)) throw new IllegalArgumentException("Profile values must be text or null");
        }
        this.fields = Collections.unmodifiableMap(new LinkedHashMap<>(fields));
    }
    public boolean hasDisplayName() { return fields.containsKey("displayName"); }
    public boolean hasBio() { return fields.containsKey("bio"); }
    public String displayName() { return (String) fields.get("displayName"); }
    public String bio() { return (String) fields.get("bio"); }
}
