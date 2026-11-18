package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One weekly window when a landlord can show homes, e.g. Saturday 09:00–12:00 in 60-minute slots. */
@Entity
@Table(name = "viewing_availability", indexes = @Index(name = "idx_avail_landlord", columnList = "landlord_id"))
@Getter
@Setter
@NoArgsConstructor
public class ViewingAvailability {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "landlord_id", nullable = false, length = 50)
    private String landlordId;

    /** 1 = Monday … 7 = Sunday (ISO) */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    /** "HH:mm", Kigali time */
    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime;

    @Column(name = "slot_minutes", nullable = false)
    private Integer slotMinutes = 60;
}
