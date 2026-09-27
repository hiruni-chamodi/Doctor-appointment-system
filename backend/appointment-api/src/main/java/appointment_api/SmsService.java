package appointment_api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class SmsService {

    private static final String NOTIFY_SEND_URL = "https://app.notify.lk/api/v1/send";

    private final String userId;
    private final String apiKey;
    private final String senderId;
    private final RestTemplate restTemplate;

    public SmsService(
            @Value("${notify.user-id}") String userId,
            @Value("${notify.api-key}") String apiKey,
            @Value("${notify.sender-id}") String senderId
    ) {
        this.userId = userId;
        this.apiKey = apiKey;
        this.senderId = senderId;
        this.restTemplate = new RestTemplate();
    }

    public void send(String recipientNumber, String messageBody) {
        if (userId.isBlank() || apiKey.isBlank() || senderId.isBlank()) {
            throw new IllegalStateException("Notify.lk is not configured. Set NOTIFY_USER_ID, NOTIFY_API_KEY and NOTIFY_SENDER_ID.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String formattedNumber = recipientNumber;
        if (formattedNumber.startsWith("0")) {
            formattedNumber = "94" + formattedNumber.substring(1);
        } else if (formattedNumber.startsWith("+")) {
            formattedNumber = formattedNumber.substring(1);
        }

        Map<String, String> requestBody = Map.of(
                "user_id", userId,
                "api_key", apiKey,
                "sender_id", senderId,
                "to", formattedNumber,
                "message", messageBody
        );

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(NOTIFY_SEND_URL, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalStateException("Notify.lk rejected the SMS request with status " + response.getStatusCode());
            }
        } catch (RestClientException exception) {
            throw new IllegalStateException("Notify.lk could not deliver the SMS.", exception);
        }
    }
}