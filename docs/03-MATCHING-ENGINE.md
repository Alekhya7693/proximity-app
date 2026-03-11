# PROXIMITY — Matching Engine Design

---

## OVERVIEW

The matching engine operates in real-time to rank nearby users by compatibility. It must work gracefully from sparse markets (5 users) to dense events (500+ users).

---

## TIERED DISCOVERY STRATEGY

When the user opens the discovery feed, the engine fills it using a tiered waterfall:

```
Tier 1: Exact Nearby Matches
  ├── Within 300m, active in last 10 min
  ├── Same mode
  ├── Pass all hard filters
  └── Score ≥ 40

Tier 2: Good Nearby Matches
  ├── Within 300m, active in last 10 min
  ├── Same mode
  ├── Pass all hard filters
  └── Score 20-39

Tier 3: Recently Active Nearby
  ├── Within 500m (extended radius)
  ├── Active in last 30 min (recently left)
  ├── Same mode
  └── Pass all hard filters

Tier 4: Hot Zone Spillover
  ├── Users from nearest active hot zone
  ├── Within 2km
  ├── Active in last 15 min
  ├── Same mode
  ├── Labeled "Also nearby" in feed
  └── Pass all hard filters
```

**Feed Composition Target:**
- Always show at least 5 profiles (even if mixing tiers)
- Prefer Tier 1 first, then fill with lower tiers
- If total available < 5, show what's available + empty state suggestion

---

## HARD FILTERS

These are binary — profile must pass ALL to be eligible:

```python
def hard_filter(viewer, candidate):
    if candidate.mode != viewer.mode:
        return False
    if candidate.age < 18:
        return False
    if candidate.id in viewer.blocked_ids:
        return False
    if viewer.id in candidate.blocked_ids:
        return False
    if candidate.is_banned:
        return False
    if viewer.gender_preference and candidate.gender not in viewer.gender_preference:
        return False
    if candidate.gender_preference and viewer.gender not in candidate.gender_preference:
        return False
    if candidate.proximity_confidence < 0.4:
        return False
    if already_matched(viewer, candidate) and not re_encounter_eligible(viewer, candidate):
        return False
    if candidate.last_active < now() - timedelta(minutes=10) and tier == 1:
        return False
    return True
```

---

## SOFT SCORING FORMULA

```python
def compute_score(viewer, candidate):
    score = 0.0

    # 1. Shared Interests (0-30 points)
    shared = len(viewer.interests & candidate.interests)
    total = len(viewer.interests | candidate.interests)
    if total > 0:
        jaccard = shared / total
        score += jaccard * 30

    # 2. Vibe Alignment (0-15 points)
    if viewer.active_vibe and candidate.active_vibe:
        if viewer.active_vibe == candidate.active_vibe:
            score += 15  # exact match
        elif same_vibe_category(viewer.active_vibe, candidate.active_vibe):
            score += 8   # compatible

    # 3. Survey Compatibility (0-15 points)
    if viewer.survey_vector and candidate.survey_vector:
        cosine_sim = cosine_similarity(viewer.survey_vector, candidate.survey_vector)
        score += max(0, cosine_sim) * 15

    # 4. Proximity (0-10 points, closer = better)
    distance_m = compute_distance(viewer.location, candidate.location)
    proximity_score = max(0, (300 - distance_m) / 300) * 10
    score += proximity_score

    # 5. Activity Recency (0-10 points)
    minutes_since_active = (now() - candidate.last_active).total_seconds() / 60
    recency_score = max(0, (10 - minutes_since_active) / 10) * 10
    score += recency_score

    # 6. Profile Completeness (0-5 points)
    completeness = compute_completeness(candidate)  # 0.0 - 1.0
    score += completeness * 5

    # 7. Response Likelihood (0-5 points)
    response_rate = candidate.match_response_rate  # historical
    score += response_rate * 5

    # 8. Proximity Confidence (0-5 points)
    score += candidate.proximity_confidence * 5

    # 9. Exploration Bonus (0-5 points)
    if candidate.id not in viewer.seen_profiles:
        score += 3  # never seen bonus
    if candidate.created_at > now() - timedelta(days=7):
        score += 2  # new user bonus

    return round(score, 1)
```

---

## COMPATIBILITY PERCENTAGE

Displayed to users on profile cards.

```python
def display_compatibility(score):
    # Map 0-100 raw score to a 20-99 display range
    # (never show 100%, never show below 20%)
    display = int(20 + (score / 100) * 79)
    return min(99, max(20, display))
```

---

## COLD START LOGIC

For new users with minimal data:

```
Problem: New user has no swipe history, no survey answers,
         possibly few interests selected.

Solution:
1. Weight "Exploration Bonus" higher (+10 instead of +5) for first 50 swipes
2. Show new users to others more frequently (new user boost in feed)
3. Trigger first survey after 3rd session (not immediately)
4. Use interest overlap as primary signal until survey data exists
5. Show broader radius (Tier 2-3) more aggressively
6. After 10 swipes, start incorporating implicit preferences:
   - If user swipes right on mostly "Outdoors" interests → boost Outdoors profiles
   - Track swipe patterns per interest tag
```

---

## SPARSE MARKET LOGIC

When few users are nearby:

```
active_count = count_active_users_nearby(viewer, radius=300m)

if active_count >= 10:
    # Normal operation — Tier 1 primary
    feed = tier_1_results

elif active_count >= 5:
    # Moderate — mix Tier 1 + Tier 2
    feed = tier_1_results + tier_2_results

elif active_count >= 2:
    # Sparse — all tiers + extend radius
    feed = tier_1 + tier_2 + tier_3_results  # 500m, 30 min

elif active_count == 1:
    # Very sparse — show Tier 3 + Tier 4
    feed = tier_3_results + tier_4_results
    show_suggestion("Check out active areas nearby", hot_zones)

elif active_count == 0:
    # Empty — show only suggestions
    feed = []
    show_empty_state(nearest_hot_zones, suggested_times)
```

---

## EVENT DENSITY LOGIC (Phase 2)

When an area has unusually high density (conference, event):

```
if active_count_in_zone > 50:
    # Event-like density detected
    # Increase hard filter strictness to prevent overwhelm
    # Reduce feed size to top 30 matches
    # Show event badge
    # Allow vibe-based sub-filtering
    # Increase survey weight for better differentiation
```

---

## REPUTATION / TRUST INTEGRATION

Trust score affects visibility but NOT compatibility score:

```python
def apply_trust_modifier(candidates, viewer):
    for c in candidates:
        if c.trust_score < 30:
            c.eligible = False  # suspended
        elif c.trust_score < 50:
            c.feed_priority -= 20  # deprioritized
        elif c.trust_score < 70:
            c.feed_priority -= 5   # slightly deprioritized
    return candidates
```

---

## EMPTY STATE HANDLING

```
Priority cascade for empty/near-empty feeds:

1. "No one nearby right now"
   → Show nearest hot zone with count and distance
   → "~8 people active 400m away at Central Park"

2. "Expand your radius?"
   → Offer to temporarily show users within 500m

3. "Active times near you"
   → Show historical activity patterns for the area
   → "This area is usually active between 12pm-2pm"

4. "Adjust your filters?"
   → If filters are very restrictive, suggest broadening

5. "You've seen everyone nearby"
   → "Check back in a bit — new people arrive all the time"
```

---

## RECOMMENDATION EXPLANATION (Phase 2)

Optionally show why a profile was recommended:

```
"You both enjoy Hiking and Coffee Chats"
"Similar professional interests in Tech and Startups"
"You're both in Networking mode right now"
```

Implementation: generate explanation from top 2 scoring signals.

---

## RE-ENCOUNTER LOGIC

When two users who previously matched encounter each other again:

```
Scenario: User A and User B matched 5 days ago. Chat expired.
          Now they're in the same zone again.

Rules:
1. If chat was ACTIVE and EXPIRED (time-based):
   → They can appear in each other's feed again after 7 days
   → New swipe cycle required
   → New match creates new chat

2. If User A was BLOCKED by User B:
   → Never show again (hard filter)

3. If match was PENDING (neither said hi) and EXPIRED:
   → Eligible for re-encounter after 3 days

4. If User A PASSED on User B:
   → Don't show in same zone for 24 hours
   → May appear in different zone immediately
```

---

## ALGORITHM PERFORMANCE REQUIREMENTS

| Metric | Target |
|--------|--------|
| Feed generation latency | < 200ms p95 |
| Scoring per candidate | < 1ms |
| Maximum candidates evaluated | 500 per request |
| Cache hit rate for interests | > 90% |
| Feed refresh cadence | On pull-to-refresh + every 60 seconds |

**Optimization Strategy:**
1. Pre-compute interest vectors and cache in Redis
2. Use PostGIS spatial index for geographic queries
3. Cache feed results per user for 30 seconds
4. Background job to pre-compute survey vectors every 5 minutes
5. Denormalize commonly-queried fields into a "feed_profiles" materialized view
