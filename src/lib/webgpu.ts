/**
 * WebGPU Rendering Engine
 * Handles high-performance frame rendering and real-time shader effects.
 */

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';
  
  private pipeline: GPURenderPipeline | null = null;
  private sampler: GPUSampler | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async init() {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    this.device = await this.adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu');
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.context?.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    await this.createPipeline();
  }

  private async createPipeline() {
    if (!this.device) return;

    const shaderModule = this.device.createShaderModule({
      label: 'Video Shader',
      code: `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        };

        @vertex
        fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          var pos = array<vec2f, 4>(
            vec2f(-1.0,  1.0),
            vec2f( 1.0,  1.0),
            vec2f(-1.0, -1.0),
            vec2f( 1.0, -1.0)
          );
          var tex = array<vec2f, 4>(
            vec2f(0.0, 0.0),
            vec2f(1.0, 0.0),
            vec2f(0.0, 1.0),
            vec2f(1.0, 1.0)
          );

          var out: VertexOutput;
          out.position = vec4f(pos[vertexIndex], 0.0, 1.0);
          out.texCoord = tex[vertexIndex];
          return out;
        }

        @group(0) @binding(0) var s: sampler;
        @group(0) @binding(1) var t1: texture_2d<f32>;
        @group(0) @binding(3) var t2: texture_2d<f32>;

        struct Params {
          brightness: f32,
          contrast: f32,
          saturation: f32,
          preset: f32, // 0: none, 1: noir, 2: vivid, 3: sepia, 4: cyberpunk
          mixFactor: f32, // 0.0: only t1, 1.0: only t2
        };
        @group(0) @binding(2) var<uniform> params: Params;

        @fragment
        fn fs_main(in: VertexOutput) -> @location(0) vec4f {
          var color1 = textureSample(t1, s, in.texCoord);
          var color2 = textureSample(t2, s, in.texCoord);
          
          var color = mix(color1, color2, params.mixFactor);
          
          // Brightness
          color = vec4f(color.rgb + params.brightness, color.a);
          
          // Contrast
          color = vec4f((color.rgb - 0.5) * params.contrast + 0.5, color.a);
          
          // Saturation
          let luma = dot(color.rgb, vec3f(0.299, 0.587, 0.114));
          color = vec4f(mix(vec3f(luma), color.rgb, params.saturation), color.a);
          
          // Presets
          if (params.preset == 1.0) { // Noir
            let gray = dot(color.rgb, vec3f(0.299, 0.587, 0.114));
            color = vec4f(vec3f(gray * 1.2), color.a);
          } else if (params.preset == 2.0) { // Vivid
            color = vec4f(color.rgb * 1.2, color.a);
          } else if (params.preset == 3.0) { // Sepia
            let r = (color.r * 0.393) + (color.g * 0.769) + (color.b * 0.189);
            let g = (color.r * 0.349) + (color.g * 0.686) + (color.b * 0.168);
            let b = (color.r * 0.272) + (color.g * 0.534) + (color.b * 0.131);
            color = vec4f(r, g, b, color.a);
          } else if (params.preset == 4.0) { // Cyberpunk
            color = vec4f(color.r * 1.2, color.g * 0.8, color.b * 1.5, color.a);
          }
          
          return color;
        }
      `
    });

    this.pipeline = this.device.createRenderPipeline({
      label: 'Video Pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: 'triangle-strip',
      },
    });
  }

  async renderFrame(
    imageSource1: TexImageSource, 
    imageSource2: TexImageSource | null,
    mixFactor: number,
    effects: { brightness: number, contrast: number, saturation: number, preset: string }
  ) {
    if (!this.device || !this.pipeline || !this.context || !this.sampler) return;

    const getDims = (source: TexImageSource) => {
      if (source instanceof HTMLVideoElement) return [source.videoWidth, source.videoHeight];
      if (source instanceof HTMLImageElement) return [source.naturalWidth, source.naturalHeight];
      if (source instanceof HTMLCanvasElement) return [source.width, source.height];
      if (source instanceof ImageBitmap) return [source.width, source.height];
      if (typeof VideoFrame !== 'undefined' && source instanceof VideoFrame) {
        return [source.displayWidth, source.displayHeight];
      }
      return [0, 0];
    };

    const [w1, h1] = getDims(imageSource1);
    if (w1 === 0 || h1 === 0) return;

    const texture1 = this.device.createTexture({
      size: [w1, h1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture(
      { source: imageSource1, flipY: false },
      { texture: texture1 },
      [w1, h1]
    );

    // Create a dummy texture for imageSource2 if null
    let texture2: GPUTexture;
    if (imageSource2) {
      const [w2, h2] = getDims(imageSource2);
      texture2 = this.device.createTexture({
        size: [w2, h2],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.device.queue.copyExternalImageToTexture(
        { source: imageSource2, flipY: false },
        { texture: texture2 },
        [w2, h2]
      );
    } else {
      texture2 = this.device.createTexture({
        size: [1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
    }

    const paramsBuffer = this.device.createBuffer({
      size: 32, // Increased size for more params
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const presetMap = { none: 0, noir: 1, vivid: 2, sepia: 3, cyberpunk: 4 };
    const presetValue = (presetMap as any)[effects.preset] || 0;

    this.device.queue.writeBuffer(
      paramsBuffer,
      0,
      new Float32Array([effects.brightness, effects.contrast, effects.saturation, presetValue, mixFactor, 0, 0, 0])
    );

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.sampler },
        { binding: 1, resource: texture1.createView() },
        { binding: 2, resource: { buffer: paramsBuffer } },
        { binding: 3, resource: texture2.createView() },
      ],
    });

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(4);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
    
    // Cleanup temporary resources
    texture1.destroy();
    if (texture2) texture2.destroy();
    paramsBuffer.destroy();
  }

  async clear() {
    if (!this.device || !this.context) return;

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
