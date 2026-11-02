package com.example.studystreak.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RefreshTokenHasherTest {
    @Test
    void hashesTokenIdentifiersWithoutRetainingThePlainValue() {
        RefreshTokenHasher hasher = new RefreshTokenHasher();
        String first = hasher.hash("example-random-jti");
        assertEquals(64, first.length());
        assertEquals(first, hasher.hash("example-random-jti"));
        assertNotEquals(first, hasher.hash("different-jti"));
        assertNotEquals("example-random-jti", first);
    }
}
