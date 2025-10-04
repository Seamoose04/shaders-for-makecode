namespace Shaders {
    export interface Uniforms {
        resolution: Vec2;
        time: number;
        frame: number;
        mouse?: Vec2;
    }

    export type MainProgram = (uniforms: Uniforms, target: Image) => void

    export type Shader = (
        fragCoord: Vec2,
        uniforms: Uniforms
    ) => number;

    export interface color {
        shade: number
    }

    export class Color implements color {
        private static lut: number[] = [];
        private static lutSize: number = 0;

        constructor(public shade: number) { }

        static initLUT(size: number = 128): void {
            this.lutSize = size;
            this.lut = [];
            for (let i = 0; i < size; i++) {
                const v = i / (size - 1);
                const raw = Math.floor(v * 14) + 1;
                const shade = 16 - raw;
                this.lut.push(shade);
            }
        }

        static fromFloat(luminance: number): Color {
            const idx = Math.max(0, Math.min(this.lutSize - 1, Math.floor(luminance * (this.lutSize - 1))));
            return new Color(this.lut[idx]);
        }

        toFloat(): number {
            const raw = 16 - this.shade;
            return (raw - 1) / 14;
        }
    }

    export interface vec2<T> {
        x: T,
        y: T
    }

    export class Vec2 implements vec2<number> {
        constructor(public x: number, public y: number) { }

        add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
        sub(v: Vec2) { return new Vec2(this.x - v.x, this.y - v.y); }
        mul(f: number) { return new Vec2(this.x * f, this.y * f); }
        div(f: number) { return new Vec2(this.x / f, this.y / f); }

        dot(v: Vec2) { return this.x * v.x + this.y * v.y; }
        length() { return Math.sqrt(this.dot(this)); }
        normalize() {
            const len = this.length();
            return len > 0 ? this.div(len) : new Vec2(0, 0);
        }
    }

    export class Vec3 {
        constructor(public x: number, public y: number, public z: number) { }

        add(v: Vec3) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
        sub(v: Vec3) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
        mul(f: number) { return new Vec3(this.x * f, this.y * f, this.z * f); }
        dot(v: Vec3) { return this.x * v.x + this.y * v.y + this.z * v.z; }
        length() { return Math.sqrt(this.dot(this)); }
        normalize() {
            const len = this.length();
            return len > 0 ? this.mul(1 / len) : new Vec3(0, 0, 0);
        }
    }
}