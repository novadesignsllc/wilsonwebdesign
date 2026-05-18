window.addEventListener('load', function () {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'footer-shader-canvas';
  footer.insertBefore(canvas, footer.firstChild);

  const gl = canvas.getContext('webgl');
  if (!gl) return;

  const vertSrc = `
    attribute vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision highp float;
    uniform float iTime;
    uniform vec2 iResolution;

    #define NUM_OCTAVES 3

    float rand(vec2 n) {
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u * u * (3.0 - 2.0 * u);
      float res = mix(
        mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
        mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
        u.y
      );
      return res * res;
    }

    vec4 tanh4(vec4 x) {
      vec4 e2x = exp(2.0 * x);
      return (e2x - 1.0) / (e2x + 1.0);
    }

    float fbm(vec2 x) {
      float v = 0.0;
      float a = 0.3;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.4;
      }
      return v;
    }

    void main() {
      vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
      vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5)
               / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
      vec2 v;
      vec4 o = vec4(0.0);

      float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;

      for (int ii = 0; ii < 20; ii++) {
        float i = float(ii);
        v = p + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5
            + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);
        float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - (i / 20.0));
        vec4 auroraColors = vec4(
          0.1 + 0.3 * sin(i * 0.2 + iTime * 0.4),
          0.3 + 0.5 * cos(i * 0.3 + iTime * 0.5),
          0.7 + 0.3 * sin(i * 0.4 + iTime * 0.3),
          1.0
        );
        vec4 contrib = auroraColors
          * exp(sin(i * i + iTime * 0.8))
          / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
        float thinness = smoothstep(0.0, 1.0, i / 20.0) * 0.6;
        o += contrib * (1.0 + tailNoise * 0.8) * thinness;
      }

      o = tanh4(pow(max(o / 100.0, vec4(0.0)), vec4(1.6)));
      gl_FragColor = o * 1.5;
    }
  `;

  function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('footer-shader compile error:', gl.getShaderInfoLog(shader));
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
    console.error('footer-shader link error:', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  const verts = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'iTime');
  const uRes  = gl.getUniformLocation(program, 'iResolution');

  const SCALE = 0.5;
  function resize() {
    const w = Math.floor(footer.clientWidth  * SCALE);
    const h = Math.floor(footer.clientHeight * SCALE);
    canvas.width  = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  const start = performance.now();
  const INTERVAL = 1000 / 30;
  let lastFrame = 0;
  function render(now) {
    requestAnimationFrame(render);
    if (now - lastFrame < INTERVAL) return;
    lastFrame = now;
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  requestAnimationFrame(render);
});
