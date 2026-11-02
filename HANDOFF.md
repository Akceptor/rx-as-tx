# Handoff — remote drone control over ZeroTier (design only, no code yet)

## Goal
Two instances of `index.html` on two PCs (joined via ZeroTier):
- PC-A (pilot): gamepad + cockpit UI → sends control to B; shows video/telemetry from B.
- PC-B (ground station near drone): receives control → CRSF over Web Serial → ELRS TX module → drone; sends video (+telemetry) back to A.
User mentioned MAVLink and RTSP as possible protocols.

## Verified state
- Repo clean on `main`, HEAD `bf17ab2` (Cockpit layout with camera feed, settings drawer, staged saves). No changes made this session.
- Files: `index.html` (1010 lines), `joy2crsf.py` (142 lines, standalone pygame→CRSF bridge).
- `index.html` already uses: Web Serial (`navigator.serial.requestPort`, ~L343), Gamepad API (~L635, L795), `getUserMedia` camera feed (~L921–978).
- User confirmed network = ZeroTier (so no NAT/STUN/TURN needed).

## Ruled out
- Tailscale / STUN / TURN — unnecessary, ZeroTier gives flat network.
- Browser-native RTSP or MAVLink-over-UDP — browsers can't do raw UDP/TCP or play RTSP.

## Agreed design (proposed, not yet approved to build)
- Transport: WebRTC between browsers.
  - Control A→B: DataChannel `{ordered:false, maxRetransmits:0}`, binary 16-ch packet @50–100Hz; B builds CRSF with existing code.
  - Video B→A: existing `getUserMedia` stream → `pc.addTrack()`.
  - Telemetry B→A: DataChannel (CRSF telemetry from TX module).
- Signaling: tiny WebSocket relay (Node/Python, ~30 lines) on a ZeroTier IP; or manual SDP paste for first test.
- If video source is RTSP: run MediaMTX on B (RTSP→WebRTC/WHEP).
- If FC speaks MAVLink: serial → Web Serial on B → DataChannel; UDP → needs WS↔UDP bridge. ELRS 3.5+ has MAVLink mode.
- Safety (must-have): B watchdog — no control packet ~250ms → STOP sending CRSF (ELRS RX failsafe → FC failsafe). Never repeat last sticks. Arm gated on fresh link. Auth on signaling server. BVLOS legal caveat; local safety pilot during tests.

## Gotchas (reasoned, unverified on hardware)
- Check `zerotier-cli peers` shows `DIRECT` not `RELAY` (relay adds 100ms+).
- Chrome mDNS-obfuscates host ICE candidates (`.local`) — won't resolve over ZeroTier. Real IPs exposed once page has camera permission (B has it). First thing to check if ICE stalls.
- Web Serial + getUserMedia need secure context → each PC opens page via `http://localhost`, not `http://<zt-ip>`. Page on localhost may connect to `ws://<zt-ip>:port` for signaling.

## Current open question
User hasn't said go ahead with the build yet. Also not yet known: video source type (USB capture vs RTSP), and whether the FC uses MAVLink or only CRSF.

## Next step
1. Ask user: approve build? video source? MAVLink needed?
2. Per user's CLAUDE.md: planning → Agent `model="opus"`; implementation → Agent `model="sonnet"`. Run `programming-workflow` skill first (worktree under `.worktrees/`, never push to main).
3. Build order: role toggle (Pilot/Ground) in `index.html` → signaling server → WebRTC DC + video track → B failsafe watchdog → link RTT/packet-age UI. Est. 300–400 lines.

## Environment
- cwd `/Users/vostapiv/Drones/rx-as-tx`, branch `main`, macOS (darwin), zsh.
- Hardware: ELRS TX module over USB serial (e.g. `/dev/cu.usbserial-0001` per joy2crsf.py docstring), USB gamepad, camera/capture device.
- ZeroTier IPs of A/B: unknown.
