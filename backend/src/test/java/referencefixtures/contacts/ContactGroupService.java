package referencefixtures.contacts;

import java.time.Clock;
import java.util.Set;
import java.util.UUID;
import com.vireocode.backend.crud.BaseService;
import com.vireocode.backend.crud.DeleteMode;
import com.vireocode.backend.crud.ResourceInUseException;
import com.vireocode.backend.http.PageResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactGroupService extends BaseService<ContactGroup> {
    private final ContactGroupRepository groups;
    private final ContactRepository contacts;
    private final EntityManager entities;
    public ContactGroupService(ContactGroupRepository groups, ContactRepository contacts, EntityManager entities, Clock clock) {
        super(ContactGroup.class, groups, DeleteMode.HARD, clock);
        this.groups = groups;
        this.contacts = contacts;
        this.entities = entities;
    }

    @Transactional
    public ContactGroupResponse create(String actor, ContactGroupRequest request) {
        var group = groups.save(new ContactGroup(ReferenceInput.actor(actor), request.name()));
        entities.flush();
        return response(group);
    }

    @Transactional(readOnly = true)
    public ContactGroupResponse read(String actor, UUID id) {
        return response(requireActive(() -> groups.findByIdAndActorKey(id, ReferenceInput.actor(actor))));
    }

    @Transactional(readOnly = true)
    public PageResponse<ContactGroupResponse> list(String actor, int page, int size, String sort, String direction) {
        var paging = ReferenceInput.page(page, size, sort, direction, Set.of("name", "createdAt"));
        var result = groups.findByActorKey(ReferenceInput.actor(actor), paging);
        return new PageResponse<>(result.getContent().stream().map(ContactGroupService::response).toList(), page, size, result.getTotalElements());
    }

    @Transactional
    public ContactGroupResponse update(String actor, UUID id, long expectedVersion, ContactGroupRequest request) {
        var group = requireActive(() -> groups.lockOwned(id, ReferenceInput.actor(actor)));
        requireExpectedVersion(group, expectedVersion);
        entities.lock(group, LockModeType.OPTIMISTIC);
        group.replace(request.name());
        entities.flush();
        return response(group);
    }

    @Transactional
    public void delete(String actor, UUID id, long expectedVersion) {
        var group = requireActive(() -> groups.lockOwned(id, ReferenceInput.actor(actor)));
        requireExpectedVersion(group, expectedVersion);
        if (contacts.retainedCount(id) != 0) throw new ResourceInUseException();
        deleteManaged(group, expectedVersion);
        entities.flush();
    }

    private static ContactGroupResponse response(ContactGroup g) {
        return new ContactGroupResponse(g.getId(), g.getName(), g.getCreatedAt(), g.getUpdatedAt(), g.getVersion());
    }
}
