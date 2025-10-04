namespace Shaders {
    export function initLUT(size = 128) {
        Color.initLUT(size);
    }

    export function initDefaults() {
        initLUT()
    }

    export function runShader(
        shader: Shader,
        img: Image,
        uniforms: Uniforms
    ) {
        for (let y = 0; y < uniforms.resolution.y; y++) {
            for (let x = 0; x < uniforms.resolution.x; x++) {
                const luminance = shader(new Vec2(x, y), uniforms);
                const color = Color.fromFloat(luminance)
                img.setPixel(x, y, color.shade);
            }
        }
    }

    const screen = image.create(160, 120)
    let frame = 0;
    let uniforms: Uniforms = {
        resolution: new Vec2(screen.width, screen.height),
        time: game.runtime() / 1000,
        frame: frame++
    };

    let activeProgram: MainProgram = null;
    
    export function setActiveProgram(program: MainProgram): void {
        activeProgram = program
    }
    
    game.onUpdate(() => {
        uniforms = {
            resolution: new Vec2(screen.width, screen.height),
            time: game.runtime() / 1000,
            frame: frame++
        };

        if (activeProgram) {
            activeProgram(uniforms, screen)
        }

        scene.setBackgroundImage(screen)
    })
}