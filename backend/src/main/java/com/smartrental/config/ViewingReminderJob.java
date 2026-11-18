package com.smartrental.config;

import com.smartrental.service.ViewingCalendarService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;

/** Every 15 minutes: day-before and two-hours-before reminders for confirmed viewings. */
@Component
public class ViewingReminderJob {

    private static final Logger log = LoggerFactory.getLogger(ViewingReminderJob.class);
    private final ViewingCalendarService calendar;

    public ViewingReminderJob(ViewingCalendarService calendar) {
        this.calendar = calendar;
    }

    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 60 * 1000)
    public void run() {
        try {
            int sent = calendar.sendReminders(ZonedDateTime.now(ViewingCalendarService.KIGALI));
            if (sent > 0) log.info("Viewing reminders sent: {}", sent);
        } catch (Exception e) {
            log.warn("Viewing reminder run failed: {}", e.getMessage());
        }
    }
}
