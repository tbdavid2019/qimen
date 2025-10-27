#!/usr/bin/env python3
import math
import os
import struct
import zlib

VIEWBOX_MIN = -40.0
VIEWBOX_SIZE = 80.0
OUTER_RADIUS = 39.0
WHITE_PATH_ARC_STEPS = 384
SUBPIXEL_SAMPLES = (0.25, 0.75)


def arc_points(x1, y1, rx, ry, phi_deg, large_arc, sweep, dx, dy):
    phi = math.radians(phi_deg)
    cos_phi = math.cos(phi)
    sin_phi = math.sin(phi)
    x2 = x1 + dx
    y2 = y1 + dy

    dx2 = (x1 - x2) / 2.0
    dy2 = (y1 - y2) / 2.0
    x1p = cos_phi * dx2 + sin_phi * dy2
    y1p = -sin_phi * dx2 + cos_phi * dy2

    rx_abs = abs(rx)
    ry_abs = abs(ry)
    if rx_abs == 0 or ry_abs == 0:
        return [(x1, y1), (x2, y2)]

    lam = (x1p * x1p) / (rx_abs * rx_abs) + (y1p * y1p) / (ry_abs * ry_abs)
    if lam > 1:
        scale = math.sqrt(lam)
        rx_abs *= scale
        ry_abs *= scale

    sign = -1 if large_arc == sweep else 1
    numerator = (rx_abs * rx_abs) * (ry_abs * ry_abs) - (rx_abs * rx_abs) * (y1p * y1p) - (ry_abs * ry_abs) * (x1p * x1p)
    denom = (rx_abs * rx_abs) * (y1p * y1p) + (ry_abs * ry_abs) * (x1p * x1p)
    denom = max(denom, 1e-12)
    factor = sign * math.sqrt(max(0.0, numerator / denom))
    cxp = factor * (rx_abs * y1p) / ry_abs
    cyp = factor * (-ry_abs * x1p) / rx_abs

    cx = cos_phi * cxp - sin_phi * cyp + (x1 + x2) / 2.0
    cy = sin_phi * cxp + cos_phi * cyp + (y1 + y2) / 2.0

    def angle(u, v):
        dot = u[0] * v[0] + u[1] * v[1]
        det = u[0] * v[1] - u[1] * v[0]
        return math.atan2(det, dot)

    vector_u = ((x1p - cxp) / rx_abs, (y1p - cyp) / ry_abs)
    vector_v = ((-x1p - cxp) / rx_abs, (-y1p - cyp) / ry_abs)
    theta1 = angle((1.0, 0.0), vector_u)
    delta_theta = angle(vector_u, vector_v)

    if not sweep and delta_theta > 0:
        delta_theta -= 2.0 * math.pi
    elif sweep and delta_theta < 0:
        delta_theta += 2.0 * math.pi

    points = []
    for step in range(WHITE_PATH_ARC_STEPS + 1):
        t = step / WHITE_PATH_ARC_STEPS
        theta = theta1 + delta_theta * t
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        x = cos_phi * rx_abs * cos_t - sin_phi * ry_abs * sin_t + cx
        y = sin_phi * rx_abs * cos_t + cos_phi * ry_abs * sin_t + cy
        points.append((x, y))
    return points


def build_white_polygon():
    segments = []
    x, y = 0.0, 38.0
    for rx, ry, phi, large, sweep, dx, dy in (
        (38.0, 38.0, 0.0, 0, 1, 0.0, -76.0),
        (19.0, 19.0, 0.0, 0, 1, 0.0, 38.0),
        (19.0, 19.0, 0.0, 0, 0, 0.0, 38.0),
    ):
        pts = arc_points(x, y, rx, ry, phi, large, sweep, dx, dy)
        segments.extend(pts[:-1])
        x += dx
        y += dy
    segments.append((0.0, 38.0))
    return segments


WHITE_POLYGON = build_white_polygon()


def point_in_polygon(x, y, polygon):
    inside = False
    n = len(polygon)
    for i in range(n):
        x1, y1 = polygon[i]
        x2, y2 = polygon[(i + 1) % n]
        intersects = ((y1 > y) != (y2 > y)) and (
            x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-12) + x1
        )
        if intersects:
            inside = not inside
    return inside


def evaluate_point(x, y):
    if (x * x + y * y) > OUTER_RADIUS * OUTER_RADIUS:
        return 0, 0, 0, 0

    r, g, b = 0, 0, 0
    if point_in_polygon(x, y, WHITE_POLYGON):
        r = g = b = 255

    if (x * x + (y - 19.0) * (y - 19.0)) <= 25.0:
        r = g = b = 255

    if (x * x + (y + 19.0) * (y + 19.0)) <= 25.0:
        r = g = b = 0

    return r, g, b, 255


def rgba_bytes(size):
    scale = VIEWBOX_SIZE / size
    total_samples = len(SUBPIXEL_SAMPLES) ** 2
    rows = bytearray()
    for j in range(size):
        rows.append(0)
        for i in range(size):
            sum_r = sum_g = sum_b = sum_a = 0
            for sx in SUBPIXEL_SAMPLES:
                for sy in SUBPIXEL_SAMPLES:
                    x = VIEWBOX_MIN + (i + sx) * scale
                    y = VIEWBOX_MIN + (j + sy) * scale
                    r, g, b, a = evaluate_point(x, y)
                    sum_r += r * a
                    sum_g += g * a
                    sum_b += b * a
                    sum_a += a
            alpha = round(sum_a / total_samples)
            if alpha:
                r = round(sum_r / sum_a)
                g = round(sum_g / sum_a)
                b = round(sum_b / sum_a)
            else:
                r = g = b = 0
            rows.extend((r, g, b, alpha))
    return bytes(rows)


def png_bytes(size):
    raw = rgba_bytes(size)
    compressor = zlib.compressobj(level=9)
    compressed = compressor.compress(raw) + compressor.flush()

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return header + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")


def write_png(path, size):
    with open(path, "wb") as fh:
        fh.write(png_bytes(size))


def write_favicon(path, sizes):
    images = []
    for size in sizes:
        data = png_bytes(size)
        images.append((size, data))
    header = struct.pack("<HHH", 0, 1, len(images))
    directory = bytearray()
    offset = 6 + 16 * len(images)
    blobs = bytearray()
    for size, data in images:
        entry = struct.pack(
            "<BBBBHHII",
            size if size < 256 else 0,
            size if size < 256 else 0,
            0,
            0,
            1,
            32,
            len(data),
            offset,
        )
        directory.extend(entry)
        blobs.extend(data)
        offset += len(data)
    with open(path, "wb") as fh:
        fh.write(header)
        fh.write(directory)
        fh.write(blobs)


def main():
    output_dir = os.path.join(os.path.dirname(__file__), "..", "public")
    targets = {
        "android-chrome-512x512.png": 512,
        "android-chrome-192x192.png": 192,
        "apple-touch-icon.png": 180,
        "favicon-32x32.png": 32,
        "favicon-16x16.png": 16,
    }
    for name, size in targets.items():
        write_png(os.path.join(output_dir, name), size)
    write_favicon(os.path.join(output_dir, "favicon.ico"), [32, 16])


if __name__ == "__main__":
    main()
