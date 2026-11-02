#!/usr/bin/env python3
"""Stream USB joystick to an ELRS TX module as CRSF RC channel frames.

pip install pyserial pygame
python joy2crsf.py --list                 # show axes/buttons live, to build mapping
python joy2crsf.py -p /dev/cu.usbserial-0001
"""
import argparse
import os
import sys
import time

os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")
import pygame
import serial

CRSF_SYNC = 0xC8
CRSF_TYPE_RC = 0x16
CRSF_MIN, CRSF_MID, CRSF_MAX = 172, 992, 1811  # 988us / 1500us / 2012us

# Channel -> source. ("axis", idx, invert) | ("button", idx) | ("switch3", btn_low, btn_high) | ("const", value)
# Default AETR. Run --list and edit to match your stick.
MAPPING = [
    ("axis", 0, False),     # ch1 roll / aileron
    ("axis", 1, False),     # ch2 pitch / elevator
    ("axis", 2, False),     # ch3 throttle
    ("axis", 3, False),     # ch4 yaw / rudder
    ("axis", 5, False),     # ch5 AUX1 = ARM (ELRS expects arm on ch5)
    ("axis", 6, False),     # ch6 AUX2 = flight mode
]


def crc8_dvb_s2(data: bytes) -> int:
    crc = 0
    for b in data:
        crc ^= b
        for _ in range(8):
            crc = ((crc << 1) ^ 0xD5) & 0xFF if crc & 0x80 else (crc << 1) & 0xFF
    return crc


def rc_frame(channels: list[int]) -> bytes:
    bits = 0
    for i, ch in enumerate(channels[:16] + [CRSF_MID] * (16 - len(channels))):
        bits |= (max(CRSF_MIN, min(CRSF_MAX, ch)) & 0x7FF) << (11 * i)
    payload = bytes([CRSF_TYPE_RC]) + bits.to_bytes(22, "little")
    return bytes([CRSF_SYNC, len(payload) + 1]) + payload + bytes([crc8_dvb_s2(payload)])


def axis_to_crsf(v: float, invert: bool) -> int:
    if invert:
        v = -v
    return round(CRSF_MID + v * (CRSF_MAX - CRSF_MID if v >= 0 else CRSF_MID - CRSF_MIN))


def read_channels(js) -> list[int]:
    out = []
    for src in MAPPING:
        kind = src[0]
        if kind == "axis":
            out.append(axis_to_crsf(js.get_axis(src[1]), src[2]) if src[1] < js.get_numaxes() else CRSF_MID)
        elif kind == "button":
            pressed = src[1] < js.get_numbuttons() and js.get_button(src[1])
            out.append(CRSF_MAX if pressed else CRSF_MIN)
        elif kind == "switch3":
            lo = src[1] < js.get_numbuttons() and js.get_button(src[1])
            hi = src[2] < js.get_numbuttons() and js.get_button(src[2])
            out.append(CRSF_MAX if hi else CRSF_MIN if lo else CRSF_MID)
        else:
            out.append(src[1])
    return out


def open_joystick(index: int):
    pygame.init()
    pygame.joystick.init()
    if pygame.joystick.get_count() <= index:
        sys.exit(f"No joystick #{index} (found {pygame.joystick.get_count()})")
    js = pygame.joystick.Joystick(index)
    js.init()
    print(f"Joystick: {js.get_name()}  axes={js.get_numaxes()} buttons={js.get_numbuttons()} hats={js.get_numhats()}")
    return js


def list_mode(js):
    try:
        while True:
            pygame.event.pump()
            axes = " ".join(f"a{i}:{js.get_axis(i):+.2f}" for i in range(js.get_numaxes()))
            btns = "".join(str(js.get_button(i)) for i in range(js.get_numbuttons()))
            print(f"\r{axes}  btn:{btns}   ", end="", flush=True)
            time.sleep(0.05)
    except KeyboardInterrupt:
        print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-p", "--port", default="/dev/cu.usbserial-0001")
    ap.add_argument("-b", "--baud", type=int, default=115200, help="must match module's CRSF/UART baud")
    ap.add_argument("-r", "--rate", type=int, default=250, help="frames per second")
    ap.add_argument("-j", "--joystick", type=int, default=0)
    ap.add_argument("--list", action="store_true", help="print live joystick values and exit")
    args = ap.parse_args()

    js = open_joystick(args.joystick)
    if args.list:
        return list_mode(js)

    ser = serial.Serial(args.port, args.baud, timeout=0)
    period = 1.0 / args.rate
    next_t = time.perf_counter()
    last_print = 0.0
    print(f"Streaming CRSF to {args.port} @ {args.baud} baud, {args.rate} Hz. Ctrl+C to stop.")
    try:
        while True:
            pygame.event.pump()
            if not js.get_init() or pygame.joystick.get_count() == 0:
                # Stop sending so the ELRS link drops into failsafe instead of holding stale sticks.
                sys.exit("Joystick lost — stopped sending.")
            ch = read_channels(js)
            ser.write(rc_frame(ch))
            ser.read(ser.in_waiting or 0)  # drain telemetry so the RX buffer never fills

            now = time.perf_counter()
            if now - last_print > 0.1:
                print("\r" + " ".join(f"{c:4d}" for c in ch), end="", flush=True)
                last_print = now
            next_t += period
            delay = next_t - time.perf_counter()
            if delay > 0:
                time.sleep(delay)
            else:
                next_t = time.perf_counter()
    except KeyboardInterrupt:
        print()
    finally:
        ser.close()


if __name__ == "__main__":
    main()
