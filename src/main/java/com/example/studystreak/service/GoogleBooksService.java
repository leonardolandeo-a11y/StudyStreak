package com.example.studystreak.service;

import com.example.studystreak.dto.Books.StudyBookDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GoogleBooksService {
    private static final String ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
    private static final long CACHE_MILLIS = Duration.ofMinutes(10).toMillis();
    private static final int MAX_CACHE_ENTRIES = 100;
    private final ObjectMapper mapper;
    private final String apiKey;
    private final HttpClient client;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public GoogleBooksService(ObjectMapper mapper,
                              @Value("${GOOGLE_BOOKS_API_KEY:}") String apiKey) {
        this.mapper = mapper;
        this.apiKey = apiKey.trim();
        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public List<StudyBookDTO> search(String topic) {
        if (topic == null || topic.trim().length() < 2 || topic.trim().length() > 80) {
            throw new IllegalArgumentException("Search topic must have between 2 and 80 characters.");
        }
        if (apiKey.isBlank()) {
            throw new BookSearchException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Google Books is not configured on the server.");
        }

        String trimmed = topic.trim();
        String cacheKey = trimmed.toLowerCase(Locale.ROOT);
        CacheEntry cached = cache.get(cacheKey);
        long now = System.currentTimeMillis();
        if (cached != null && cached.expiresAt() > now) {
            return cached.books();
        }

        String url = ENDPOINT + "?q=" + URLEncoder.encode(trimmed, StandardCharsets.UTF_8)
                + "&maxResults=10&printType=books&key="
                + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(12))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response;
        try {
            response = client.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BookSearchException(HttpStatus.BAD_GATEWAY,
                    "Google Books request was interrupted.");
        } catch (IOException exception) {
            throw new BookSearchException(HttpStatus.BAD_GATEWAY,
                    "Google Books is temporarily unreachable.");
        }

        if (response.statusCode() == 429) {
            throw new BookSearchException(HttpStatus.TOO_MANY_REQUESTS,
                    "Google Books quota reached. Please try again later.");
        }
        if (response.statusCode() != 200) {
            throw new BookSearchException(HttpStatus.BAD_GATEWAY,
                    "Google Books could not complete the search.");
        }

        List<StudyBookDTO> books = parseBooks(response.body());
        if (cache.size() >= MAX_CACHE_ENTRIES) {
            cache.clear();
        }
        cache.put(cacheKey, new CacheEntry(books, now + CACHE_MILLIS));
        return books;
    }

    List<StudyBookDTO> parseBooks(String json) {
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode items = root.path("items");
            if (!items.isArray()) return List.of();

            List<StudyBookDTO> books = new ArrayList<>();
            for (JsonNode item : items) {
                JsonNode volume = item.path("volumeInfo");
                String id = text(item, "id");
                String title = text(volume, "title");
                if (id == null || title == null) continue;

                List<String> authors = new ArrayList<>();
                JsonNode authorNodes = volume.path("authors");
                if (authorNodes.isArray()) {
                    for (JsonNode author : authorNodes) {
                        if (author.isTextual() && !author.asText().isBlank()) {
                            authors.add(author.asText());
                        }
                    }
                }
                String description = text(volume, "description");
                if (description != null) {
                    description = description.replaceAll("<[^>]*>", " ")
                            .replaceAll("\\s+", " ").trim();
                }
                String bookLink = "https://books.google.com/books?id="
                        + URLEncoder.encode(id, StandardCharsets.UTF_8);
                JsonNode images = volume.path("imageLinks");
                String thumbnail = googleLink(text(images, "thumbnail"));
                if (thumbnail == null) {
                    thumbnail = googleLink(text(images, "smallThumbnail"));
                }
                String preview = googleLink(text(volume, "previewLink"));
                JsonNode countNode = volume.path("pageCount");
                Integer pageCount = countNode.isIntegralNumber() && countNode.asInt() > 0
                        ? countNode.asInt() : null;
                List<String> categories = new ArrayList<>();
                JsonNode categoryNodes = volume.path("categories");
                if (categoryNodes.isArray()) {
                    for (JsonNode category : categoryNodes) {
                        if (category.isTextual() && !category.asText().isBlank()) {
                            categories.add(category.asText());
                        }
                    }
                }
                books.add(new StudyBookDTO(id, title, List.copyOf(authors),
                        text(volume, "publishedDate"), description, bookLink,
                        thumbnail, preview, text(volume, "publisher"), pageCount,
                        List.copyOf(categories)));
            }
            return List.copyOf(books);
        } catch (Exception exception) {
            throw new BookSearchException(HttpStatus.BAD_GATEWAY,
                    "Google Books returned an invalid response.");
        }
    }


    private static final Set<String> GOOGLE_BOOK_HOSTS = Set.of(
            "books.google.com", "books.googleusercontent.com", "play.google.com"
    );

    private String googleLink(String candidate) {
        if (candidate == null) return null;
        try {
            URI uri = URI.create(candidate);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null || uri.getUserInfo() != null || uri.getPort() != -1) {
                return null;
            }
            if (!(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                return null;
            }
            if (!GOOGLE_BOOK_HOSTS.contains(host.toLowerCase(Locale.ROOT))) return null;
            return uri.toASCIIString().replaceFirst("(?i)^http:", "https:");
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (!value.isTextual()) return null;
        String text = value.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private record CacheEntry(List<StudyBookDTO> books, long expiresAt) {}

    public static final class BookSearchException extends RuntimeException {
        private final HttpStatus status;

        public BookSearchException(HttpStatus status, String message) {
            super(message);
            this.status = status;
        }

        public HttpStatus getStatus() {
            return status;
        }
    }
}
