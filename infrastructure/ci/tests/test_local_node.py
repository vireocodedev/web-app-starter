"""Exercise the actual IDE runtime launcher without starting local services."""
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
LAUNCHER = ROOT / 'backend/scripts/with-local-node.sh'
MAJOR = (ROOT / 'frontend/.nvmrc').read_text().strip()


class LocalNodeTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='local node ')
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.env = {**os.environ, 'NVM_DIR': str(self.directory / 'nvm missing')}

    def node(self, name, major, exit_code=0):
        directory = self.directory / name
        directory.mkdir()
        executable = directory / 'node'
        executable.write_text(f'''#!/bin/bash
if [[ "$1" == "-p" ]]; then
  printf '%s\\n' '{major}'
  exit 0
fi
printf '%s\\n' "$@"
exit {exit_code}
''')
        executable.chmod(0o700)
        return directory

    def run_launcher(self, *arguments):
        return subprocess.run(['/bin/bash', str(LAUNCHER), *arguments],
                              env=self.env, capture_output=True, text=True, check=False)

    def nvm(self, node_directory, succeed=True):
        directory = self.directory / 'nvm with spaces'
        directory.mkdir()
        (directory / 'nvm.sh').write_text(f'''[[ "$#" == "1" && "$1" == "--no-use" ]] || return 91
nvm() {{
  [[ "$#" == "3" && "$1" == "use" && "$2" == "--silent" && "$3" == "{MAJOR}" ]] || return 92
  {'export PATH=' + shlex.quote(str(node_directory)) + ':"$PATH"' if succeed else 'return 93'}
}}
''')
        self.env['NVM_DIR'] = str(directory)

    def test_matching_path_node_does_not_load_nvm(self):
        node = self.node('supported node', MAJOR)
        self.env['PATH'] = str(node) + os.pathsep + '/usr/bin:/bin'
        self.nvm(node, succeed=False)
        result = self.run_launcher('setup-local.mjs')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.splitlines(), ['setup-local.mjs'])

    def test_old_desktop_node_uses_existing_nvm_version(self):
        old = self.node('desktop node', '12')
        supported = self.node('nvm node', MAJOR)
        self.env['PATH'] = str(old) + os.pathsep + '/usr/bin:/bin'
        self.nvm(supported)
        result = self.run_launcher('start-local.mjs')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.splitlines(), ['start-local.mjs'])

    def test_unavailable_supported_node_fails_before_target(self):
        old = self.node('desktop node', '12')
        self.env['PATH'] = str(old) + os.pathsep + '/usr/bin:/bin'
        result = self.run_launcher('must-not-run.mjs')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, '')
        self.assertIn(f'Node {MAJOR} is required', result.stderr)

    def test_default_nvm_directory_is_resolved_from_home(self):
        old = self.node('desktop node', '12')
        supported = self.node('nvm node', MAJOR)
        self.env['PATH'] = str(old) + os.pathsep + '/usr/bin:/bin'
        self.nvm(supported)
        Path(self.env.pop('NVM_DIR')).rename(self.directory / '.nvm')
        self.env['HOME'] = str(self.directory)
        result = self.run_launcher('setup-local.mjs')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.splitlines(), ['setup-local.mjs'])

    def test_nvm_cannot_report_success_with_an_unsupported_runtime(self):
        old = self.node('desktop node', '12')
        self.env['PATH'] = str(old) + os.pathsep + '/usr/bin:/bin'
        self.nvm(old)
        result = self.run_launcher('must-not-run.mjs')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, '')
        self.assertIn(f'Node {MAJOR} is required', result.stderr)

    def test_failed_nvm_selection_fails_before_target(self):
        old = self.node('desktop node', '12')
        supported = self.node('nvm node', MAJOR)
        self.env['PATH'] = str(old) + os.pathsep + '/usr/bin:/bin'
        self.nvm(supported, succeed=False)
        result = self.run_launcher('must-not-run.mjs')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, '')
        self.assertIn(f'Node {MAJOR}', result.stderr)

    def test_preserves_arguments_spaces_and_target_exit_code(self):
        supported = self.node('supported node', MAJOR, exit_code=37)
        self.env['PATH'] = str(supported) + os.pathsep + '/usr/bin:/bin'
        arguments = ['target with spaces.mjs', 'one argument', '--flag', '']
        result = self.run_launcher(*arguments)
        self.assertEqual(result.returncode, 37)
        self.assertEqual(result.stdout.splitlines(), arguments)


if __name__ == '__main__':
    unittest.main()
