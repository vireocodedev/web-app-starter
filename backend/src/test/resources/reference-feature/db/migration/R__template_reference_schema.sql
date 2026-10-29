-- Test-only bootstrap, not a consumer production migration or an upgrade-history claim.
CREATE TABLE IF NOT EXISTS template_reference_contact_group (
    id uuid CONSTRAINT template_reference_contact_group_pk PRIMARY KEY,
    actor_key varchar(100) NOT NULL,
    name varchar(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    version bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS template_reference_contact (
    id uuid CONSTRAINT template_reference_contact_pk PRIMARY KEY,
    group_id uuid NOT NULL,
    code varchar(40) NOT NULL,
    display_name varchar(120) NOT NULL,
    note varchar(500),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    version bigint NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT template_reference_contact_group_code_uk UNIQUE (group_id, code),
    CONSTRAINT template_reference_contact_group_fk FOREIGN KEY (group_id)
        REFERENCES template_reference_contact_group (id) ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS template_reference_group_actor_idx ON template_reference_contact_group (actor_key, name, id);
CREATE INDEX IF NOT EXISTS template_reference_contact_active_idx ON template_reference_contact (group_id, display_name, id) WHERE deleted_at IS NULL;

-- Hibernate validates mapped columns/types; it does not prove UNIQUE/FK shape.
-- Fail closed on incompatible pre-existing constraints instead of silently repairing drift.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conrelid = 'template_reference_contact'::regclass
          AND c.conname = 'template_reference_contact_group_code_uk' AND c.contype = 'u'
          AND c.convalidated AND NOT c.condeferrable
          AND EXISTS (SELECT 1 FROM pg_index i WHERE i.indexrelid=c.conindid
              AND i.indisvalid AND i.indisready AND i.indislive)
          AND c.conkey = ARRAY[
            (SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='group_id'),
            (SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='code')
          ]::smallint[]
    ) THEN RAISE EXCEPTION 'Reference unique constraint is incompatible'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conrelid = 'template_reference_contact'::regclass
          AND c.conname = 'template_reference_contact_group_fk' AND c.contype = 'f'
          AND c.convalidated AND NOT c.condeferrable
          AND c.confrelid = 'template_reference_contact_group'::regclass
          AND c.confdeltype = 'a' AND c.confupdtype = 'a'
          AND (SELECT count(*)=4 AND bool_and(t.tgenabled IN ('O','A'))
              FROM pg_trigger t WHERE t.tgconstraint=c.oid AND t.tgisinternal)
          AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='group_id')]::smallint[]
          AND c.confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=c.confrelid AND attname='id')]::smallint[]
    ) THEN RAISE EXCEPTION 'Reference foreign key is incompatible'; END IF;
END $$;
