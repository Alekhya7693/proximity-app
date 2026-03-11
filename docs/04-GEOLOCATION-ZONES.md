# PROXIMITY — Geolocation and Zone Logic Design

---

## HYBRID PROXIMITY DETECTION STACK

```
┌─────────────────────────────────────────────────┐
│              PROXIMITY CONFIDENCE               │
│                  SCORING                        │
│                                                 │
│  Layer 1: GPS/OS Location   ──► Base score     │
│  Layer 2: Geofence Status   ──► Adjustment     │
│  Layer 3: Bluetooth LE      ──► Adjustment     │
│  Layer 4: UWB Ranging       ──► Adjustment     │
│                                                 │
│  Output: confidence ∈ [0.0, 1.0]               │
│                                                 │
│  Thresholds:                                    │
│  ├── Discovery eligible:  ≥ 0.4                │
│  ├── Chat eligible:       ≥ 0.5                │
│  └── High confidence:     ≥ 0.8                │
└─────────────────────────────────────────────────┘
```

---

## ZONE SYSTEM

### Zone ID Generation
Zones use geohash encoding at precision level 7.

- Geohash precision 7 ≈ 153m × 153m cells
- Each cell has a unique string ID (e.g., "9q8yyk8")
- User's active zone = their geohash cell

### Discovery Zone (effective radius)
A user's discovery zone includes their cell + all 8 adjacent cells:

```
┌─────┬─────┬─────┐
│ NW  │  N  │ NE  │
├─────┼─────┼─────┤
│  W  │ YOU │  E  │
├─────┼─────┼─────┤
│ SW  │  S  │ SE  │
└─────┴─────┴─────┘
```

This creates an effective discovery area of ~450m × 450m.

### 300m Enforcement
While the geohash grid provides coarse zone membership, actual 300m distance is enforced using Haversine calculation:

```sql
-- PostGIS distance calculation
SELECT *,
  ST_Distance(
    user_a.location::geography,
    user_b.location::geography
  ) as distance_meters
FROM users user_a, users user_b
WHERE ST_DWithin(
  user_a.location::geography,
  user_b.location::geography,
  350  -- 300m + 50m hysteresis buffer
)
```

---

## LOCATION UPDATE STRATEGY

### Foreground Updates
```
Trigger: significant location change
Parameters:
  - Minimum distance: 50 meters
  - Minimum interval: 30 seconds
  - Maximum interval: 5 minutes (force update)
  - Desired accuracy: kCLLocationAccuracyNearestTenMeters (iOS)
                      PRIORITY_BALANCED_POWER_ACCURACY (Android)
```

### Background Updates
```
Strategy: Geofence-based (NOT continuous background location)

Setup:
  - Register 300m geofence around current zone center
  - Monitor for EXIT events
  - On EXIT: send zone transition event to server
  - Re-register geofence at new location

Limits:
  - iOS: max 20 regions monitored
  - Android: max 100 geofences
  - We need only 1 geofence per user at a time

Battery impact: MINIMAL (geofencing is hardware-accelerated on both platforms)
```

### Stale Location Handling
```
if last_location_update > 10 minutes ago:
    mark user as INACTIVE
    remove from discovery feed
    do NOT delete location (keep for hot zone aggregation)

if last_location_update > 30 minutes ago:
    remove from hot zone aggregation

if last_location_update > 24 hours ago:
    clear cached location entirely
```

---

## ZONE SESSION LIFECYCLE

```
State Machine:

[NO_ZONE] → location acquired → [ENTERING_ZONE]
[ENTERING_ZONE] → confirmed (2+ readings in zone) → [ACTIVE_IN_ZONE]
[ACTIVE_IN_ZONE] → location update in zone → [ACTIVE_IN_ZONE] (refresh TTL)
[ACTIVE_IN_ZONE] → geofence exit → [EXITING_ZONE]
[EXITING_ZONE] → re-enter within 2 min → [ACTIVE_IN_ZONE] (hysteresis)
[EXITING_ZONE] → 2 min elapsed → [LEFT_ZONE]
[LEFT_ZONE] → new zone detected → [ENTERING_ZONE] (new zone)
```

### Zone Entry Requirements
- Must have 2 consecutive location readings within the zone (prevents transient GPS spikes)
- Readings must be within 60 seconds of each other
- Location accuracy must be < 100m

### Zone Exit Hysteresis
```
Problem: User near boundary gets flickering zone membership.

Solution: Hysteresis buffer
  - Exit threshold: 350m from zone center (300m + 50m buffer)
  - Re-entry threshold: 300m from zone center (standard)
  - Grace period: 2 minutes after exit before zone session ends
  - This prevents rapid zone-hopping at boundaries
```

---

## PROXIMITY CONFIDENCE SCORING

```python
def compute_proximity_confidence(user_a, user_b):
    """
    Compute how confident we are that two users are
    actually within the intended proximity threshold.
    Returns float 0.0-1.0
    """
    confidence = 0.0

    # Layer 1: GPS Distance (0.0 - 0.6)
    gps_distance = haversine(user_a.location, user_b.location)
    gps_accuracy = max(user_a.location_accuracy, user_b.location_accuracy)

    if gps_distance <= 150:  # well within range
        gps_conf = 0.6
    elif gps_distance <= 300:  # within range
        gps_conf = 0.6 * (300 - gps_distance) / 150
    elif gps_distance <= 350:  # boundary zone
        gps_conf = 0.1
    else:
        gps_conf = 0.0

    # Penalize for poor GPS accuracy
    if gps_accuracy > 50:
        gps_conf *= max(0.3, 1.0 - (gps_accuracy - 50) / 200)

    confidence += gps_conf

    # Layer 2: Geofence Status (+0.0 - +0.2)
    if user_a.zone_id == user_b.zone_id:
        confidence += 0.15
    elif are_adjacent_zones(user_a.zone_id, user_b.zone_id):
        confidence += 0.05

    # Layer 3: Bluetooth LE (Phase 2) (+0.0 - +0.15)
    # if bluetooth_proximity_detected(user_a, user_b):
    #     confidence += 0.15

    # Layer 4: UWB Ranging (Phase 2) (+0.0 - +0.3)
    # if uwb_available(user_a) and uwb_available(user_b):
    #     uwb_distance = get_uwb_range(user_a, user_b)
    #     if uwb_distance is not None and uwb_distance <= 10:
    #         confidence += 0.3
    #     elif uwb_distance is not None and uwb_distance <= 50:
    #         confidence += 0.2

    return min(1.0, confidence)
```

---

## CHAT RADIUS ENFORCEMENT

```python
def check_chat_eligibility(match):
    """
    Determine if a chat should be ACTIVE or LOCKED
    based on current proximity of matched users.
    """
    user_a_loc = get_current_location(match.user_a_id)
    user_b_loc = get_current_location(match.user_b_id)

    if user_a_loc is None or user_b_loc is None:
        # No location data — lock chat
        return ChatStatus.LOCKED

    # Check distance from MATCH LOCATION (not from each other)
    # Both users must be within 300m of where they matched
    dist_a = haversine(user_a_loc, match.match_location)
    dist_b = haversine(user_b_loc, match.match_location)

    confidence = compute_proximity_confidence_to_point(
        user_a_loc, match.match_location, user_a_loc.accuracy
    )

    # Use hysteresis for status transitions
    if match.chat_status == ChatStatus.ACTIVE:
        # Higher threshold to LOCK (prevents flickering)
        if dist_a > 350 or dist_b > 350:
            return ChatStatus.LOCKED
        return ChatStatus.ACTIVE

    elif match.chat_status == ChatStatus.LOCKED:
        # Lower threshold to UNLOCK (standard radius)
        if dist_a <= 300 and dist_b <= 300:
            return ChatStatus.ACTIVE
        return ChatStatus.LOCKED
```

---

## ANTI-SPOOF MEASURES

### GPS Spoofing Detection
```python
def detect_location_spoof(user_id, new_location, timestamp):
    previous = get_last_location(user_id)

    if previous is None:
        return False  # First location, can't verify

    # 1. Velocity check
    distance = haversine(previous.location, new_location)
    time_delta = (timestamp - previous.timestamp).total_seconds()
    velocity_kmh = (distance / 1000) / (time_delta / 3600)

    if velocity_kmh > 300:  # faster than commercial aviation
        flag_suspicious(user_id, "impossible_velocity")
        return True

    # 2. Accuracy anomaly
    if new_location.accuracy == 0:  # perfect accuracy is suspicious
        flag_suspicious(user_id, "zero_accuracy")
        return True

    # 3. IP geolocation coarse check
    ip_location = geolocate_ip(user.ip_address)
    if ip_location and haversine(new_location, ip_location) > 500_000:  # 500km
        flag_suspicious(user_id, "ip_location_mismatch")
        return True

    # 4. Jitter check (spoofed locations often have identical readings)
    recent_locations = get_recent_locations(user_id, count=5)
    if all(loc == new_location for loc in recent_locations):
        flag_suspicious(user_id, "no_natural_jitter")
        return True

    return False
```

### Rate Limiting
- Max 1 location update per 5 seconds
- Max 100 location updates per hour
- Violation triggers 15-minute location processing cooldown

---

## GEOSPATIAL DATABASE DESIGN

### PostGIS Setup
```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table location column
ALTER TABLE users ADD COLUMN location geography(Point, 4326);
CREATE INDEX idx_users_location ON users USING GIST (location);

-- Spatial query for nearby users
SELECT id, display_name,
  ST_Distance(location::geography, ST_MakePoint($lon, $lat)::geography) as distance_m
FROM users
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint($lon, $lat)::geography,
  300  -- meters
)
AND last_active > NOW() - INTERVAL '10 minutes'
AND is_active = true
ORDER BY distance_m ASC;
```

### Redis Geospatial Index (Real-time Cache)
```redis
-- Store user location in Redis geo set
GEOADD proximity:active_users $longitude $latitude $user_id

-- Find nearby users within 300m
GEORADIUS proximity:active_users $longitude $latitude 300 m ASC COUNT 100

-- Get distance between two users
GEODIST proximity:active_users $user_a_id $user_b_id m

-- Expire entries: use separate sorted set with timestamps
ZADD proximity:active_timestamps $timestamp $user_id

-- Cleanup job: remove users inactive > 10 min
ZRANGEBYSCORE proximity:active_timestamps -inf $ten_min_ago
-- For each: ZREM proximity:active_users $user_id
```

**Dual-store Strategy:**
- Redis: real-time nearby queries (sub-10ms)
- PostGIS: durable storage, complex spatial queries, analytics
- On location update: write to BOTH Redis and PostgreSQL
- Feed queries read from Redis first, fall back to PostGIS
