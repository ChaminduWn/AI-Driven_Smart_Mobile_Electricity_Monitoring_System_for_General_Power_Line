import socket
def check_port(port):
    try:
        s = socket.socket(socket.socket.AF_INET, socket.socket.SOCK_STREAM)
        s.bind(('0.0.0.0', port))
        s.listen(1)
        s.close()
        print(f"Port {port} is AVAILABLE")
    except Exception as e:
        print(f"Port {port} is BLOCKED: {e}")

for p in [5000, 5001, 5002, 8000, 8001, 8002, 8003, 8080]:
    check_port(p)
