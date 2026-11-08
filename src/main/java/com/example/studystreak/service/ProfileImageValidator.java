package com.example.studystreak.service;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.zip.CRC32;

/** Decode actual image pixels, after checking bounded dimensions and container integrity. */
@Component
public class ProfileImageValidator {
    private static final Map<String, String> TYPES = Map.of("png", "image/png", "jpeg", "image/jpeg", "webp", "image/webp");
    private final Semaphore decoders = new Semaphore(2);

    public String validate(byte[] bytes, String declaredType) {
        String declared;
        try {
            MediaType parsed = MediaType.parseMediaType(declaredType == null ? "" : declaredType);
            declared = parsed.getType().toLowerCase(Locale.ROOT) + "/" + parsed.getSubtype().toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException e) { throw unsupported(); }
        if (!TYPES.containsValue(declared)) throw unsupported();
        acquireDecoder();
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid();
            var reader = readers.next();
            try {
                String type = TYPES.get(reader.getFormatName().toLowerCase(Locale.ROOT));
                if (type == null || !type.equals(declared) || !intact(bytes, type)) throw invalid();
                boolean[] warning = {false};
                reader.addIIOReadWarningListener((source, message) -> warning[0] = true);
                reader.setInput(input, true, true);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > 8192 || height > 8192 || (long) width * height > 16_000_000) throw invalid();
                var image = reader.read(0);
                if (image == null || warning[0]) throw invalid();
                image.flush();
                return type;
            } finally { reader.dispose(); }
        } catch (ResponseStatusException e) { throw e; }
        catch (IOException | RuntimeException e) { throw invalid(); }
        finally { decoders.release(); }
    }

    private void acquireDecoder() {
        try {
            // Own and partner avatar/banner reads arrive together. Keep decoding
            // bounded to two images, but allow that normal burst to queue briefly.
            if (!decoders.tryAcquire(2, TimeUnit.SECONDS))
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image decoder busy; retry later");
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image decoder busy; retry later");
        }
    }

    private boolean intact(byte[] data, String type) {
        if (type.equals("image/jpeg")) return data.length >= 4 && (data[0] & 255) == 255 && (data[1] & 255) == 216
                && (data[data.length - 2] & 255) == 255 && (data[data.length - 1] & 255) == 217;
        if (type.equals("image/webp")) {
            if (data.length < 20 || ByteBuffer.wrap(data, 4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt() != data.length - 8) return false;
            int offset = 12;
            while (offset + 8 <= data.length) {
                long size = Integer.toUnsignedLong(ByteBuffer.wrap(data, offset + 4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt());
                long next = offset + 8L + size + (size & 1);
                if (next > data.length) return false;
                offset = (int) next;
            }
            return offset == data.length;
        }
        // ImageIO identifies the PNG signature; verify every chunk including CRC and final IEND.
        int offset = 8;
        while (offset + 12 <= data.length) {
            int size = ByteBuffer.wrap(data, offset, 4).getInt();
            if (size < 0 || size > data.length - offset - 12) return false;
            var crc = new CRC32(); crc.update(data, offset + 4, size + 4);
            long stored = Integer.toUnsignedLong(ByteBuffer.wrap(data, offset + 8 + size, 4).getInt());
            if (crc.getValue() != stored) return false;
            boolean end = data[offset + 4] == 'I' && data[offset + 5] == 'E' && data[offset + 6] == 'N' && data[offset + 7] == 'D';
            offset += size + 12;
            if (end) return size == 0 && offset == data.length;
        }
        return false;
    }
    private ResponseStatusException invalid() { return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid, corrupt, mismatched or oversized image dimensions"); }
    private ResponseStatusException unsupported() { return new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Use image/png, image/jpeg or image/webp"); }
}
