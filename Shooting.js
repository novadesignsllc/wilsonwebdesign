// Shader 1 — volumetric cloud/ray-march effect

function initShader1(container, canvasId) {
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  container.insertBefore(canvas, container.firstChild);

  const gl = canvas.getContext('webgl');
  if (!gl) return;

  const flowSpeed      = 1.2;
  const colorIntensity = 0.9;
  const noiseLayers    = 4.0;
  const mouseInfluence = 0.3;

  const vertSrc = `
    attribute vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec2 iMouse;
    uniform float uFlowSpeed;
    uniform float uColorIntensity;
    uniform float uNoiseLayers;
    uniform float uMouseInfluence;

    #define MARCH_STEPS 32

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float fbm(vec3 p) {
      float f = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 8; i++) {
        if (float(i) >= uNoiseLayers) break;
        f += amp * hash(p.xy);
        p *= 2.0;
        amp *= 0.5;
      }
      return f;
    }

    float map(vec3 p) {
      vec3 q = p;
      q.z += iTime * uFlowSpeed;
      vec2 mouse = (iMouse.xy / iResolution.xy - 0.5) * 2.0;
      q.xy += mouse * uMouseInfluence;
      float f = fbm(q * 2.0);
      f *= sin(p.y * 2.0 + iTime * 0.12) * 0.5 + 0.5;
      return clamp(f, 0.0, 1.0);
    }

    vec3 paletteColor(float t) {
      vec3 deepPurple  = vec3(0.18, 0.00, 0.35);
      vec3 midPurple   = vec3(0.38, 0.02, 0.65);
      vec3 lightPurple = vec3(0.52, 0.04, 0.82);

      float s = fract(t) * 2.0;
      float b = fract(s);
      float seg = floor(s);

      if (seg < 1.0) return mix(deepPurple,  lightPurple, smoothstep(0.0, 1.0, b));
                     return mix(lightPurple,  deepPurple,  smoothstep(0.0, 1.0, b));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
      vec3 ro = vec3(0, -1, 0);
      vec3 rd = normalize(vec3(uv, 1.0));

      vec3 col = vec3(0.08, 0.04, 0.28);
      float t = 0.0;

      for (int i = 0; i < MARCH_STEPS; i++) {
        vec3 p = ro + rd * t;
        float density = map(p);
        if (density > 0.0) {
          float hue = iTime * 0.04 + p.y * 0.18 + p.x * 0.06;
          vec3 auroraColor = paletteColor(hue);
          col += auroraColor * density * 0.1 * uColorIntensity;
        }
        t += 0.1;
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader1 error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vert = compileShader(vertSrc, gl.VERTEX_SHADER);
  const frag = compileShader(fragSrc, gl.FRAGMENT_SHADER);
  if (!vert || !frag) return;

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader1 link error:', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  const verts = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes       = gl.getUniformLocation(program, 'iResolution');
  const uTime      = gl.getUniformLocation(program, 'iTime');
  const uMouse     = gl.getUniformLocation(program, 'iMouse');
  const uFlow      = gl.getUniformLocation(program, 'uFlowSpeed');
  const uColor     = gl.getUniformLocation(program, 'uColorIntensity');
  const uNoise     = gl.getUniformLocation(program, 'uNoiseLayers');
  const uMouseInfl = gl.getUniformLocation(program, 'uMouseInfluence');

  const mouse = { x: 0.5, y: 0.5 };
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = (e.clientY - rect.top)  / rect.height;
  });

  function resize() {
    canvas.width  = container.clientWidth;
    canvas.height = container.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  const startTime = performance.now();
  function render() {
    if (gl.isContextLost()) return;
    const t = (performance.now() - startTime) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse.x * canvas.width, (1 - mouse.y) * canvas.height);
    gl.uniform1f(uFlow,      flowSpeed);
    gl.uniform1f(uColor,     colorIntensity);
    gl.uniform1f(uNoise,     noiseLayers);
    gl.uniform1f(uMouseInfl, mouseInfluence);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  render();
}

window.addEventListener('load', function () {
  const hero = document.querySelector('.hero');
  if (hero) initShader1(hero, 'hero-shader');

  const contact = document.querySelector('#contact');
  if (contact) initShader1(contact, 'contact-shader-1');
});
