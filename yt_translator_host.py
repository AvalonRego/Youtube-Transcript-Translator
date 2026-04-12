#!/home/avalon-rego/libretranslate-env/bin/python

import sys
import json
import struct
import subprocess
import threading
import time
import os
import signal
import logging

logging.basicConfig(
    filename=os.path.expanduser('/home/avalon-rego/TTE/yt_translator.log'),
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(message)s'
)

def read_message():
    try:
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            logging.error("stdin returned empty — exiting")
            return None
        logging.debug(f"Raw length bytes: {raw_length}")
        length = struct.unpack('=I', raw_length)[0]
        logging.debug(f"Message length: {length}")
        message = sys.stdin.buffer.read(length)
        logging.debug(f"Raw message: {message}")
        return json.loads(message.decode('utf-8'))
    except Exception as e:
        logging.error(f"read_message error: {e}")
        return None

lt_process = None

def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(length)
    return json.loads(message.decode('utf-8'))

def send_message(message):
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('=I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def kill_port_5000():
    try:
        result = subprocess.run(
            ['fuser', '-k', '5000/tcp'],
            capture_output=True
        )
        if result.returncode == 0:
            logging.info("Killed existing process on port 5000")
            time.sleep(1)
    except Exception as e:
        logging.warning(f"Could not kill port 5000: {e}")

def start_libretranslate():
    global lt_process
    logging.info("Starting LibreTranslate")
    kill_port_5000()

    lt_process = subprocess.Popen(
    [
        '/home/avalon-rego/libretranslate-env/bin/libretranslate',
        '--load-only', 'en,de',
        '--port', '5000'
    ],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
    )
    time.sleep(2)
    logging.info(f"LibreTranslate process started with PID: {lt_process.pid}")
    if lt_process.poll() is not None:
        logging.error(f"LibreTranslate died immediately with code: {lt_process.returncode}")
        # Read any output
        out, err = lt_process.communicate()
        logging.error(f"stdout: {out.decode('utf-8', errors='replace')}")
        logging.error(f"stderr: {err.decode('utf-8', errors='replace')}")
        send_message({ "status": "error", "message": "LibreTranslate died immediately" })
        return

    def drain(stream, label):
        for line in stream:
            logging.debug(f"LT {label}: {line.decode('utf-8', errors='replace').strip()}")

    threading.Thread(target=drain, args=(lt_process.stdout, 'stdout'), daemon=True).start()
    threading.Thread(target=drain, args=(lt_process.stderr, 'stderr'), daemon=True).start()

    # Poll until LibreTranslate responds
    import urllib.request
    logging.info("Waiting for LibreTranslate to be ready...")
    for i in range(60):  # wait up to 60 seconds
        time.sleep(2)
        if lt_process.poll() is not None:
            logging.error("LibreTranslate process died")
            send_message({ "status": "error", "message": "LibreTranslate process died" })
            return
        try:
            urllib.request.urlopen('http://localhost:5000/languages', timeout=2)
            logging.info("LibreTranslate is ready")
            send_message({ "status": "ready" })
            return
        except Exception:
            logging.debug(f"Waiting... attempt {i+1}")
            continue

    logging.error("LibreTranslate timed out")
    send_message({ "status": "error", "message": "LibreTranslate timed out after 120 seconds" })

def stop_libretranslate():
    global lt_process
    if lt_process:
        logging.info("Stopping LibreTranslate")
        lt_process.terminate()
        try:
            lt_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            lt_process.kill()
        lt_process = None
        logging.info("LibreTranslate stopped")
    kill_port_5000()

def main():
    logging.info("Native host started")
    while True:
        message = read_message()
        if message is None:
            logging.info("stdin closed — exiting")
            stop_libretranslate()
            break

        logging.info(f"Received message: {message}")

        if message.get('cmd') == 'start':
            threading.Thread(target=start_libretranslate, daemon=True).start()
        elif message.get('cmd') == 'stop':
            stop_libretranslate()
            send_message({ "status": "stopped" })

if __name__ == '__main__':
    main()