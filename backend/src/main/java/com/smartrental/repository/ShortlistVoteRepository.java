package com.smartrental.repository;

import com.smartrental.entity.ShortlistVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShortlistVoteRepository extends JpaRepository<ShortlistVote, String> {
    List<ShortlistVote> findByShortlistIdOrderByCreatedAtAsc(String shortlistId);

    Optional<ShortlistVote> findByShortlistIdAndPropertyIdAndVoterKey(String shortlistId, String propertyId, String voterKey);

    long countByShortlistIdAndVoterKey(String shortlistId, String voterKey);

    void deleteByShortlistId(String shortlistId);
}
