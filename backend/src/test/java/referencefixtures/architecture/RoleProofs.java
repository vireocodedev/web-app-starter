package referencefixtures.architecture;

import com.vireocode.backend.crud.BaseEntity;
import com.vireocode.backend.crud.SoftDeletableEntity;
import com.vireocode.backend.http.PageResponse;
import jakarta.persistence.Entity;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

public final class RoleProofs {
    private RoleProofs() { }

    @Entity public static class GoodEntity extends BaseEntity {
        protected GoodEntity() { }
    }
    public interface GoodRepository extends JpaRepository<GoodEntity, UUID> { }
    public record GoodRequest(String name) { }
    public record GoodResponse(UUID id) { }
    @Service public static class GoodService {
        private final GoodRepository repository;
        public GoodService(GoodRepository repository) { this.repository = repository; }
        @Transactional(readOnly = true)
        public PageResponse<GoodResponse> list() {
            return new PageResponse<>(repository.findAll().stream().map(entity -> new GoodResponse(entity.getId())).toList(), 0, 20, 0);
        }
    }
    @RestController public static class GoodController {
        private final GoodService service;
        public GoodController(GoodService service) { this.service = service; }
        public PageResponse<GoodResponse> list() { return service.list(); }
    }
    @RestController public static class BadController {
        public List<GoodEntity> leak(GoodRepository repository) { return repository.findAll(); }
    }
    @Service public static class BadService {
        public ResponseEntity<String> transport(HttpServletResponse response) { return ResponseEntity.ok("bad"); }
    }
    public record BadResponse(List<GoodEntity> entities) { }
    public static class MutableRequest { public String name; }
    @Entity public static class NoBaseEntity { protected NoBaseEntity() { } }
    @Entity public static class MissingRestriction extends SoftDeletableEntity { protected MissingRestriction() { } }
    @Entity
    @org.hibernate.annotations.SQLRestriction("deleted_at is null")
    public static class GoodSoftEntity extends SoftDeletableEntity { protected GoodSoftEntity() { } }
    @Entity
    @org.hibernate.annotations.SoftDelete
    @org.hibernate.annotations.SQLRestriction("deleted_at is null")
    public static class ConflictingSoftEntity extends SoftDeletableEntity { protected ConflictingSoftEntity() { } }
    @Entity public static class WrongConstructorEntity extends BaseEntity {
        public WrongConstructorEntity(String value) { }
    }
    @Entity public static class BadEntity extends BaseEntity {
        protected BadEntity() { }
        public void business(BadService service) { service.transport(null); }
    }
    @Service public static final class FinalService {
        @Transactional public void write() { }
    }
    @Service public static class FieldInjectedService {
        @org.springframework.beans.factory.annotation.Autowired
        private GoodRepository repository;
    }
}
