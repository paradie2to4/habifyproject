package com.smartrental.service;

import com.smartrental.entity.Inquiry;
import com.smartrental.entity.InquiryMessage;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.InquiryMessageRepository;
import com.smartrental.repository.InquiryRepository;
import com.smartrental.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Back-and-forth messaging on top of an Inquiry, with read receipts and notifications. */
@Service
public class ConversationService {

    public static final int MAX_LENGTH = 4000;

    private final InquiryRepository inquiries;
    private final InquiryMessageRepository messages;
    private final NotificationService notifications;

    public ConversationService(InquiryRepository inquiries, InquiryMessageRepository messages, NotificationService notifications) {
        this.inquiries = inquiries;
        this.messages = messages;
        this.notifications = notifications;
    }

    public Inquiry requireParticipant(String inquiryId, AuthUser user) {
        Inquiry inq = inquiries.findById(inquiryId).orElseThrow(() -> ApiException.notFound("Conversation"));
        boolean participant = user.id().equals(inq.getTenantId()) || user.id().equals(inq.getLandlordId());
        if (!participant && !user.isAdmin()) throw ApiException.forbidden();
        return inq;
    }

    /** Older inquiries stored the opening message (and one reply) on the inquiry itself; turn them into messages once. */
    @Transactional
    public void ensureThread(Inquiry inq) {
        if (messages.existsByInquiryId(inq.getId())) return;
        InquiryMessage first = new InquiryMessage();
        first.setId(NotificationService.newId("msg"));
        first.setInquiryId(inq.getId());
        first.setSenderId(inq.getTenantId());
        first.setSenderName(inq.getTenantName());
        first.setSenderRole("TENANT");
        first.setBody(inq.getMessage());
        first.setCreatedAt(inq.getCreatedAt() != null ? inq.getCreatedAt() : LocalDateTime.now());
        if (!"UNREAD".equals(inq.getStatus())) first.setReadAt(first.getCreatedAt());
        messages.save(first);

        if (inq.getReply() != null && !inq.getReply().isBlank()) {
            InquiryMessage reply = new InquiryMessage();
            reply.setId(NotificationService.newId("msg"));
            reply.setInquiryId(inq.getId());
            reply.setSenderId(inq.getLandlordId());
            reply.setSenderName(inq.getLandlordName());
            reply.setSenderRole("LANDLORD");
            reply.setBody(inq.getReply());
            reply.setCreatedAt(inq.getRepliedAt() != null ? inq.getRepliedAt() : first.getCreatedAt().plusMinutes(1));
            messages.save(reply);
        }
    }

    @Transactional
    public List<InquiryMessage> thread(String inquiryId, AuthUser user) {
        Inquiry inq = requireParticipant(inquiryId, user);
        ensureThread(inq);
        return messages.findByInquiryIdOrderByCreatedAtAsc(inq.getId());
    }

    @Transactional
    public InquiryMessage send(String inquiryId, AuthUser user, String senderName, String body) {
        Inquiry inq = requireParticipant(inquiryId, user);
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) throw ApiException.badRequest("Write a message first");
        if (text.length() > MAX_LENGTH) throw ApiException.badRequest("Messages can be up to " + MAX_LENGTH + " characters");
        ensureThread(inq);

        boolean fromLandlord = user.id().equals(inq.getLandlordId());
        InquiryMessage m = new InquiryMessage();
        m.setId(NotificationService.newId("msg"));
        m.setInquiryId(inq.getId());
        m.setSenderId(user.id());
        m.setSenderName(senderName);
        m.setSenderRole(fromLandlord ? "LANDLORD" : "TENANT");
        m.setBody(text);
        m.setCreatedAt(LocalDateTime.now());
        messages.save(m);

        // Sending implies you've read everything before it
        messages.markReadFor(inq.getId(), user.id(), LocalDateTime.now());

        inq.setLastMessageAt(m.getCreatedAt());
        inq.setLastMessagePreview(text.length() > 190 ? text.substring(0, 187) + "…" : text);
        if (fromLandlord) {
            inq.setStatus("REPLIED");
            inq.setReply(text);
            inq.setRepliedAt(m.getCreatedAt());
        }
        inquiries.save(inq);

        String recipient = fromLandlord ? inq.getTenantId() : inq.getLandlordId();
        notifications.notify(recipient, "NEW_MESSAGE",
                "New message from " + (senderName == null ? "Habify user" : senderName),
                "About “" + inq.getPropertyTitle() + "”: " + (text.length() > 140 ? text.substring(0, 137) + "…" : text),
                "/messages?thread=" + inq.getId(), true);
        return m;
    }

    /** Read receipts: everything the other participant sent is now read. */
    @Transactional
    public int markRead(String inquiryId, AuthUser user) {
        Inquiry inq = requireParticipant(inquiryId, user);
        ensureThread(inq);
        int n = messages.markReadFor(inq.getId(), user.id(), LocalDateTime.now());
        if (user.id().equals(inq.getLandlordId()) && "UNREAD".equals(inq.getStatus())) {
            inq.setStatus("READ");
            inquiries.save(inq);
        }
        return n;
    }

    /** Unread messages for this viewer in one conversation. */
    public long unreadFor(Inquiry inq, String viewerId) {
        if (!messages.existsByInquiryId(inq.getId())) {
            // Thread not materialised yet: the opening message is unread for the landlord until opened
            return viewerId.equals(inq.getLandlordId()) && "UNREAD".equals(inq.getStatus()) ? 1 : 0;
        }
        return messages.countByInquiryIdAndSenderIdNotAndReadAtIsNull(inq.getId(), viewerId);
    }
}
