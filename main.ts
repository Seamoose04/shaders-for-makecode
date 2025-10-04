namespace Shaders {
    const exampleShader: Shader = (frag, u) => {
        const x = frag.x / u.resolution.x;
        const y = frag.y / u.resolution.y;

        const v = Math.sin(x * 10 + u.time) + Math.cos(y * 10 - u.time);
        return v > 0 ? 0.2 : 0.8;
    };

    const plasmaShader: Shaders.Shader = (frag, u) => {
        // normalize coordinates
        const nx = frag.x / u.resolution.x;
        const ny = frag.y / u.resolution.y;

        // combine multiple sine waves
        const w =
            Math.sin(nx * 10 + u.time) +
            Math.sin((ny * 10) + u.time * 1.3) +
            Math.sin((nx + ny) * 10 + u.time * 0.7);

        // normalize to 0..1
        const normalized = (w + 3) / 6;

        // map to grayscale shade (1–15)
        return normalized;
    };

    const rippleShader: Shaders.Shader = (frag, u) => {
        const cx = frag.x - u.resolution.x / 2;
        const cy = frag.y - u.resolution.y / 2;
        const dist = Math.sqrt(cx * cx + cy * cy);

        const a = Math.sin(dist * 0.1 - u.time * 2);
        const normalized2 = (a + 1) / 2;

        return normalized2;
    };

    const tunnelShader: Shaders.Shader = (frag, u) => {
        const nx2 = (frag.x - u.resolution.x / 2) / u.resolution.x;
        const ny2 = (frag.y - u.resolution.y / 2) / u.resolution.y;

        const angle = Math.atan2(ny2, nx2);
        const dist2 = Math.sqrt(nx2 * nx2 + ny2 * ny2);

        const b = Math.sin(10 * dist2 - u.time * 3 + angle * 5);
        return (b + 1) / 2;
    };

    const checkerShader: Shaders.Shader = (frag, u) => {
        const scale = Math.clamp(1, 100, Math.abs(100 * Math.sin(u.time / 5)));

        const c = (Math.floor(frag.x / scale) + Math.floor(frag.y / scale)) % 2;
        return c ? 1.0 : 0.0;
    };

    const circlesShader: Shaders.Shader = (frag, u) => {
        const cx2 = u.resolution.x / 2 + Math.sin(u.time) * 40;
        const cy2 = u.resolution.y / 2 + Math.cos(u.time) * 30;

        const dx = frag.x - cx2;
        const dy = frag.y - cy2;
        const dist3 = Math.sqrt(dx * dx + dy * dy);

        const d = Math.sin(dist3 * 0.2 - u.time * 2);
        return (d + 1) / 2;
    };

    const marbleShader: Shaders.Shader = (frag, u) => {
        const nx3 = frag.x / u.resolution.x;
        const ny3 = frag.y / u.resolution.y;

        const e = Math.sin(nx3 * 10 + Math.sin(ny3 * 10 + u.time));
        return (e + 1) / 2;
    };

    const marbleWithWobble: Shaders.Shader = (frag, u) => {
        // normalized UVs 0..1
        let uvx = frag.x / u.resolution.x;
        let uvy = frag.y / u.resolution.y;

        // warp Y coordinate
        uvy += Math.sin(uvx * 10.0 + u.time) * 0.05;

        // base marble pattern
        const f = Math.sin(uvx * 10.0 + Math.sin(uvy * 10.0 + u.time));

        // GLSL does (v + 1)/2 to map -1..1 → 0..1
        return (f + 1.0) * 0.5;
    };

    function rippleWarp(frag: Shaders.Vec2, u: Shaders.Uniforms): Shaders.Vec2 {
        // center coords
        const cx3 = frag.x - u.resolution.x / 2;
        const cy3 = frag.y - u.resolution.y / 2;
        const dist4 = Math.sqrt(cx3 * cx3 + cy3 * cy3);

        // ripple parameters
        const freq = 0.1;     // wave spacing
        const speed = 4.0;    // animation speed
        const baseAmp = 0.05; // base amplitude

        // damping: amplitude decays with distance
        const damping = 1.0 / (1.0 + dist4 * 0.01); // tweak factor

        const offset = Math.sin(dist4 * freq - u.time * speed) * baseAmp * damping;

        // normalized UVs
        const uvx2 = frag.x / u.resolution.x;
        let uvy2 = frag.y / u.resolution.y;

        // apply vertical ripple distortion
        uvy2 += offset;

        return new Shaders.Vec2(uvx2, uvy2);
    }

    const marbleWithRipple: Shaders.Shader = (frag, u) => {
        // ripple-distorted UVs
        const uv = rippleWarp(frag, u);

        // marble pattern
        const g = Math.sin(uv.x * 10.0 + Math.sin(uv.y * 10.0 + u.time));

        // normalize to 0..1
        return (g + 1.0) * 0.5;
    };

    // Checkerboard + radial ripple (UV warp) + brightness shimmer
    // Phases for warp and shimmer are split so you can tune alignment.

    const checkerWithRipple: Shaders.Shader = (frag, u) => {
        // --- 1. Distance from screen center ---
        const dx2 = frag.x - u.resolution.x / 2;
        const dy2 = frag.y - u.resolution.y / 2;
        const dist5 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        // --- 2. Base ripple parameters ---
        const freq2 = 0.12;                   // ripple spacing
        const speed2 = 3.0;                   // animation speed
        const damping2 = 1.0 / (1.0 + dist5 * 0.06);
        const phase = dist5 * freq2 - u.time * speed2;

        // --- 3. Warp the UVs (position ripple) ---
        const uvx3 = frag.x / u.resolution.x;
        let uvy3 = frag.y / u.resolution.y;

        const warpAmp = 0.05;
        const wave = Math.sin(phase);
        uvy3 += wave * warpAmp * damping2;

        // --- 4. Checkerboard pattern (sampled at warped UVs) ---
        const tiles = 10;
        const tx = Math.floor(uvx3 * tiles);
        const ty = Math.floor(uvy3 * tiles);
        const isWhite = ((tx + ty) & 1) ? 1 : 0;

        const baseBlack = 0.1;
        const baseWhite = 0.9;
        const base = isWhite ? baseWhite : baseBlack;

        // --- 5. Recalculate radial distance *after* warp ---
        const dx22 = frag.x - u.resolution.x / 2;
        const dy22 = (uvy3 * u.resolution.y) - u.resolution.y / 2;
        const distWarped = Math.sqrt(dx22 * dx22 + dy22 * dy22);

        // --- 6. Shimmer based on warped radial distance ---
        const shimmerPhase = distWarped * freq2 - u.time * speed2;
        const shimmer = Math.sin(shimmerPhase) * 0.5 * damping2;

        // --- 7. Combine and clamp ---
        let L = base + shimmer;
        if (L < 0) L = 0;
        if (L > 1) L = 1;

        return L;
    };

    interface Ripple {
        origin: Shaders.Vec2;
        startTime: number;

        // precomputed each frame
        age?: number;
        waveDist?: number;
    }

    let ripples: Ripple[] = [];

    browserEvents.MouseLeft.onEvent(browserEvents.MouseButtonEvent.Pressed, function(x: number, y: number) {
        ripples.push({
            origin: new Shaders.Vec2(x, y),
            startTime: game.runtime() / 1000
        });
    })

    game.onUpdate(() => {
        const now = game.runtime() / 1000;
        ripples = ripples.filter(r => now - r.startTime < 5); // keep last 5s

        // precompute per-ripple values once per frame
        for (const r of ripples) {
            r.age = now - r.startTime;
            r.waveDist = r.age * 40; // speed in px/sec
        }
    });

    function rippleContribution(frag: Shaders.Vec2, r: Ripple): number {
        const dx3 = frag.x - r.origin.x;
        const dy3 = frag.y - r.origin.y;
        const dist22 = dx3 * dx3 + dy3 * dy3;

        const dist6 = Math.sqrt(dist22); // one sqrt only if near the ripple
        const diff = dist6 - (r.waveDist || 0);

        // cull if pixel is far from wavefront
        if (Math.abs(diff) > 40) return 0;

        // simple triangular falloff instead of exp()
        const ring = Math.max(0, 1 - Math.abs(diff) * 0.05);

        // cheap oscillation (precompute freq/speed if needed)
        return Math.sin(dist6 * 0.25 - (r.age || 0) * 4) * ring * 0.5;
    }

    const checkerWithRippleClick: Shaders.Shader = (frag, u) => {
        // --- Checkerboard base ---
        const uvx4 = frag.x / u.resolution.x;
        const uvy4 = frag.y / u.resolution.y;
        const scale2 = 10;
        const tx2 = Math.floor(uvx4 * scale2);
        const ty2 = Math.floor(uvy4 * scale2);
        const isWhite2 = ((tx2 + ty2) & 1) ? 1 : 0;
        const base2 = isWhite2 ? 0.9 : 0.1;

        // --- Accumulate ripple contributions ---
        let rippleSum = 0;
        for (let i = 0; i < ripples.length; i++) {
            rippleSum += rippleContribution(frag, ripples[i]);
        }

        // combine (tune ripple strength)
        let L2 = base2 + rippleSum;

        // clamp
        if (L2 < 0) L2 = 0;
        if (L2 > 1) L2 = 1;

        return L2;
    };

    // initDefaults()
    // setActiveProgram((uniforms, screen) => {
    //     runShader(checkerWithRippleClick, screen, uniforms);
    // })
}
