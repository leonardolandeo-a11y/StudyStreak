package com.example.studystreak.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.server.ResponseStatusException;
import java.io.*;
import java.nio.file.*;
import java.util.Arrays;
import java.util.zip.CRC32;
import java.nio.ByteBuffer;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import static org.junit.jupiter.api.Assertions.*;
import static com.example.studystreak.service.ProfileImageStorage.Slot.*;

class ProfileImageStorageTest {
    @TempDir Path temporary;
    final ProfileImageValidator validator = new ProfileImageValidator();
    ProfileImageStorage storage() { return new ProfileImageStorage(temporary.resolve("private").toString(), validator); }
    byte[] fixture(String extension) throws IOException {
        try (var in = getClass().getResourceAsStream("/profile/image." + extension)) { return in.readAllBytes(); }
    }
    void put(ProfileImageStorage store, long owner, ProfileImageStorage.Slot slot, byte[] bytes, String type) {
        store.put(owner, slot, new ByteArrayInputStream(bytes), type);
    }
    void status(int expected, org.junit.jupiter.api.function.Executable action) {
        assertEquals(expected, assertThrows(ResponseStatusException.class, action).getStatusCode().value());
    }
    @Test void decodesOnlyRealPngJpegAndWebp() throws Exception {
        for (var entry : java.util.Map.of("png","image/png","jpg","image/jpeg","webp","image/webp").entrySet()) {
            byte[] bytes = fixture(entry.getKey());
            assertEquals(entry.getValue(),validator.validate(bytes,entry.getValue()));
            status(400, () -> validator.validate(Arrays.copyOf(bytes,bytes.length-8),entry.getValue()));
        }
        status(415, () -> validator.validate(fixture("png"),"image/svg+xml"));
        status(415, () -> validator.validate(fixture("png"),"text/html"));
        status(415, () -> validator.validate(fixture("png"),null));
        status(400, () -> validator.validate(fixture("png"),"image/jpeg"));
        status(400, () -> validator.validate("<svg/>".getBytes(),"image/png"));
        status(400, () -> validator.validate(new byte[0],"image/png"));
        byte[] damaged = fixture("png");damaged[45] ^= 1;
        status(400, () -> validator.validate(damaged,"image/png"));
        byte[] trailing = Arrays.copyOf(fixture("png"),fixture("png").length+1);
        status(400, () -> validator.validate(trailing,"image/png"));
    }
    @Test void rejectsDecompressionDimensionsBeforeDecodingPixels() throws Exception {
        byte[] oversized = fixture("png");
        ByteBuffer.wrap(oversized,16,4).putInt(20_000);
        var crc = new CRC32(); crc.update(oversized,12,17);
        ByteBuffer.wrap(oversized,29,4).putInt((int)crc.getValue());
        status(400, () -> validator.validate(oversized,"image/png"));
    }
    @Test void privateImagesSurviveNewServiceInstanceAndReplaceAtomically() throws Exception {
        var store=storage();
        put(store,7,AVATAR,fixture("png"),"image/png");
        put(store,7,BANNER,fixture("webp"),"image/webp");
        assertArrayEquals(fixture("png"),storage().get(7,AVATAR).bytes());
        assertEquals("image/webp",storage().get(7,BANNER).contentType());
        put(store,7,AVATAR,fixture("jpg"),"image/jpeg");
        assertArrayEquals(fixture("jpg"),store.get(7,AVATAR).bytes());
        status(400, () -> put(store,7,AVATAR,new byte[]{1,2},"image/png"));
        assertArrayEquals(fixture("jpg"),store.get(7,AVATAR).bytes());
        status(404, () -> store.get(8,AVATAR));
        assertThrows(IllegalArgumentException.class, () -> store.get(-1,AVATAR));
        try(var files=Files.list(temporary.resolve("private/7"))) { assertEquals(2,files.count()); }
        if(Files.getFileStore(temporary).supportsFileAttributeView("posix")) {
            assertEquals("rw-------",java.nio.file.attribute.PosixFilePermissions.toString(Files.getPosixFilePermissions(temporary.resolve("private/7/avatar.blob"))));
        }
        store.delete(7,AVATAR);store.delete(7,AVATAR);
        status(404, () -> store.get(7,AVATAR));
        assertEquals("image/webp",store.get(7,BANNER).contentType());
    }
    @Test void boundedReadsRejectLargeUploadsAndKeepExistingImage() throws Exception {
        var store=storage();put(store,7,AVATAR,fixture("png"),"image/png");
        status(413, () -> put(store,7,AVATAR,new byte[2*1024*1024+1],"image/png"));
        status(413, () -> put(store,7,BANNER,new byte[5*1024*1024+1],"image/png"));
        assertArrayEquals(fixture("png"),store.get(7,AVATAR).bytes());
    }
    @Test void acceptsExactByteLimitsWithStructurallyValidImages() throws Exception {
        var store=storage();
        for(var slot:java.util.List.of(AVATAR,BANNER)) {
            int limit=slot==AVATAR?2*1024*1024:5*1024*1024;
            byte[] original=fixture("png");
            int payload=limit-original.length-12;
            var buffer=ByteBuffer.allocate(limit);
            buffer.put(original,0,original.length-12); // Insert legal ancillary tEXt before IEND.
            buffer.putInt(payload);int chunkStart=buffer.position();
            buffer.put(new byte[]{'t','E','X','t'}).put(new byte[]{'N','o','t','e',0});
            for(int i=5;i<payload;i++)buffer.put((byte)'x');
            var crc=new CRC32();crc.update(buffer.array(),chunkStart,payload+4);
            buffer.putInt((int)crc.getValue()).put(original,original.length-12,12);
            byte[] bytes=buffer.array();assertEquals(limit,bytes.length);
            put(store,7,slot,bytes,"image/png");
            assertArrayEquals(bytes,store.get(7,slot).bytes());
            status(413, () -> put(store,7,slot,Arrays.copyOf(bytes,bytes.length+1),"image/png"));
        }
    }
    @Test void symlinksCannotReadWriteOrDeleteExternalFiles() throws Exception {
        var outside=temporary.resolve("outside");Files.createDirectories(outside);
        var victim=outside.resolve("avatar.blob");Files.write(victim,fixture("png"));
        var root=temporary.resolve("private");Files.createDirectories(root);Files.createSymbolicLink(root.resolve("7"),outside);
        var store=storage();
        status(503, () -> store.get(7,AVATAR));
        status(503, () -> put(store,7,AVATAR,fixture("jpg"),"image/jpeg"));
        status(503, () -> store.delete(7,AVATAR));
        assertArrayEquals(fixture("png"),Files.readAllBytes(victim));
        Files.createDirectories(root.resolve("8"));Files.createSymbolicLink(root.resolve("8/avatar.blob"),victim);
        status(503, () -> store.get(8,AVATAR));
        status(503, () -> store.delete(8,AVATAR));
    }
    @Test void largeValidBannerDoesNotUseEvidenceMultipartLimit() throws Exception {
        // Real decoded PNG > 3 MiB, below 5 MiB, with no trailing padding.
        var image=new BufferedImage(1100,1100,BufferedImage.TYPE_INT_RGB);
        var random=new java.util.Random(42);
        for(int y=0;y<1100;y++)for(int x=0;x<1100;x++)image.setRGB(x,y,random.nextInt(0x1000000));
        var out=new ByteArrayOutputStream();ImageIO.write(image,"png",out);byte[] bytes=out.toByteArray();
        assertTrue(bytes.length>3*1024*1024 && bytes.length<5*1024*1024);
        var store=storage();put(store,7,BANNER,bytes,"image/png");
        assertArrayEquals(bytes,storage().get(7,BANNER).bytes());
        status(413, () -> put(store,7,AVATAR,bytes,"image/png"));
    }
}
