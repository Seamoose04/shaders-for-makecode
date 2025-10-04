namespace WaterSim {
    export const GW = 60;
    export const GH = 45;
    const FP = 256;

    // Damping
    const DAMP_NUM = 230;
    const DAMP_SHIFT = 8;

    // Pre-allocate buffers as plain number[] with fixed size
    const SIZE = GW * GH;
    let A: number[] = [];
    let B: number[] = [];
    let C: number[] = [];

    // Manual initialization (no `new Array`)
    export function init() {
        A = [];
        B = [];
        C = [];
        for (let i = 0; i < SIZE; i++) {
            A.push(0);
            B.push(0);
            C.push(0);
        }
    }

    let prev: number[];
    let cur: number[];
    let nextB: number[];

    export function reset() {
        init();
        prev = A;
        cur = B;
        nextB = C;
    }

    function idx(x: number, y: number) { return y * GW + x; }

    // Splash at screen coords
    export function splash(sx: number, sy: number, strength = 1, radiusPx = 10) {
        const gx = Math.idiv(sx * GW, screen.width);
        const gy = Math.idiv(sy * GH, screen.height);
        const r = Math.max(1, Math.idiv(radiusPx * GW, screen.width));

        const amp = (strength * FP) | 0;

        for (let y = Math.max(1, gy - r); y <= Math.min(GH - 2, gy + r); y++) {
            for (let x = Math.max(1, gx - r); x <= Math.min(GW - 2, gx + r); x++) {
                const dx = x - gx;
                const dy = y - gy;
                const d2 = dx * dx + dy * dy;
                if (d2 <= r * r) {
                    cur[idx(x, y)] += amp;
                }
            }
        }
    }

    export function step() {
        for (let y = 1; y < GH - 1; y++) {
            const yW = y * GW;
            for (let x = 1; x < GW - 1; x++) {
                const i = yW + x;
                const sum = cur[i - 1] + cur[i + 1] + cur[i - GW] + cur[i + GW];
                let n = (sum >> 1) - prev[i];
                n = (n * DAMP_NUM) >> DAMP_SHIFT;
                nextB[i] = n;
            }
        }
        // rotate
        const tmp = prev; prev = cur; cur = nextB; nextB = tmp;
    }

    export function sampleHeight(sx: number, sy: number): number {
        const gx = sx * (GW - 1) / (screen.width - 1);
        const gy = sy * (GH - 1) / (screen.height - 1);

        const x0 = Math.max(0, Math.min(GW - 2, Math.floor(gx)));
        const y0 = Math.max(0, Math.min(GH - 2, Math.floor(gy)));
        const tx = gx - x0;
        const ty = gy - y0;

        const i00 = cur[idx(x0, y0)];
        const i10 = cur[idx(x0 + 1, y0)];
        const i01 = cur[idx(x0, y0 + 1)];
        const i11 = cur[idx(x0 + 1, y0 + 1)];

        const a = i00 * (1 - tx) + i10 * tx;
        const b = i01 * (1 - tx) + i11 * tx;
        const hFP = a * (1 - ty) + b * ty;

        return (hFP / FP) / 2;
    }
}

WaterSim.reset();

let mouse = new Shaders.Vec2(80, 60)
let rippleOrigin = new Shaders.Vec2(80, 60)

// let boat = sprites.create(assets.image`boat-0`)

// browserEvents.onMouseMove(function(x: number, y: number) {
//     mouse.x = x
//     mouse.y = y
//     if (browserEvents.MouseLeft.isPressed()) {
//         WaterSim.splash(rippleOrigin.x, rippleOrigin.y, 1.0, 4);
//     }
// })

// game.onUpdate(function () {
//     WaterSim.step();
//     const move = mouse.sub(rippleOrigin).normalize().mul(5)
//     rippleOrigin = rippleOrigin.add(move)

// });

const checkerWaterShader: Shaders.Shader = (frag, u) => {
    const h = WaterSim.sampleHeight(frag.x, frag.y);

    const uvx = frag.x / u.resolution.x;
    let uvy = frag.y / u.resolution.y + h * 0.05;

    const tiles = 10;
    const tx = Math.floor(uvx * tiles);
    const ty = Math.floor(uvy * tiles);
    const isWhite = ((tx + ty) & 1) ? 1 : 0;

    let L = isWhite ? 0.9 : 0.1;
    L += h * 0.5;

    if (L < 0) L = 0;
    if (L > 1) L = 1;

    return L;
};

// Shaders.initDefaults()
// Shaders.setActiveProgram((uniforms, screen) => {
//     Shaders.runShader(checkerWaterShader, screen, uniforms);
// })