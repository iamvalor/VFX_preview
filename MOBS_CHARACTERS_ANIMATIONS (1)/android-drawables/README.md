# Drawable Icons — Game HUD & UI

20 `VectorDrawable` XML assets for the icon set defined in **HUD & Icons.html**.
All icons share a 64-unit viewport; default render size is **24dp** (override via
`android:layout_width` on the host `ImageView` or by setting size in Compose).

---

## Files

### Stats (10) — used in PauseStatsPanel, upgrade tooltips
| Drawable | Field |
|---|---|
| `ic_stat_health.xml`        | HP heart — `state.playerHp` |
| `ic_stat_stamina.xml`       | Stamina bolt — `state.playerStamina` |
| `ic_stat_damage.xml`        | Sword — `s.bonusDamagePercent` |
| `ic_stat_attack_speed.xml`  | Rapid slash — `s.bonusAttackSpeedPercent` |
| `ic_stat_move_speed.xml`    | Boot — `s.moveSpeed` |
| `ic_stat_pickup.xml`        | Magnet — `s.pickupRadius` |
| `ic_stat_crit_chance.xml`   | Target — `s.critChancePercent` |
| `ic_stat_crit_damage.xml`   | Star — `s.critDamagePercent` |
| `ic_stat_xp_bonus.xml`      | Crystal — `s.bonusXpPercent` |
| `ic_stat_dodge.xml`         | Dash chevrons — `s.dodgeChancePercent` |

### Weapons (8) — used in WeaponSlotsRow + UpgradeCard
| Drawable | Maps to `WeaponType` |
|---|---|
| `ic_wpn_greatsword.xml` | `PROTOCOL_HOLLOW` |
| `ic_wpn_needle.xml`     | `NEEDLE_DLL` |
| `ic_wpn_beam.xml`       | `GHOST_BEAM` |
| `ic_wpn_pulse.xml`      | `ECHO_WALL` |
| `ic_wpn_hex.xml`        | `PLAGUE_EXE` |
| `ic_wpn_stack.xml`      | `STACK_OVERFLOW` |
| `ic_wpn_chain.xml`      | `BLOOD_HEX` |
| `ic_wpn_dagger.xml`     | `PHANTOM_DAGGER` |

### Pickups (2) — reference-only
| Drawable | Note |
|---|---|
| `ic_pickup_xp.xml`   | XP orb — actual gameplay drawing is in `WorldCanvas` |
| `ic_pickup_soul.xml` | Soul flame — actual gameplay drawing is in `WorldCanvas` |

---

## Glow caveat

`VectorDrawable` cannot express a Gaussian-blur drop-shadow. The cyberpunk
neon glow in the design spec must be applied **at composition time**, not in
the drawable. Two reliable options:

**A) Compose Canvas (recommended for HUD)**
```kotlin
val image = ImageVector.vectorResource(R.drawable.ic_stat_health)
val painter = rememberVectorPainter(image)
Box(Modifier.size(28.dp)) {
    // 1. Glow layer (under)
    Image(
        painter,
        contentDescription = null,
        modifier = Modifier
            .matchParentSize()
            .blur(6.dp, BlurredEdgeTreatment.Unbounded)
            .alpha(0.6f)
    )
    // 2. Crisp icon on top
    Image(painter, contentDescription = null, modifier = Modifier.matchParentSize())
}
```

**B) Native `Paint`**
```kotlin
drawIntoCanvas { c ->
    c.nativeCanvas.drawPath(p, Paint().apply {
        setShadowLayer(8f, 0f, 0f, glowColor.toArgb())
        strokeWidth = 2.5f * scale
        style = Paint.Style.STROKE
    })
}
```

---

## Sizes used in HUD (from spec)

- Stat-bar leading icon: **22dp**
- Weapon slot: **30dp** (inside a 46dp slot)
- Upgrade slot indicator: **14dp** (inside a 22dp slot)
- Pause-panel stat row: **18dp**
- Dodge button center: **44dp**

All icons remain legible at 16dp and below thanks to single-stroke silhouettes.

---

## Drop-in location

Copy into `app/src/main/res/drawable/`. Compose:

```kotlin
Icon(
    painter = painterResource(R.drawable.ic_stat_health),
    contentDescription = "HP",
    tint = Color(0xFFFF3333), // optional — colors are baked in
)
```

Stat icons ship with their semantic color baked into the path. To re-tint
(e.g. dim-out when stat is 0), set `android:tint="#80FFFFFF"` on the
`<vector>` root or use `tint =` in Compose.
