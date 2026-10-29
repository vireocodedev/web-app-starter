package referencefixtures.contacts;

import com.vireocode.backend.crud.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "template_reference_contact_group")
public class ContactGroup extends BaseEntity {
    @Column(name = "actor_key", nullable = false, length = 100)
    private String actorKey;
    @Column(nullable = false, length = 100)
    private String name;

    protected ContactGroup() {
    }

    public ContactGroup(String actorKey, String name) {
        this.actorKey = actorKey;
        this.name = name;
    }

    public String getActorKey() {
        return actorKey;
    }

    public String getName() {
        return name;
    }

    public void replace(String name) {
        this.name = name;
    }
}
