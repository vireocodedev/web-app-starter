package referencefixtures.contacts;

import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface ContactGroupRepository extends JpaRepository<ContactGroup, UUID> {
    Optional<ContactGroup> findByIdAndActorKey(UUID id, String actorKey);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from ContactGroup g where g.id = :id and g.actorKey = :actorKey")
    Optional<ContactGroup> lockOwned(UUID id, String actorKey);
    Page<ContactGroup> findByActorKey(String actorKey, Pageable pageable);
}
