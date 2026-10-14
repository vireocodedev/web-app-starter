#!/usr/bin/env bash
# Run only from reviewed source on an approved fresh host. Does not activate CI.
set -euo pipefail
umask 077
WEB_APP_SOURCE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
WEB_APP_CONFIG=${1:?Usage: install.sh /root/reviewed-ci-config.json}
WEB_APP_BASE=/var/lib/web-app-ci
WEB_APP_ROOTFS=$WEB_APP_BASE/rootfs
test "$(id -u)" = 0
test "$(uname -m)" = x86_64
. /etc/os-release
test "$ID" = ubuntu && test "$VERSION_ID" = 26.04
# Host routing is reviewed outside this installer; do not alter forwarding here.
test "$(cat /proc/sys/net/ipv4/ip_forward)" = 1 || {
  echo 'Host IPv4 forwarding must already be enabled (net.ipv4.ip_forward=1). Review host routing/firewall prerequisites in infrastructure/ci/README.md before installing CI.' >&2
  exit 1
}
# Check capacity before provisioning.
WEB_APP_RAM_MIB=$(awk '/^MemTotal:/ {print int($2/1024)}' /proc/meminfo)
test "$WEB_APP_RAM_MIB" -ge 7500 || { echo 'Resize this server to at least 8 GB RAM before provisioning CI.' >&2; exit 1; }
test -f /sys/fs/cgroup/cgroup.controllers
test -e /proc/self/ns/cgroup
test "$(systemctl --version | awk 'NR==1 {print $2}')" -ge 259
test "$(cat /proc/sys/kernel/unprivileged_userns_clone)" = 1
test "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns)" = 1
for WEB_APP_TOOL in debootstrap nft ip iptables apparmor_parser chroot python3 curl gpg mount mkfs.ext4 fallocate nsenter getcap setcap; do
  command -v "$WEB_APP_TOOL" >/dev/null || { echo "Missing installer prerequisite: $WEB_APP_TOOL" >&2; exit 1; }
done
test -f /usr/share/keyrings/ubuntu-archive-keyring.gpg
test -c /dev/net/tun
test ! -e /etc/web-app-ci && test ! -L /etc/web-app-ci
test ! -e "$WEB_APP_BASE" && test ! -L "$WEB_APP_BASE"
test ! -e /usr/local/lib/web-app-ci && test ! -L /usr/local/lib/web-app-ci
test ! -e /etc/systemd/system/web-app-ci-controller.service && test ! -L /etc/systemd/system/web-app-ci-controller.service
test ! -e /etc/apparmor.d/web-app-ci && test ! -L /etc/apparmor.d/web-app-ci
# Validate exact keys/bounded integers before interpolating configuration in units.
WEB_APP_SETTINGS=$(python3 - "$WEB_APP_SOURCE" "$WEB_APP_CONFIG" "$WEB_APP_RAM_MIB" <<'PY'
import importlib.util,json,pathlib,pwd,grp,sys
source, config_path, ram = sys.argv[1:]
spec=importlib.util.spec_from_file_location('controller', pathlib.Path(source)/'controller.py')
module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
module.CONFIG=pathlib.Path(config_path)
config=module.load_config()
uid=config['uid']; start=config['subuid_start']; end=start+65536
assert int(ram) >= config['memory_max_mib']+config['host_reserve_mib'], 'RAM reserve too small'
assert not any(p.pw_name=='web-app-ci' or p.pw_uid==uid or start<=p.pw_uid<end for p in pwd.getpwall()), 'UID conflict'
assert not any(g.gr_name=='web-app-ci' or g.gr_gid==uid or start<=g.gr_gid<end for g in grp.getgrall()), 'GID conflict'
for name in ('/etc/subuid','/etc/subgid'):
  path=pathlib.Path(name)
  for line in path.read_text().splitlines() if path.exists() else []:
    owner, first, count=line.split(':'); first=int(first); count=int(count)
    assert owner!='web-app-ci' and not (start<first+count and first<end), 'Subordinate ID conflict'
assert not pathlib.Path(f'/etc/systemd/system/user@{uid}.service.d').exists(), 'Manager configuration conflict'
assert not pathlib.Path(f'/etc/systemd/system/user-{uid}.slice.d').exists(), 'Slice configuration conflict'
print(uid, start, config['memory_high_mib'], config['memory_max_mib'],config['swap_max_mib'],
      config['cpu_quota_percent'],config['tasks_max'])
PY
)
read -r WEB_APP_UID WEB_APP_SUBUID WEB_APP_HIGH WEB_APP_MAX WEB_APP_SWAP WEB_APP_CPU WEB_APP_TASKS <<<"$WEB_APP_SETTINGS"
test ! -e /var/lib/systemd/linger/web-app-ci
test ! -e "/run/user/$WEB_APP_UID"
test "$(df --output=avail -B1 /var/lib | tail -n 1)" -ge 26843545600 || { echo 'Need 25 GiB free disk before CI provisioning.' >&2; exit 1; }
install -d -m 0700 /etc/web-app-ci "$WEB_APP_BASE"
install -m 0600 "$WEB_APP_CONFIG" /etc/web-app-ci/config.json
install -d -m 0755 /usr/local/lib/web-app-ci
install -m 0755 "$WEB_APP_SOURCE/controller.py" "$WEB_APP_SOURCE/validation.py" /usr/local/lib/web-app-ci/
WEB_APP_PROC_MOUNTED=0
trap 'if test "$WEB_APP_PROC_MOUNTED" = 1; then umount "$WEB_APP_ROOTFS/proc"; fi' EXIT
# Ubuntu archive signatures authenticate all base packages and their hashes.
# dbus explicitly provides libpam-systemd's virtual system-bus dependency;
# debootstrap's limited resolver does not reliably select that provider itself.
debootstrap --arch=amd64 --variant=minbase --components=main,universe \
  --keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg \
  --include=systemd,systemd-sysv,dbus,dbus-user-session,uidmap,slirp4netns,ca-certificates,curl,gnupg,git,xz-utils,python3,procps,iproute2,iptables,unzip,time \
  resolute "$WEB_APP_ROOTFS" https://archive.ubuntu.com/ubuntu
cat >"$WEB_APP_ROOTFS/usr/sbin/policy-rc.d" <<'SH'
#!/bin/sh
exit 101
SH
chmod 0755 "$WEB_APP_ROOTFS/usr/sbin/policy-rc.d"
cp --dereference /etc/resolv.conf "$WEB_APP_ROOTFS/etc/resolv.conf"
mount -t proc proc "$WEB_APP_ROOTFS/proc"
WEB_APP_PROC_MOUNTED=1
cat >"$WEB_APP_ROOTFS/etc/apt/sources.list" <<'APT'
deb https://archive.ubuntu.com/ubuntu resolute main universe
deb https://archive.ubuntu.com/ubuntu resolute-updates main universe
deb https://security.ubuntu.com/ubuntu resolute-security main universe
APT
# Docker and Chrome are installed ONLY in the new rootfs. Host Docker stays intact.
install -d -m 0755 "$WEB_APP_ROOTFS/etc/apt/keyrings"
curl --fail --silent --show-error --location https://download.docker.com/linux/ubuntu/gpg -o "$WEB_APP_ROOTFS/etc/apt/keyrings/docker.asc"
WEB_APP_DOCKER_FINGERPRINT=$(gpg --batch --show-keys --with-colons "$WEB_APP_ROOTFS/etc/apt/keyrings/docker.asc" | awk -F: '$1=="fpr" && !found {print $10;found=1}')
test "$WEB_APP_DOCKER_FINGERPRINT" = 9DC858229FC7DD38854AE2D88D81803C0EBFCD88
test "$(head -n 1 "$WEB_APP_ROOTFS/etc/apt/keyrings/docker.asc")" = '-----BEGIN PGP PUBLIC KEY BLOCK-----'
chmod 0644 "$WEB_APP_ROOTFS/etc/apt/keyrings/docker.asc"
echo 'deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu resolute stable' >"$WEB_APP_ROOTFS/etc/apt/sources.list.d/docker.list"
curl --fail --silent --show-error --location https://dl.google.com/linux/linux_signing_key.pub -o "$WEB_APP_ROOTFS/etc/apt/keyrings/google.asc"
# Google may rotate subkeys. Require the documented primary signing key.
gpg --batch --show-keys --with-colons "$WEB_APP_ROOTFS/etc/apt/keyrings/google.asc" | awk -F: '$1=="fpr" {print $10}' | \
  awk '/^(EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796|4CCA1EAF950CEE4AB83976DCA040830F7FAC5991)$/ {found=1} END {exit !found}'
test "$(head -n 1 "$WEB_APP_ROOTFS/etc/apt/keyrings/google.asc")" = '-----BEGIN PGP PUBLIC KEY BLOCK-----'
chmod 0644 "$WEB_APP_ROOTFS/etc/apt/keyrings/google.asc"
echo 'deb [arch=amd64 signed-by=/etc/apt/keyrings/google.asc] https://dl.google.com/linux/chrome/deb/ stable main' >"$WEB_APP_ROOTFS/etc/apt/sources.list.d/google-chrome.list"
chroot "$WEB_APP_ROOTFS" apt-get update
WEB_APP_DOCKER_VERSION=$(chroot "$WEB_APP_ROOTFS" apt-cache madison docker-ce | awk '$3 ~ /^5:29\.8\.0-/ && !found {print $3;found=1}')
test -n "$WEB_APP_DOCKER_VERSION" || { echo 'Pinned Docker 29.8.0 packages unavailable; review pins before retrying.' >&2; exit 1; }
chroot "$WEB_APP_ROOTFS" env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  "docker-ce=$WEB_APP_DOCKER_VERSION" "docker-ce-cli=$WEB_APP_DOCKER_VERSION" \
  "docker-ce-rootless-extras=$WEB_APP_DOCKER_VERSION" containerd.io docker-buildx-plugin docker-compose-plugin \
  google-chrome-stable fonts-liberation fonts-noto-color-emoji libicu78
install -d -m 0755 "$WEB_APP_ROOTFS/opt/node" "$WEB_APP_ROOTFS/opt/jdk" "$WEB_APP_ROOTFS/opt/runner" "$WEB_APP_BASE/downloads"
download_verified() {
  local WEB_APP_URL=$1 WEB_APP_SHA=$2 WEB_APP_DEST=$3
  curl --fail --silent --show-error --location "$WEB_APP_URL" -o "$WEB_APP_DEST"
  echo "$WEB_APP_SHA  $WEB_APP_DEST" | sha256sum --check --status
}
download_verified https://nodejs.org/dist/v24.18.1/node-v24.18.1-linux-x64.tar.xz \
  d6c664df3f3f61458e8c277585571328522d705166723a7c7823a9253a4d15a0 "$WEB_APP_BASE/downloads/node.tar.xz"
download_verified 'https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.4.1%2B1/OpenJDK25U-jdk_x64_linux_hotspot_25.0.4.1_1.tar.gz' \
  dbb698396d478e7fa2b1e50f4103324b2a99b90569ee27c33f2261f9215cf41e "$WEB_APP_BASE/downloads/jdk.tar.gz"
download_verified https://github.com/actions/runner/releases/download/v2.338.0/actions-runner-linux-x64-2.338.0.tar.gz \
  af4b794c1bc41d73d40535e3fe092a39f9679cd8d965954c2aca25a05ca41d32 "$WEB_APP_BASE/downloads/runner.tar.gz"
tar --no-same-owner -xJf "$WEB_APP_BASE/downloads/node.tar.xz" -C "$WEB_APP_ROOTFS/opt/node" --strip-components=1
tar --no-same-owner -xzf "$WEB_APP_BASE/downloads/jdk.tar.gz" -C "$WEB_APP_ROOTFS/opt/jdk" --strip-components=1
tar --no-same-owner -xzf "$WEB_APP_BASE/downloads/runner.tar.gz" -C "$WEB_APP_ROOTFS/opt/runner"
chroot "$WEB_APP_ROOTFS" env PATH=/opt/node/bin:/usr/bin:/bin \
  /opt/node/bin/npm install --global --prefix /opt/node npm@12.0.2 --ignore-scripts --no-audit --fund=false
# Root's restrictive umask must not make the trusted npm package unreadable to CI.
chmod -R u=rwX,go=rX -- "$WEB_APP_ROOTFS/opt/node/lib/node_modules/npm"
test "$(chroot "$WEB_APP_ROOTFS" /opt/node/bin/node --version)" = v24.18.1
test "$(chroot "$WEB_APP_ROOTFS" env PATH=/opt/node/bin:/usr/bin:/bin /opt/node/bin/npm --version)" = 12.0.2
chroot "$WEB_APP_ROOTFS" dpkg-query -W -f='${Package}\t${Version}\n' >"$WEB_APP_BASE/baseline-packages.tsv"
umount "$WEB_APP_ROOTFS/proc"
WEB_APP_PROC_MOUNTED=0
groupadd --gid "$WEB_APP_UID" web-app-ci
useradd --uid "$WEB_APP_UID" --gid "$WEB_APP_UID" -K SUB_UID_COUNT=0 -K SUB_GID_COUNT=0 --no-create-home --home-dir /nonexistent/web-app-ci --shell /usr/sbin/nologin web-app-ci
usermod --lock web-app-ci
echo "web-app-ci:$WEB_APP_SUBUID:65536" >>/etc/subuid
echo "web-app-ci:$WEB_APP_SUBUID:65536" >>/etc/subgid
cat >>"$WEB_APP_ROOTFS/etc/passwd" <<EOF
web-app-ci:x:$WEB_APP_UID:$WEB_APP_UID:Disposable Web app CI:/home/web-app-ci:/usr/sbin/nologin
EOF
echo "web-app-ci:x:$WEB_APP_UID:" >>"$WEB_APP_ROOTFS/etc/group"
echo "web-app-ci:$WEB_APP_SUBUID:65536" >"$WEB_APP_ROOTFS/etc/subuid"
echo "web-app-ci:$WEB_APP_SUBUID:65536" >"$WEB_APP_ROOTFS/etc/subgid"
echo 'nameserver 1.1.1.1' >"$WEB_APP_ROOTFS/etc/resolv.conf"
echo 'nameserver 8.8.8.8' >>"$WEB_APP_ROOTFS/etc/resolv.conf"
echo 'web-app-ci-minimal-rootfs' >"$WEB_APP_ROOTFS/etc/web-app-ci-boundary"
chmod 0644 "$WEB_APP_ROOTFS/etc/subuid" "$WEB_APP_ROOTFS/etc/subgid" \
  "$WEB_APP_ROOTFS/etc/resolv.conf" "$WEB_APP_ROOTFS/etc/web-app-ci-boundary"
install -d -m 0755 "$WEB_APP_ROOTFS/home/web-app-ci" "$WEB_APP_ROOTFS/run/user/$WEB_APP_UID" \
  "$WEB_APP_ROOTFS/usr/local/lib/web-app-ci" "$WEB_APP_ROOTFS/etc/systemd/user"
install -m 0755 "$WEB_APP_SOURCE/start-job.sh" "$WEB_APP_SOURCE/validate-job.py" "$WEB_APP_ROOTFS/usr/local/lib/web-app-ci/"
install -d -m 0755 "$WEB_APP_ROOTFS/usr/local/lib/web-app-ci/runtime-bin"
sed -e "s/@UID@/$WEB_APP_UID/g" -e "s/@SUBUID@/$WEB_APP_SUBUID/g" -e "s/@SUBGID@/$WEB_APP_SUBUID/g" \
  "$WEB_APP_SOURCE/busctl-compat.py" >"$WEB_APP_ROOTFS/usr/local/lib/web-app-ci/runtime-bin/busctl"
chmod 0755 "$WEB_APP_ROOTFS/usr/local/lib/web-app-ci/runtime-bin/busctl"
install -d -m 0755 "$WEB_APP_BASE/proc-witness" "$WEB_APP_BASE/sys-witness" \
  "$WEB_APP_ROOTFS/usr/local/lib/web-app-ci/proc-witness"
install -d -m 0700 "$WEB_APP_ROOTFS/usr/local/lib/web-app-ci/sys-anchor"
install -d -m 0755 "$WEB_APP_ROOTFS/usr/local/lib/web-app-ci/sys-anchor/sysfs"
for WEB_APP_UNIT in docker.service web-app-job.service web-app-validation.service; do
  sed "s/@UID@/$WEB_APP_UID/g" "$WEB_APP_SOURCE/$WEB_APP_UNIT" >"$WEB_APP_ROOTFS/etc/systemd/user/$WEB_APP_UNIT"
  chmod 0644 "$WEB_APP_ROOTFS/etc/systemd/user/$WEB_APP_UNIT"
done
# Remove all baseline setuid/setgid/file-capability privileges.
find "$WEB_APP_ROOTFS" -xdev -type f -perm /6000 -exec chmod a-s {} +
while IFS= read -r WEB_APP_CAP_FILE; do setcap -r "$WEB_APP_CAP_FILE"; done < <(getcap -r "$WEB_APP_ROOTFS" | awk '{print $1}')
# Narrow mapping capabilities preserve the caller UID for ProtectProc=invisible.
chown root:root "$WEB_APP_ROOTFS/usr/bin/newuidmap" "$WEB_APP_ROOTFS/usr/bin/newgidmap"
chmod 0755 "$WEB_APP_ROOTFS/usr/bin/newuidmap" "$WEB_APP_ROOTFS/usr/bin/newgidmap"
setcap cap_setuid=ep "$WEB_APP_ROOTFS/usr/bin/newuidmap"
setcap cap_setgid=ep "$WEB_APP_ROOTFS/usr/bin/newgidmap"
test ! -e "$WEB_APP_BASE/minimal-dev" && test ! -L "$WEB_APP_BASE/minimal-dev"
install -d -m 0755 "$WEB_APP_BASE/minimal-dev" "$WEB_APP_BASE/minimal-dev/net" \
  "$WEB_APP_BASE/minimal-dev/shm" "$WEB_APP_BASE/minimal-dev/mqueue"
for WEB_APP_DEVICE in null zero full random urandom tty net/tun; do
  install -m 0644 /dev/null "$WEB_APP_BASE/minimal-dev/$WEB_APP_DEVICE"
done
ln -s /proc/self/fd "$WEB_APP_BASE/minimal-dev/fd"
ln -s /proc/self/fd/0 "$WEB_APP_BASE/minimal-dev/stdin"
ln -s /proc/self/fd/1 "$WEB_APP_BASE/minimal-dev/stdout"
ln -s /proc/self/fd/2 "$WEB_APP_BASE/minimal-dev/stderr"
rm -f "$WEB_APP_ROOTFS/etc/machine-id"
systemd-machine-id-setup --root="$WEB_APP_ROOTFS"
install -d -m 0755 "/etc/systemd/system/user@$WEB_APP_UID.service.d" "/etc/systemd/system/user-$WEB_APP_UID.slice.d"
cat >"/etc/systemd/system/user-$WEB_APP_UID.slice.d/web-app-ci.conf" <<EOF
[Slice]
MemoryAccounting=yes
MemoryHigh=${WEB_APP_HIGH}M
MemoryMax=${WEB_APP_MAX}M
MemorySwapMax=${WEB_APP_SWAP}M
CPUAccounting=yes
CPUQuota=${WEB_APP_CPU}%
TasksAccounting=yes
TasksMax=$WEB_APP_TASKS
EOF
cat >"/etc/systemd/system/user@$WEB_APP_UID.service.d/web-app-ci.conf" <<EOF
[Unit]
ConditionPathExists=/var/lib/web-app-ci/job/home
ConditionPathExists=/run/netns/web-app-ci
ConditionPathIsMountPoint=$WEB_APP_BASE/proc-witness
ConditionPathIsMountPoint=$WEB_APP_BASE/sys-witness

[Service]
PAMName=
NotifyAccess=main
RootDirectory=$WEB_APP_ROOTFS
WorkingDirectory=/home/web-app-ci
Environment=HOME=/home/web-app-ci
Environment=XDG_RUNTIME_DIR=/run/user/$WEB_APP_UID
Environment=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$WEB_APP_UID/bus
Environment=PATH=/opt/node/bin:/opt/jdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=JAVA_HOME=/opt/jdk
NetworkNamespacePath=/run/netns/web-app-ci
BindPaths=$WEB_APP_BASE/job/home:/home/web-app-ci /run/user/$WEB_APP_UID:/run/user/$WEB_APP_UID
BindPaths=$WEB_APP_BASE/proc-witness:/usr/local/lib/web-app-ci/proc-witness:norbind
BindReadOnlyPaths=$WEB_APP_BASE/sys-witness:/usr/local/lib/web-app-ci/sys-anchor/sysfs:norbind
MountAPIVFS=yes
BindLogSockets=no
ProtectSystem=strict
ProtectHome=no
ProtectControlGroups=private
Delegate=cpu cpuset io memory pids
PrivateMounts=yes
PrivateIPC=yes
PrivatePIDs=no
ProtectProc=invisible
KeyringMode=private
TemporaryFileSystem=/run:mode=0755,size=32M /tmp:mode=1777,size=512M /var/tmp:mode=1777,size=256M /dev/shm:mode=1777,size=256M
# sd_booted() needs only this private empty directory, never host systemd state.
TemporaryFileSystem=/run/systemd/system:ro,mode=0755,size=4K
# RootDirectory auto-binds only the manager's notification datagram socket here.
TemporaryFileSystem=/run/host:ro,mode=0755,size=64K
# Explicit bind outranks MountAPIVFS's host-dev fallback; tmpfs at /dev does not.
BindReadOnlyPaths=$WEB_APP_BASE/minimal-dev:/dev:norbind
BindReadOnlyPaths=/dev/null /dev/zero /dev/full /dev/random /dev/urandom /dev/tty /dev/net/tun
# '+' resolves policy paths inside RootDirectory; bind SOURCE paths stay on host.
ReadOnlyPaths=+/sys +/proc/sys +/proc/irq +/proc/bus
ReadWritePaths=+/home/web-app-ci +/run/user/$WEB_APP_UID +/proc/sys/net
InaccessiblePaths=-+/proc/kcore -+/proc/keys -+/proc/kmsg -+/sys/kernel/debug -+/sys/kernel/security -+/sys/firmware -+/run/host/.os-release-stage
CapabilityBoundingSet=CAP_SETUID CAP_SETGID
AmbientCapabilities=
NoNewPrivileges=no
# These seccomp-backed directives imply NNP and block mapper file capabilities.
PrivateDevices=no
ProtectKernelTunables=no
ProtectKernelModules=no
ProtectKernelLogs=no
ProtectClock=no
ProtectHostname=no
RestrictSUIDSGID=no
RestrictRealtime=no
RestrictAddressFamilies=
RestrictNamespaces=
SystemCallFilter=
SystemCallArchitectures=
MemoryDenyWriteExecute=no
LockPersonality=no
DevicePolicy=closed
DeviceAllow=/dev/net/tun rw
AppArmorProfile=web-app-ci
KillMode=control-group
TimeoutStopSec=45
LimitCORE=0
StandardOutput=null
StandardError=null
EOF
cat >/etc/apparmor.d/web-app-ci <<'AA'
abi <abi/4.0>,
include <tunables/global>
# This profile grants user namespaces only to this whole confined user manager.
# Filesystem/network/cgroup boundaries are root-owned systemd/nft namespaces.
profile web-app-ci flags=(unconfined) {
  userns,
}
AA
apparmor_parser --replace /etc/apparmor.d/web-app-ci
install -m 0644 "$WEB_APP_SOURCE/web-app-ci-controller.service" /etc/systemd/system/
systemctl daemon-reload
python3 /usr/local/lib/web-app-ci/controller.py check-config
echo 'Installation prepared. Controller remains disabled. Run credential-free validation before adding the GitHub PAT or enabling CI.'
