package com.example.studystreak.service;

import com.example.studystreak.dto.Profile.ProfileUpdateRequest;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ProfileTextTest {
    @Test void trimsOnlyExteriorUnicodeSpacesAndPreservesNames() {
        assertEquals("María  李 👩‍💻", ProfileText.displayName("\u00a0  María  李 👩‍💻\u2003"));
        assertNull(ProfileText.displayName(" \u00a0\t"));
    }
    @Test void countsCodePointsRatherThanUtf16Units() {
        assertEquals("😀".repeat(60), ProfileText.displayName("😀".repeat(60)));
        assertThrows(IllegalArgumentException.class, () -> ProfileText.displayName("😀".repeat(61)));
        assertEquals("😀".repeat(300), ProfileText.bio("😀".repeat(300)));
        assertThrows(IllegalArgumentException.class, () -> ProfileText.bio("😀".repeat(301)));
    }
    @Test void rejectsMalformedUnicodeAndUnsafeControls() {
        for (String name : List.of("x\u0000", "a\nb", "x\ud800", "\udc00", "a\u2028b")) {
            assertThrows(IllegalArgumentException.class, () -> ProfileText.displayName(name));
        }
        assertThrows(IllegalArgumentException.class, () -> ProfileText.bio("x\u0000"));
    }
    @Test void biographyIsVerbatimTextIncludingMarkupAndLineBreaks() {
        String bio = " <script>alert('text only')</script>\n\tStudy & learn ";
        assertEquals(bio, ProfileText.bio(bio));
        assertNull(ProfileText.bio(null)); assertNull(ProfileText.bio(""));
    }
    @Test void patchDistinguishesMissingNullAndWrongTypes() {
        var empty = new ProfileUpdateRequest(Map.of());
        assertFalse(empty.hasBio()); assertFalse(empty.hasDisplayName());
        var values = new HashMap<String,Object>(); values.put("bio",null);
        var clear = new ProfileUpdateRequest(values); assertTrue(clear.hasBio()); assertNull(clear.bio());
        assertThrows(IllegalArgumentException.class, () -> new ProfileUpdateRequest(Map.of("username","new")));
        assertThrows(IllegalArgumentException.class, () -> new ProfileUpdateRequest(Map.of("bio",7)));
        assertThrows(IllegalArgumentException.class, () -> new ProfileUpdateRequest(Map.of("userId",1)));
    }
}
