package referencefixtures.contacts;

import com.vireocode.backend.crud.SoftDeletableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "template_reference_contact")
@SQLRestriction("deleted_at is null")
public class Contact extends SoftDeletableEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ContactGroup group;
    @Column(nullable = false, length = 40)
    private String code;
    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;
    @Column(length = 500)
    private String note;

    protected Contact() {
    }

    public Contact(ContactGroup group, String code, String displayName, String note) {
        this.group = group;
        replace(code, displayName, note);
    }

    public ContactGroup getGroup() {
        return group;
    }

    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getNote() {
        return note;
    }

    public void replace(String code, String displayName, String note) {
        this.code = code;
        this.displayName = displayName;
        this.note = note;
    }
}
