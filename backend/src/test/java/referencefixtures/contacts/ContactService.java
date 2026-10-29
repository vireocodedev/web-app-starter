package referencefixtures.contacts;

import java.time.Clock;
import java.util.Set;
import java.util.UUID;
import com.vireocode.backend.crud.BaseService;
import com.vireocode.backend.crud.DeleteMode;
import com.vireocode.backend.crud.ResourceNotFoundException;
import com.vireocode.backend.http.PageResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService extends BaseService<Contact> {
    private final ContactRepository contacts;
    private final ContactGroupRepository groups;
    private final EntityManager entities;
    public ContactService(ContactRepository contacts, ContactGroupRepository groups, EntityManager entities, Clock clock) {
        super(Contact.class, contacts, DeleteMode.SOFT, clock);
        this.contacts = contacts;
        this.groups = groups;
        this.entities = entities;
    }

    @Transactional
    public ContactResponse create(String actor, UUID groupId, ContactRequest request) {
        var group = groups.lockOwned(groupId, ReferenceInput.actor(actor)).orElseThrow(ResourceNotFoundException::new);
        var contact = contacts.save(new Contact(group, request.code(), request.displayName(), request.note()));
        entities.flush();
        return response(contact);
    }

    @Transactional(readOnly = true)
    public ContactResponse read(String actor, UUID groupId, UUID id) {
        return response(requireActive(() -> contacts.findByIdAndGroupIdAndGroupActorKey(id, groupId, ReferenceInput.actor(actor))));
    }

    @Transactional(readOnly = true)
    public PageResponse<ContactResponse> list(String actor, UUID groupId, int page, int size, String sort, String direction, String search) {
        var paging = ReferenceInput.page(page, size, sort, direction, Set.of("displayName", "code", "createdAt"));
        var query = ReferenceInput.search(search);
        groups.findByIdAndActorKey(groupId, ReferenceInput.actor(actor)).orElseThrow(ResourceNotFoundException::new);
        var result = contacts.browse(groupId, actor, query, paging);
        return new PageResponse<>(result.getContent().stream().map(ContactService::response).toList(), page, size, result.getTotalElements());
    }

    @Transactional
    public ContactResponse update(String actor, UUID groupId, UUID id, long expectedVersion, ContactRequest request) {
        groups.lockOwned(groupId, ReferenceInput.actor(actor)).orElseThrow(ResourceNotFoundException::new);
        var contact = requireActive(() -> contacts.findByIdAndGroupIdAndGroupActorKey(id, groupId, actor));
        requireExpectedVersion(contact, expectedVersion);
        // A no-op PUT may emit no UPDATE; OPTIMISTIC still verifies the loaded revision at commit.
        entities.lock(contact, LockModeType.OPTIMISTIC);
        contact.replace(request.code(), request.displayName(), request.note());
        entities.flush();
        return response(contact);
    }

    @Transactional
    public void delete(String actor, UUID groupId, UUID id, long expectedVersion) {
        groups.lockOwned(groupId, ReferenceInput.actor(actor)).orElseThrow(ResourceNotFoundException::new);
        var contact = requireActive(() -> contacts.findByIdAndGroupIdAndGroupActorKey(id, groupId, actor));
        deleteManaged(contact, expectedVersion);
        entities.flush();
    }

    private static ContactResponse response(Contact c) {
        return new ContactResponse(c.getId(), c.getCode(), c.getDisplayName(), c.getNote(), c.getGroup().getId(),
        c.getGroup().getName(), c.getCreatedAt(), c.getUpdatedAt(), c.getVersion());
    }
}
