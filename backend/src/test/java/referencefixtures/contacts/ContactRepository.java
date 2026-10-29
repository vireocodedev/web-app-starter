package referencefixtures.contacts;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ContactRepository extends JpaRepository<Contact, UUID> {
    @EntityGraph(attributePaths = "group")
    Optional<Contact> findByIdAndGroupIdAndGroupActorKey(UUID id, UUID groupId, String actorKey);
    List<Contact> findByGroupId(UUID groupId);
    long countByGroupId(UUID groupId);
    @Query(value = "select c from Contact c join fetch c.group g where g.id = :groupId and g.actorKey = :actorKey "
    + "and lower(c.displayName) like lower(concat('%', :search, '%')) escape '\\'",
    countQuery = "select count(c) from Contact c join c.group g where g.id = :groupId and g.actorKey = :actorKey "
    + "and lower(c.displayName) like lower(concat('%', :search, '%')) escape '\\'")
    Page<Contact> browse(UUID groupId, String actorKey, String search, Pageable pageable);
    // Native SQL does not inherit Hibernate's SQLRestriction: scope AND active predicates are deliberate.
    @Query(value = "select c.* from template_reference_contact c join template_reference_contact_group g on g.id=c.group_id "
    + "where g.id=:groupId and g.actor_key=:actorKey and c.deleted_at is null order by c.id", nativeQuery = true)
    List<Contact> activeNative(UUID groupId, String actorKey);
    @Query(value = "select count(*) from template_reference_contact c join template_reference_contact_group g on g.id=c.group_id "
    + "where g.id=:groupId and g.actor_key=:actorKey and c.deleted_at is null", nativeQuery = true)
    long activeNativeCount(UUID groupId, String actorKey);
    // Physical retained rows intentionally participate in the HARD-parent dependency rule.
    @Query(value = "select count(*) from template_reference_contact where group_id=:groupId", nativeQuery = true)
    long retainedCount(UUID groupId);
}
