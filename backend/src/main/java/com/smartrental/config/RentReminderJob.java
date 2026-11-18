package com.smartrental.config;

import com.smartrental.service.TenancyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sends "rent due" (3 days before) and "rent overdue" reminders and keeps lease payment status current.
 * Runs every morning in Kigali time, and once at startup because free hosting may sleep through 08:00.
 * Each reminder is de-duplicated per lease per month, so running it more often is safe.
 */
@Component
public class RentReminderJob {

    private static final Logger log = LoggerFactory.getLogger(RentReminderJob.class);
    private final TenancyService tenancy;

    public RentReminderJob(TenancyService tenancy) {
        this.tenancy = tenancy;
    }

    @Scheduled(cron = "0 0 8 * * *", zone = "Africa/Kigali")
    public void daily() {
        run();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        run();
    }

    private void run() {
        try {
            int sent = tenancy.runRentReminders(TenancyService.today());
            if (sent > 0) log.info("Rent reminders sent: {}", sent);
        } catch (Exception e) {
            log.warn("Rent reminder run failed: {}", e.getMessage());
        }
    }
}
