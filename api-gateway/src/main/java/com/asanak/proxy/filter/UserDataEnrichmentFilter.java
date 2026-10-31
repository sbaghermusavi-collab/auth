package com.asanak.proxy.filter;

import com.asanak.proxy.entity.User;
import com.asanak.proxy.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.brotli.dec.BrotliInputStream;
import org.reactivestreams.Publisher;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import java.util.zip.GZIPInputStream;

@Component
@Slf4j
@RequiredArgsConstructor
public class UserDataEnrichmentFilter implements GlobalFilter, Ordered {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (path.contains("/api/v1/schedule/search")) {
            return chain.filter(exchange.mutate().response(new ServerHttpResponseDecorator(exchange.getResponse()) {
                @Override
                public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                    ServerHttpResponse originalResponse = getDelegate();
                    DataBufferFactory bufferFactory = originalResponse.bufferFactory();
                    String contentEncoding = originalResponse.getHeaders().getFirst(HttpHeaders.CONTENT_ENCODING);

                    return DataBufferUtils.join(body)
                            .flatMap(dataBuffer -> {
                                byte[] originalBytes = new byte[dataBuffer.readableByteCount()];
                                dataBuffer.read(originalBytes);
                                DataBufferUtils.release(dataBuffer);

                                try {
                                    byte[] decompressedBytes = decompressBody(originalBytes, contentEncoding);
                                    String originalBody = new String(decompressedBytes, StandardCharsets.UTF_8);
                                    String enrichedBody = enrichWithUserData(originalBody);
                                    byte[] finalBytes = enrichedBody.getBytes(StandardCharsets.UTF_8);

                                    originalResponse.getHeaders().remove(HttpHeaders.CONTENT_ENCODING);
                                    originalResponse.getHeaders().setContentLength(finalBytes.length);
                                    return Mono.just(bufferFactory.wrap(finalBytes));
                                } catch (IOException e) {
                                    log.error("Failed to process response body for enrichment", e);
                                    return Mono.error(e);
                                }
                            }).transform(mono -> super.writeWith(mono));
                }
            }).build());
        }

        return chain.filter(exchange);
    }

    private byte[] decompressBody(byte[] compressedBytes, String contentEncoding) throws IOException {
        if (contentEncoding == null) {
            return compressedBytes;
        }
        log.debug("Decompressing response body with encoding: {}", contentEncoding);
        if ("gzip".equalsIgnoreCase(contentEncoding)) {
            return decompressGzip(compressedBytes);
        }
        if ("br".equalsIgnoreCase(contentEncoding)) {
            return decompressBrotli(compressedBytes);
        }
        return compressedBytes;
    }

    private byte[] decompressGzip(byte[] compressed) throws IOException {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(compressed);
             GZIPInputStream gis = new GZIPInputStream(bis);
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gis.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            return bos.toByteArray();
        }
    }

    private byte[] decompressBrotli(byte[] compressed) throws IOException {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(compressed);
             BrotliInputStream bris = new BrotliInputStream(bis);
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = bris.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            return bos.toByteArray();
        }
    }

    private String enrichWithUserData(String responseBody) {
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            if (rootNode.has("data") && rootNode.get("data").has("data")) {
                JsonNode dataArray = rootNode.get("data").get("data");
                if (dataArray.isArray() && !dataArray.isEmpty()) {
                    ArrayNode arrayNode = (ArrayNode) dataArray;

                    Set<Integer> userIds = StreamSupport.stream(arrayNode.spliterator(), false)
                            .map(item -> item.get("user"))
                            .filter(userIdNode -> userIdNode != null && userIdNode.isInt())
                            .map(JsonNode::asInt)
                            .collect(Collectors.toSet());

                    if (userIds.isEmpty()) {
                        return responseBody; // No users to enrich
                    }

                    List<User> users = userRepository.findAllById(userIds);
                    Map<Integer, User> userMap = users.stream()
                            .collect(Collectors.toMap(User::getId, Function.identity()));

                    for (JsonNode item : arrayNode) {
                        JsonNode userIdNode = item.get("user");
                        if (userIdNode != null && userIdNode.isInt()) {
                            int userId = userIdNode.asInt();
                            User user = userMap.get(userId);
                            if (user != null) {
                                ((ObjectNode) item).set("user_data", objectMapper.valueToTree(user));
                                log.debug("Added user data for user ID: {}", userId);
                            }
                        }
                    }
                    return objectMapper.writeValueAsString(rootNode);
                }
            }
        } catch (Exception e) {
            log.error("Error enriching response with user data", e);
        }
        return responseBody;
    }

    @Override
    public int getOrder() {
        return -1; // Ensure this filter runs before others that might also read the body.
    }
}
