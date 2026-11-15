package com.example.studystreak.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.*;
import java.nio.channels.Channels;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Set;
import static java.nio.file.LinkOption.NOFOLLOW_LINKS;

/** Private owner/slot paths, never a client filename; replacements are atomic. */
@Service
public class ProfileImageStorage {
    public enum Slot {
        AVATAR(2 * 1024 * 1024), BANNER(5 * 1024 * 1024);
        final int limit;
        Slot(int limit) { this.limit = limit; }
    }
    public record Image(byte[] bytes, String contentType) {}
    private final Path root;
    private final ProfileImageValidator validator;

    public ProfileImageStorage(@Value("${profile.images.directory}") String directory, ProfileImageValidator validator) {
        this.root = Path.of(directory).toAbsolutePath().normalize(); this.validator = validator;
    }
    public void put(long owner, Slot slot, InputStream body, String contentType) {
        byte[] bytes;
        try { bytes = body.readNBytes(slot.limit + 1); }
        catch (IOException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read image request"); }
        if (bytes.length > slot.limit) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Profile image exceeds upload limit");
        validator.validate(bytes, contentType);
        Path temporary = null;
        try {
            Path target = path(owner, slot);
            createPrivateDirectory(target.getParent());
            temporary = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
            if (Files.getFileStore(temporary).supportsFileAttributeView("posix"))
                Files.setPosixFilePermissions(temporary, PosixFilePermissions.fromString("rw-------"));
            Files.write(temporary, bytes, StandardOpenOption.TRUNCATE_EXISTING);
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) { throw unavailable(); }
        finally { if (temporary != null) try { Files.deleteIfExists(temporary); } catch (IOException ignored) { /* private failed temp remains inaccessible */ } }
    }
    public Image get(long owner, Slot slot) {
        try {
            Path target = path(owner, slot);
            byte[] bytes;
            try (var channel = Files.newByteChannel(target, Set.of(StandardOpenOption.READ, NOFOLLOW_LINKS));
                 var stream = Channels.newInputStream(channel)) { bytes = stream.readNBytes(slot.limit + 1); }
            if (bytes.length > slot.limit) throw unavailable();
            String type = detect(bytes);
            return new Image(bytes, type);
        } catch (NoSuchFileException e) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile image not set"); }
        catch (IOException e) { throw unavailable(); }
    }
    public void delete(long owner, Slot slot) {
        try { Files.deleteIfExists(path(owner, slot)); }
        catch (IOException e) { throw unavailable(); }
    }
    private String detect(byte[] bytes) {
        String type = bytes.length > 3 && bytes[0] == (byte) 0x89 ? "image/png"
                : bytes.length > 3 && bytes[0] == (byte) 0xff ? "image/jpeg" : "image/webp";
        try { return validator.validate(bytes, type); }
        catch (ResponseStatusException e) { throw unavailable(); }
    }
    private Path path(long owner, Slot slot) throws IOException {
        if (owner <= 0) throw new IllegalArgumentException("Invalid authenticated owner");
        Path target = root.resolve(Long.toString(owner)).resolve(slot.name().toLowerCase(java.util.Locale.ROOT) + ".blob");
        for (Path entry = target; entry != null; entry = entry.getParent()) {
            if (Files.isSymbolicLink(entry)) throw new IOException("Symlink not allowed");
            if (!entry.equals(target) && Files.exists(entry, NOFOLLOW_LINKS) && !Files.isDirectory(entry, NOFOLLOW_LINKS)) throw new IOException("Invalid storage directory");
        }
        return target;
    }
    private void createPrivateDirectory(Path directory) throws IOException {
        if (Files.exists(directory, NOFOLLOW_LINKS)) return;
        if (directory.getParent() != null) createPrivateDirectory(directory.getParent());
        try {
            if (Files.getFileStore(directory.getParent()).supportsFileAttributeView("posix"))
                Files.createDirectory(directory, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
            else Files.createDirectory(directory);
        } catch (FileAlreadyExistsException e) {
            if (Files.isSymbolicLink(directory) || !Files.isDirectory(directory, NOFOLLOW_LINKS)) throw e;
        }
    }
    private ResponseStatusException unavailable() { return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Private profile image storage unavailable"); }
}
