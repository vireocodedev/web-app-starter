"""Read-only initialization preflight contracts; all remote/process seams mocked."""
import importlib.util
import contextlib
import io
import shlex
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
spec = importlib.util.spec_from_file_location('initialization_shared', SCRIPTS / '_shared.py')
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)


class InitializationEnvironmentTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.directory.chmod(0o700)
        example = (SCRIPTS.parent / '.env.example').read_text()
        self.text = example.replace('your-github-login', 'brunotot').replace('admin@example.com', 'admin@vireocode.com')
        self.env = self.directory / 'values.env'
        self.env.write_text(self.text)
        self.env.chmod(0o600)
        self.args = SimpleNamespace(env=self.env)
        self.ctx = shared.load_context(self.args, require_verified=False)

    def receipt(self, **extra):
        data = {'schema':1, 'env_sha256':shared.env_hash(self.env), 'repository':self.ctx.values['REPOSITORY'],
            'verifier_sha256':shared.verifier_hash(), 'scope':'full', 'mode':'new', 'verified_at':time.time()}
        data.update(extra)
        shared._write_json(self.directory / 'verification.json', data)

    def test_data_is_not_shell_and_unknown_duplicates_rejected(self):
        for line in ('PROJECT_SLUG=$(touch /tmp/no)', 'PROJECT_SLUG=valid;whoami',
                     'export PROJECT_SLUG=valid', 'TYPO=value', 'PROJECT_SLUG=other', 'DISPLAY_NAME="Quoted"'):
            with self.subTest(line=line):
                self.env.write_text(self.text + '\n' + line + '\n')
                with self.assertRaises(shared.InitError):
                    shared.read_values(self.env)

    def test_missing_values_and_unsafe_permissions_rejected(self):
        self.env.write_text('PROJECT_SLUG=inventory\n')
        with self.assertRaises(shared.InitError):
            shared.read_values(self.env)
        self.env.write_text(self.text)
        self.env.chmod(0o644)
        with self.assertRaises(shared.InitError):
            shared.read_values(self.env)
        self.env.chmod(0o600)
        self.directory.chmod(0o755)
        with self.assertRaises(shared.InitError):
            shared.read_values(self.env)

    def test_symlink_is_not_protected_input(self):
        target = self.directory / 'target.env'
        self.env.rename(target)
        self.env.symlink_to(target)
        with self.assertRaises(shared.InitError):
            shared.read_values(self.env)

    def test_all_fields_validated_and_derived(self):
        self.assertEqual(self.ctx.values['REPOSITORY'], 'vireocodedev/inventory-portal')
        self.assertEqual(self.ctx.values['COMPOSE_PROJECT_NAME'], 'inventory-portal-local')
        self.assertEqual(self.ctx.values['DATABASE_NAME'], 'inventory_portal')
        for field, value in [('PROJECT_SLUG','web-app-starter'), ('PROJECT_SLUG','bad--name'),
                ('JAVA_PACKAGE','com.class.app'), ('JAVA_PACKAGE','com.vireocode.backend'),
                ('PWA_SHORT_NAME','too-long-project'), ('INITIAL_EMAIL','admin@example.com'),
                ('INITIAL_DISPLAY_NAME','Admin #comment'), ('MAINTAINER_LOGIN','your-github-login'),
                ('GH_ORG','another-org'), ('DNS_ZONE','other.zone'), ('DNS_ZONE_ID','123'),
                ('DNS_PROJECT_ID','123'), ('OPERATOR_SSH','root@untrusted'),
                ('STAGING_HOSTNAME','starter-staging.vireocode.com'),
                ('PRODUCTION_HOSTNAME','inventory-staging.vireocode.com'),
                ('STAGING_FRONTEND_PORT','18281'), ('DNS_TOKEN_FILE','relative.env')]:
            values = shared.read_values(self.env)
            values[field] = value
            with self.subTest(field=field,value=value), self.assertRaises(shared.InitError):
                shared.validate_values(values)

    def test_receipt_bound_to_env_verifier_time_and_scope(self):
        for extra in ({'env_sha256':'wrong'}, {'verifier_sha256':'wrong'}, {'verified_at':time.time()-86401},
                {'verified_at':time.time()+100}, {'scope':'anything'}, {'repository':'other/repo'}):
            self.receipt(**extra)
            with self.subTest(extra=extra), self.assertRaises(shared.InitError):
                shared.load_context(self.args)
        self.receipt()
        self.assertEqual(shared.load_context(self.args).scope, 'full')
        self.env.write_text(self.text + '\n# changed bytes\n')
        with self.assertRaises(shared.InitError):
            shared.load_context(self.args)

    def test_state_preserves_existing_fields_and_rejects_identity_changes(self):
        shared.update_state(self.ctx, repository_id=123)
        shared.update_state(self.ctx, source_sha='a'*40)
        self.assertEqual(shared.read_state(self.ctx)['repository_id'],123)
        self.assertEqual((self.directory / 'progress.json').stat().st_mode & 0o777, 0o600)
        with self.assertRaises(shared.InitError):
            shared.update_state(self.ctx, repository='unrelated/repo')

    def test_repository_id_cannot_be_replaced_or_cleared_by_later_observations(self):
        shared.update_state(self.ctx, repository_id=123, source_sha='a'*40)
        original=(self.directory/'progress.json').read_bytes()
        for identity in (456, None, True, '123', 0, -1):
            with self.subTest(identity=identity), self.assertRaises(shared.InitError):
                shared.update_state(self.ctx, repository_id=identity, staging_workflow_id=15)
            self.assertEqual((self.directory/'progress.json').read_bytes(), original)
        shared.update_state(self.ctx, repository_id=123, staging_workflow_id=15)
        self.assertEqual(shared.read_state(self.ctx)['staging_workflow_id'],15)

    def test_progress_is_bound_to_exact_values_and_cannot_survive_reconfigured_ports(self):
        shared.update_state(self.ctx, repository_id=123, dns_hostnames=['inventory.vireocode.com'])
        self.env.write_text(self.text.replace('STAGING_FRONTEND_PORT=18280', 'STAGING_FRONTEND_PORT=18480'))
        changed = shared.load_context(self.args, require_verified=False)
        with self.assertRaises(shared.InitError):
            shared.read_state(changed)
        with self.assertRaises(shared.InitError):
            shared.update_state(changed, source_sha='a'*40)
        state=json.loads((self.directory/'progress.json').read_text())
        self.assertEqual(state['repository_id'],123)
        self.assertNotEqual(state['env_sha256'],shared.env_hash(self.env))

    def test_canonical_and_wrong_origins_are_rejected(self):
        for origin in ('git@github.com:vireocodedev/web-app-starter.git',
                'git@evil.example:vireocodedev/inventory-portal.git',
                'https://github.com/another/project.git'):
            with patch.object(shared,'run', return_value=SimpleNamespace(stdout=origin)):
                with self.subTest(origin=origin), self.assertRaises(shared.InitError):
                    shared.require_consumer(self.ctx)
        for origin in ('git@github.com:vireocodedev/inventory-portal.git',
                'https://github.com/vireocodedev/inventory-portal.git'):
            with patch.object(shared,'run', return_value=SimpleNamespace(stdout=origin)):
                shared.require_consumer(self.ctx)

    def github(self, endpoint, include=False, *, scopes='repo, read:org', role='admin', login='brunotot', repo=None):
        if endpoint=='user':
            return 'HTTP/2.0 200 OK\nX-OAuth-Scopes: ' + scopes + '\n\n' + json.dumps({'login':login})
        if endpoint.startswith('user/memberships/'):
            return {'state':'active','role':role}
        if endpoint.startswith('repos/'):
            return {'id':123, 'full_name':self.ctx.values['REPOSITORY'], 'private':True,
                'default_branch':'main', 'permissions':{'admin':True}, **(repo or {})}
        raise AssertionError(endpoint)

    def test_github_new_verifies_existing_exact_consumer_without_listing_or_writes(self):
        with patch.object(shared,'github_api', side_effect=self.github) as api, \
                patch.object(shared,'require_consumer') as consumer:
            self.assertEqual(shared.verify_github(self.ctx,'new'), {'account':'brunotot','repository_id':123})
            consumer.assert_called_once_with(self.ctx)
            self.assertEqual([call.args[0] for call in api.call_args_list], [
                'user', 'user/memberships/orgs/vireocodedev', 'repos/vireocodedev/inventory-portal'])
            # Observing GitHub alone must not record a fully verified identity.
            self.assertEqual(shared.read_state(self.ctx), {})

    def test_github_requires_intended_account_and_existing_organization_policy(self):
        for options in ({'scopes':'read:org'}, {'scopes':''}, {'role':'member'}, {'login':'other-user'}):
            with patch.object(shared,'require_consumer'), \
                    patch.object(shared,'github_api', side_effect=lambda *a, **k:self.github(*a,**k,**options)):
                with self.subTest(options=options), self.assertRaises(shared.InitError):
                    shared.verify_github(self.ctx,'new')

    def test_github_missing_or_inaccessible_consumer_fails_without_recording_identity(self):
        def missing(endpoint, **kwargs):
            if endpoint.startswith('repos/'):
                raise shared.InitError('404 may conceal private repo')
            return self.github(endpoint, **kwargs)
        with patch.object(shared,'require_consumer'), \
                patch.object(shared,'github_api', side_effect=missing):
            with self.assertRaises(shared.InitError):
                shared.verify_github(self.ctx,'new')
            self.assertFalse((self.directory/'progress.json').exists())

    def test_github_rejects_wrong_private_active_main_admin_or_numeric_identity(self):
        for changed in ({'id':0}, {'id':-1}, {'id':True}, {'id':'123'}, {'id':None},
                {'full_name':'another/project'}, {'full_name':None}, {'private':False},
                {'permissions':{'admin':False}}, {'permissions':None}, {'default_branch':'other'},
                {'archived':True}, {'disabled':True}):
            with patch.object(shared,'require_consumer'), \
                    patch.object(shared,'github_api', side_effect=lambda *a,**k:self.github(*a,**k,repo=changed)):
                with self.subTest(changed=changed), self.assertRaises(shared.InitError):
                    shared.verify_github(self.ctx,'new')
            self.assertFalse((self.directory/'progress.json').exists())

    def test_github_resume_requires_exact_protected_repository_id_and_origin(self):
        with patch.object(shared,'github_api', side_effect=self.github), \
                patch.object(shared,'require_consumer') as consumer:
            with self.assertRaises(shared.InitError):
                shared.verify_github(self.ctx,'resume')
            shared.update_state(self.ctx,repository_id=123)
            self.assertEqual(shared.verify_github(self.ctx,'resume')['repository_id'],123)
            self.assertEqual(consumer.call_count, 2)

    def test_github_both_modes_preserve_existing_repository_id_on_mismatch(self):
        shared.update_state(self.ctx,repository_id=456, source_sha='a'*40)
        original=(self.directory/'progress.json').read_bytes()
        for mode in ('new','resume'):
            with patch.object(shared,'require_consumer'), patch.object(shared,'github_api',side_effect=self.github):
                with self.subTest(mode=mode), self.assertRaises(shared.InitError):
                    shared.verify_github(self.ctx,mode)
                self.assertEqual((self.directory/'progress.json').read_bytes(), original)

    def test_full_new_preflight_binds_existing_id_only_after_all_probes_pass(self):
        def dns(ctx, mode):
            self.assertFalse((self.directory/'progress.json').exists())
            return {'zone_id':'1423739'}
        with patch.object(shared,'require_consumer'), patch.object(shared,'verify_tools'), \
                patch.object(shared,'github_api',side_effect=self.github), \
                patch.object(shared,'verify_ssh',return_value={'verified':True}), \
                patch.object(shared,'verify_dns',side_effect=dns):
            receipt=shared.verify_environment(self.ctx,'full','new')
        self.assertEqual(shared.read_state(self.ctx)['repository_id'],123)
        self.assertEqual(receipt['evidence']['github']['repository_id'],123)
        self.assertEqual(shared.load_context(self.args).mode,'new')
        with patch.object(shared,'require_consumer'), patch.object(shared,'verify_tools'), \
                patch.object(shared,'github_api',side_effect=self.github), \
                patch.object(shared,'verify_ssh',return_value={'verified':True}), \
                patch.object(shared,'verify_dns',return_value={'zone_id':'1423739'}):
            # Re-verification is safe for an already recorded first-time setup.
            shared.verify_environment(self.ctx,'full','new')
            shared.verify_environment(self.ctx,'full','resume')

    def test_failed_full_preflight_leaves_no_receipt_or_new_repository_binding(self):
        self.receipt()
        with patch.object(shared,'require_consumer'), patch.object(shared,'verify_tools'), \
                patch.object(shared,'github_api',side_effect=self.github), \
                patch.object(shared,'verify_ssh',return_value={'verified':True}), \
                patch.object(shared,'verify_dns',side_effect=shared.InitError('DNS failure')):
            with self.assertRaises(shared.InitError):
                shared.verify_environment(self.ctx,'full','new')
        self.assertFalse((self.directory/'verification.json').exists())
        self.assertFalse((self.directory/'progress.json').exists())

    def test_every_scope_and_mode_rejects_template_or_wrong_origin_before_probes(self):
        for scope in ('local','full'):
            for mode in ('new','resume'):
                for origin in ('git@github.com:vireocodedev/web-app-starter.git',
                        'https://github.com/another/project.git'):
                    self.receipt()
                    with patch.object(shared,'run',return_value=SimpleNamespace(stdout=origin)), \
                            patch.object(shared,'verify_tools') as tools, \
                            patch.object(shared,'github_api') as api, \
                            patch.object(shared,'verify_ssh') as ssh, patch.object(shared,'verify_dns') as dns:
                        with self.subTest(scope=scope,mode=mode,origin=origin), self.assertRaises(shared.InitError):
                            shared.verify_environment(self.ctx,scope,mode)
                        tools.assert_not_called(); api.assert_not_called(); ssh.assert_not_called(); dns.assert_not_called()
                    self.assertFalse((self.directory/'verification.json').exists())
                    self.assertFalse((self.directory/'progress.json').exists())

    def dns_api(self, ctx, path, *, rrsets=None):
        if '/rrsets' in path:
            return {'rrsets':rrsets or [], 'meta':{'pagination':{'next_page':None}}}
        return {'zone':{'id':1423739,'name':'vireocode.com','mode':'primary',
            'authoritative_nameservers':{'assigned':['hydrogen.ns.hetzner.com.']}}}

    def dns_query(self,name,kind,server=None):
        if kind=='NS' and name=='vireocode.com':
            return [('vireocode.com','NS','hydrogen.ns.hetzner.com.')]
        if kind=='SOA':
            return [('vireocode.com','SOA','hydrogen.ns.hetzner.com. dns.hetzner.com. 1 2 3 4 5')]
        return []

    def test_dns_proves_provider_and_authoritative_names_without_writes(self):
        with patch.object(shared,'dns_api', side_effect=self.dns_api), \
                patch.object(shared,'dns_query',side_effect=self.dns_query):
            self.assertEqual(shared.verify_dns(self.ctx,'new')['zone_id'],'1423739')

    def test_dns_exact_wildcard_alias_delegation_and_servfail_block(self):
        for rr in ({'name':'inventory','type':'A','records':[{'value':'46.224.72.162'}]},
                {'name':'*','type':'A','records':[{'value':'46.224.72.162'}]},
                {'name':'inventory','type':'CNAME','records':[{'value':'other.example.'}]}):
            with patch.object(shared,'dns_api',side_effect=lambda *a:self.dns_api(*a,rrsets=[rr])), \
                    patch.object(shared,'dns_query',side_effect=self.dns_query):
                with self.subTest(rr=rr), self.assertRaises(shared.InitError):
                    shared.verify_dns(self.ctx,'new')
        with patch.object(shared,'run',return_value=SimpleNamespace(stdout=';; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id:1')):
            with self.assertRaises(shared.InitError):
                shared.dns_query('vireocode.com','NS')
        with patch.object(shared,'dns_api',side_effect=self.dns_api), \
                patch.object(shared,'dns_query',return_value=[]):
            with self.assertRaises(shared.InitError):
                shared.verify_dns(self.ctx,'new')

    def test_dns_resume_does_not_accept_unrecorded_matching_record(self):
        rr={'name':'inventory','type':'A','records':[{'value':'46.224.72.162'}]}
        with patch.object(shared,'dns_api',side_effect=lambda *a:self.dns_api(*a,rrsets=[rr])), \
                patch.object(shared,'dns_query',side_effect=self.dns_query):
            with self.assertRaises(shared.InitError):
                shared.verify_dns(self.ctx,'resume')
            shared.update_state(self.ctx,dns_hostnames=[self.ctx.values['STAGING_HOSTNAME'],self.ctx.values['PRODUCTION_HOSTNAME']])
            shared.verify_dns(self.ctx,'resume')

    def test_dns_cname_ancestor_or_subzone_is_not_available(self):
        self.ctx.values['PRODUCTION_HOSTNAME']='app.tools.vireocode.com'
        for kind in ('CNAME','NS','DNAME'):
            rr={'name':'tools','type':kind,'records':[{'value':'other.example.'}]}
            with patch.object(shared,'dns_api',side_effect=lambda *a:self.dns_api(*a,rrsets=[rr])), \
                    patch.object(shared,'dns_query',side_effect=self.dns_query):
                with self.subTest(kind=kind), self.assertRaises(shared.InitError):
                    shared.verify_dns(self.ctx,'new')

    def test_ssh_strict_batch_fixed_program_and_unused_ports(self):
        self.ctx.mode='new'
        evidence={'root':True,'ports':[],'configs':[],'namespace_exists':False}
        with patch.object(shared,'run',return_value=SimpleNamespace(stdout=json.dumps(evidence))) as run:
            shared.verify_ssh(self.ctx)
            argv=run.call_args.args[0]
            self.assertIn('StrictHostKeyChecking=yes',argv)
            self.assertIn('BatchMode=yes',argv)
            self.assertEqual(run.call_args.kwargs['timeout'],30)
            self.assertEqual(json.loads(run.call_args.kwargs['input'])['PROJECT_SLUG'],'inventory-portal')
        for changed in ({'ports':[18280]}, {'namespace_exists':True}):
            with patch.object(shared,'run',return_value=SimpleNamespace(stdout=json.dumps(evidence|changed))):
                with self.subTest(changed=changed), self.assertRaises(shared.InitError):
                    shared.verify_ssh(self.ctx)
        with patch.object(shared,'run',side_effect=shared.InitError('SSH failed')):
            with self.assertRaises(shared.InitError):
                shared.verify_ssh(self.ctx)

    def test_local_receipt_never_claims_remote_checks_and_failure_invalidates(self):
        with patch.object(shared,'require_consumer') as consumer, \
                patch.object(shared,'verify_tools'), patch.object(shared,'verify_github') as gh, \
                patch.object(shared,'verify_ssh') as ssh, patch.object(shared,'verify_dns') as dns:
            receipt=shared.verify_environment(self.ctx,'local','new')
            self.assertEqual(receipt['evidence'],{'tools':True})
            consumer.assert_called_once_with(self.ctx)
            gh.assert_not_called(); ssh.assert_not_called(); dns.assert_not_called()
        with patch.object(shared,'require_consumer'), \
                patch.object(shared,'verify_tools',side_effect=shared.InitError('missing tool')):
            with self.assertRaises(shared.InitError):
                shared.verify_environment(self.ctx,'local','new')
            self.assertFalse((self.directory/'verification.json').exists())

    def test_named_recursive_dns_server_does_not_require_authority_flag(self):
        response = ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id:1\n;; flags: qr rd ra; QUERY:1\n'
        response += 'inventory.vireocode.com. 300 IN A 46.224.72.162\n'
        with patch.object(shared, 'run', return_value=SimpleNamespace(stdout=response)) as run:
            self.assertEqual(shared.dns_query('inventory.vireocode.com','A','1.1.1.1',authoritative=False),
                [('inventory.vireocode.com','A','46.224.72.162')])
            self.assertIn('+recurse',run.call_args.args[0])
            with self.assertRaises(shared.InitError):
                shared.dns_query('inventory.vireocode.com','A','1.1.1.1')

    def test_dns_token_requires_original_absolute_path_from_any_working_directory(self):
        values = shared.read_values(self.env)
        values['DNS_TOKEN_FILE'] = 'relative-token.env'
        with patch('os.getcwd', return_value='/tmp'):
            with self.assertRaises(shared.InitError):
                shared.validate_values(values)
        values['DNS_TOKEN_FILE'] = '/tmp/absolute-token.env'
        shared.validate_values(values)

    def test_custom_env_checks_actual_git_checkout_ignoring_and_tracking_before_read(self):
        repository = self.directory / 'another-checkout'
        repository.mkdir()
        subprocess.run(['git', 'init', '--quiet', str(repository)], check=True, capture_output=True)
        private = repository / 'private-values'
        private.mkdir(mode=0o700)
        target = private / 'values.env'
        target.write_text(self.text)
        target.chmod(0o600)
        with self.assertRaises(shared.InitError):
            shared.load_context(SimpleNamespace(env=target), require_verified=False)
        (repository / '.gitignore').write_text('/private-values/\n')
        shared.load_context(SimpleNamespace(env=target), require_verified=False)
        subprocess.run(['git', '-C', str(repository), 'add', '--force', 'private-values/values.env'],
            check=True, capture_output=True)
        with patch.object(Path, 'read_text', side_effect=AssertionError('Tracked private values must never be read')):
            with self.assertRaises(shared.InitError):
                shared.load_context(SimpleNamespace(env=target), require_verified=False)
        with self.assertRaises(shared.InitError):
            shared._write_json(private / 'progress.json', {'repository':'example'})
        self.assertFalse((private / 'progress.json').exists())

    def test_prepare_values_refuses_unignored_custom_directory_before_creation(self):
        repository = self.directory / 'creation-checkout'
        repository.mkdir()
        subprocess.run(['git', 'init', '--quiet', str(repository)], check=True, capture_output=True)
        destination = repository / 'private-data' / 'values.env'
        with self.assertRaises(shared.InitError):
            shared.require_private_inputs(destination)
        self.assertFalse(destination.parent.exists())
        (repository / '.gitignore').write_text('/private-data/\n')
        self.assertEqual(shared.require_private_inputs(destination), destination)

    def test_remote_security_guards_survive_python_optimization(self):
        self.ctx.mode = 'new'
        evidence = {'root':True,'ports':[],'configs':[],'namespace_exists':False}
        with patch.object(shared, 'run', return_value=SimpleNamespace(stdout=json.dumps(evidence))) as run:
            shared.verify_ssh(self.ctx)
            command = shlex.split(run.call_args.args[0][-1])
        self.assertEqual(command[:3], ['python3','-I','-c'])
        optimized = compile(command[3], '<remote-read-only-probe>', 'exec', optimize=2)
        cases = (
            {'uid':1000, 'tool':'installed', 'source':True, 'origin':'git@github.com:vireocodedev/web-app-starter.git', 'caddy':'import /etc/caddy/sites/*.caddy'},
            {'uid':0, 'tool':None, 'source':True, 'origin':'git@github.com:vireocodedev/web-app-starter.git', 'caddy':'import /etc/caddy/sites/*.caddy'},
            {'uid':0, 'tool':'installed', 'source':False, 'origin':'git@github.com:vireocodedev/web-app-starter.git', 'caddy':'import /etc/caddy/sites/*.caddy'},
            {'uid':0, 'tool':'installed', 'source':True, 'origin':'git@github.com:unrelated/repository.git', 'caddy':'import /etc/caddy/sites/*.caddy'},
            {'uid':0, 'tool':'installed', 'source':True, 'origin':'git@github.com:vireocodedev/web-app-starter.git', 'caddy':'# import /etc/caddy/sites/*.caddy'},
        )
        for case in cases:
            output = io.StringIO()
            with self.subTest(case=case), contextlib.redirect_stdout(output), \
                    patch('sys.stdin', io.StringIO(json.dumps(self.ctx.values))), \
                    patch.object(os, 'geteuid', return_value=case['uid']), \
                    patch.object(shared.shutil, 'which', return_value=case['tool']), \
                    patch.object(Path, 'is_dir', return_value=case['source']), \
                    patch.object(Path, 'read_text', return_value=case['caddy']), \
                    patch.object(subprocess, 'run', return_value=SimpleNamespace(stdout=case['origin'])):
                with self.assertRaises(SystemExit):
                    exec(optimized, {})
                self.assertEqual(output.getvalue(), '')

    def test_process_failure_does_not_echo_credential_bearing_output(self):
        result=subprocess.CompletedProcess(['gh'],1,stdout='SECRET',stderr='SECRET')
        with patch.object(shared.subprocess,'run',return_value=result):
            with self.assertRaises(shared.InitError) as caught:
                shared.run(['gh','api','user'],capture=True)
            self.assertNotIn('SECRET',str(caught.exception))


if __name__=='__main__':
    unittest.main()
