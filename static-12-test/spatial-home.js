/* LifeAfterLogic — interactive Gaussian-splat homepage
   Six public 3D captures arranged as a slowly orbiting spatial study.
   The scene data remains volumetric; no video panels or image cards are used. */
(() => {
  "use strict";

  const home = document.getElementById("home");
  const canvasRoot = document.getElementById("spatial-canvas-root");
  const errorBox = document.getElementById("spatial-error");
  if (!home || !canvasRoot || !errorBox) return;
  const signal = name => window.dispatchEvent(new Event("lifeafterlogic:" + name));

  const originalCaptures = [
    { id: "3582f3b0-565e-443f-9165-3571c0721fbc", scale: .62, y: -.14, tilt: -.035 },
    { id: "1a487b86-38a7-466d-856b-5d9ad2f84fab", scale: .64, y: .22, tilt: .045 },
    { id: "b101171b-cf5f-4669-ab44-d9fa39e69898", scale: .60, y: -.28, tilt: .025 },
    { id: "9c6e8bac-3b79-4f39-a605-58999d33c33c", scale: .72, y: .30, tilt: -.055 },
    { id: "94f2efd7-f65d-4b7f-b455-536e95643bad", scale: .60, y: -.10, tilt: .035 },
    { id: "3adabd81-8ef0-4257-92cb-a2929ef8aa8a", scale: .68, y: .16, tilt: -.025 }
  ];

  // Composition-only placeholders: deliberately reuse known graffiti scans until
  // six additional compatible captures can be independently sourced.
  const overrides = new URLSearchParams(location.search).getAll("capture").map(value => {
    const m = value.match(/^(?:https:\/\/lumalabs\.ai\/capture\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);
    return m ? m[1] : null;
  }).filter(Boolean).slice(0,6);
  const sixOnly = new URLSearchParams(location.search).get("count") === "6";
  const extras = [3,0,5,2,1,4].map((i,j) => ({
    ...originalCaptures[i], id: overrides[j] || originalCaptures[i].id,
    scale:[.46,.54,.48,.58,.44,.52][j],
    y:[1.18,.92,1.42,1.05,1.25,.84][j],
    tilt:[.11,-.08,.06,-.13,.09,-.05][j], outer:true
  }));
  const captures = sixOnly ? originalCaptures : [...originalCaptures,...extras];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = null;
  let loading = false;
  let generation = 0;

  function isHomeVisible() {
    return !home.hidden;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    console.warn(message);
  }

  function disposeActive() {
    if (!active) return;
    const state = active;
    active = null;
    state.disposed = true;
    if (state.raf) cancelAnimationFrame(state.raf);
    clearTimeout(state.loadingTimeout);
    state.cancelLoading?.();
    window.removeEventListener("resize", state.resize);
    document.removeEventListener("visibilitychange", state.visibility);
    window.removeEventListener("lifeafterlogic:theme-change", state.theme);
    state.controls.dispose();
    state.splats.forEach(splat => {
      try { splat.dispose(); } catch (_) {}
    });
    state.clearGpuQueue?.();
    state.renderer.renderLists?.dispose();
    state.renderer.dispose();
    state.renderer.domElement.remove();
    canvasRoot.replaceChildren();
  }

  async function startViewer(token) {
    const [THREE, controlsModule, lumaModule] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("@lumaai/luma-web")
    ]);
    if (token !== generation || !isHomeVisible()) return;

    const { OrbitControls } = controlsModule;
    const { LumaSplatsThree } = lumaModule;
    const scene = new THREE.Scene();
    const backgroundColor = () => document.documentElement.dataset.theme === "dark" ? 0x030303 : 0xffffff;
    scene.background = new THREE.Color(backgroundColor());

    const camera = new THREE.PerspectiveCamera(43, (canvasRoot.clientWidth || window.innerWidth) / Math.max(1, canvasRoot.clientHeight || window.innerHeight), .05, 120);
    camera.position.set(...(sixOnly ? [2.55,1.55,9.2] : [2.65,2.2,12.1]));
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    });
    const touchDevice = matchMedia("(pointer: coarse)").matches;
    // Start at a useful resolution, then tune to the actual device under load.
    let quality = touchDevice ? .85 : 1;
    const minQuality = touchDevice ? .52 : .58;
    let appliedRatio = 0;
    let viewWidth = 0, viewHeight = 0;
    function applyResolution(force = false) {
      const width = Math.max(1, canvasRoot.clientWidth || window.innerWidth);
      const height = Math.max(1, canvasRoot.clientHeight || window.innerHeight);
      // Limit fragment work on Retina phones and very large desktop displays.
      const pixelBudget = touchDevice ? 720000 : 2200000;
      const ceiling = Math.min(window.devicePixelRatio || 1, touchDevice ? 1.1 : 1.45, Math.sqrt(pixelBudget / (width * height)));
      const ratio = Math.max(.35, Math.round(ceiling * quality * 20) / 20);
      if (force || width !== viewWidth || height !== viewHeight || Math.abs(ratio - appliedRatio) >= .049) {
        viewWidth = width; viewHeight = height; appliedRatio = ratio;
        renderer.setDrawingBufferSize(width, height, ratio);
      }
    }
    applyResolution(true);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(backgroundColor(), 1);
    renderer.domElement.setAttribute("aria-label", "Interactive Gaussian splat scenes. Drag to orbit and scroll to zoom.");
    canvasRoot.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    // Shorter inertia tail makes drag/pan respond sooner and settle faster.
    controls.dampingFactor = touchDevice ? .13 : .105;
    controls.enablePan = true;
    controls.minDistance = 5.2;
    controls.maxDistance = sixOnly ? 15.5 : 24;
    controls.minPolarAngle = .35;
    controls.maxPolarAngle = Math.PI - .35;
    controls.rotateSpeed = .48;
    controls.zoomSpeed = .62;
    controls.panSpeed = .45;

    const orbit = new THREE.Group();
    scene.add(orbit);

    const state = {
      renderer, controls, splats: [], raf: 0, disposed: false,
      loadingTimeout: 0, resize: null, visibility: null, theme: null
    };
    active = state;

    let nextIndex = 0;
    let inFlight = 0;
    let completed = 0;
    let failed = 0;
    let revealed = false;
    let revealPending = false;
    let loadTimer = 0;
    state.cancelLoading = () => clearTimeout(loadTimer);
    function revealScene() {
      if (revealed || state.disposed) return;
      revealed = true;
      signal("spatial-ready");
    }
    state.theme = () => {
      scene.background.set(backgroundColor());
      renderer.setClearColor(backgroundColor(), 1);
      needsRender = true;
    };
    window.addEventListener("lifeafterlogic:theme-change", state.theme);
    let interacting = false;
    let lastInteraction = 0;
    let lastCameraChange = performance.now();
    let lastRenderedAt = 0, nextDue = 0;
    let previousTick = 0;
    let tickInterval = 1000 / 60;
    let pendingResolution = false;
    let needsRender = true;
    const targetInterval = 1000 / 60;
    let sampleStart = 0, renderedFrames = 0, blockedFrames = 0, cpuCost = 0, longTicks = 0, tickCount = 0;
    let stableWindows = 0, lastResize = 0;
    function resetStats(now = performance.now()) {
      sampleStart = now;
      renderedFrames = blockedFrames = cpuCost = longTicks = tickCount = 0;
    }
    function assessQuality(now, busy) {
      const elapsed = now - sampleStart;
      if (elapsed < (busy ? 480 : 1100)) return;
      const attempts = renderedFrames + blockedFrames;
      if (attempts < 5) { resetStats(now); return; }
      const backlog = blockedFrames / attempts;
      const meanCpu = renderedFrames ? cpuCost / renderedFrames : 0;
      const expected = 1000 / Math.max(targetInterval, Math.min(33.4, tickInterval));
      const fps = renderedFrames * 1000 / elapsed;
      const slow = backlog > .19 || meanCpu > 14 || (fps < expected * .78 && longTicks > tickCount * .15);
      const headroom = backlog < .035 && meanCpu < 9 && fps >= expected * .87 && longTicks < tickCount * .12;
      if (slow) {
        stableWindows = 0;
        // A larger reduction is preferable to resizing the canvas repeatedly.
        const next = Math.max(minQuality, quality - (backlog > .40 || meanCpu > 22 ? .16 : .09));
        if (next < quality && now - lastResize > 500) { quality = next; pendingResolution = true; lastResize = now; }
      } else {
        stableWindows = headroom ? stableWindows + 1 : 0;
        // Never raise resolution in the middle of a gesture; restore detail gradually.
        if (!busy && stableWindows >= 3 && quality < 1 && now - lastResize > 2600) {
          quality = Math.min(1, quality + .07);
          pendingResolution = true;
          lastResize = now;
          stableWindows = 0;
        }
      }
      resetStats(now);
    }
    resetStats();
    const gl = renderer.getContext();
    const gpuQueue = [];
    let useFences = renderer.capabilities.isWebGL2 && typeof gl.fenceSync === "function";
    // Never block the main thread waiting for the GPU. Bound queued work
    // to keep camera input responsive and adapt resolution to measured load.
    function clearGpuQueue() {
      for (const fence of gpuQueue.splice(0)) { try { gl.deleteSync(fence); } catch (_) {} }
    }
    state.clearGpuQueue = clearGpuQueue;
    function gpuAvailable() {
      if (!useFences) return true;
      try {
        while (gpuQueue.length) {
          const result = gl.clientWaitSync(gpuQueue[0], 0, 0);
          if (result === gl.TIMEOUT_EXPIRED) break;
          if (result === gl.WAIT_FAILED) { useFences = false; clearGpuQueue(); return true; }
          gl.deleteSync(gpuQueue.shift());
        }
        // Two in-flight frames permit CPU/GPU overlap without a deep input queue.
        return gpuQueue.length < 2;
      } catch (_) { useFences = false; clearGpuQueue(); return true; }
    }
    function submitFrame() {
      if (!useFences) return;
      try {
        const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (fence) gpuQueue.push(fence);
        else { useFences = false; clearGpuQueue(); }
      } catch (_) { useFences = false; clearGpuQueue(); }
    }
    controls.addEventListener("change", () => { lastCameraChange = performance.now(); needsRender = true; });

    function updateProgress() {
      // Show the artwork when at least one capture is ready, or all attempts have settled.
      if (!revealed && completed > failed) revealPending = true;
      else if (completed === captures.length) revealScene();
      if (completed === captures.length) {
        clearTimeout(state.loadingTimeout);
        if (failed) showError(failed + " public captures could not load.");
      }
    }

    function finishCapture(error) {
      if (state.disposed) return;
      inFlight = Math.max(0, inFlight - 1);
      completed++;
      needsRender = true;
      if (error) failed++;
      updateProgress();
      // Yield between capture initialisations so decoding and GPU uploads do
      // not repeatedly interrupt touch input or the loading animation.
      if (!loadTimer && nextIndex < captures.length) {
        loadTimer = window.setTimeout(() => {
          loadTimer = 0;
          loadQueue();
        }, touchDevice ? 120 : 40);
      }
    }

    function addCapture(item, index) {
      const angle = (index % 6) / 6 * Math.PI * 2 + (item.outer ? Math.PI/6 : 0);
      const holder = new THREE.Group();
      const radius = item.outer ? [5.85,6.1,5.6,6.25,5.8,6.05][index%6] : 4.25;
      holder.position.set(Math.sin(angle) * radius, item.y, Math.cos(angle) * radius);
      holder.rotation.y = angle + Math.PI + (item.outer ? [.18,-.13,.24,-.17,.12,-.22][index%6] : 0);
      holder.rotation.x = item.tilt;
      holder.rotation.z = (index % 2 ? 1 : -1) * (item.outer ? .07 : .025);
      holder.scale.setScalar(item.scale);
      orbit.add(holder);

      const splat = new LumaSplatsThree({
        source: "https://lumalabs.ai/capture/" + item.id,
        loadingAnimationEnabled: false,
        particleRevealEnabled: false,
        enableThreeShaderIntegration: false
      });
      state.splats.push(splat);
      let settled = false;
      const settle = error => {
        if (settled) return;
        settled = true;
        finishCapture(error);
      };
      splat.onLoad = () => settle(null);
      splat.onError = error => {
        console.warn("Gaussian capture failed to load", item.id, error);
        settle(error || new Error("Capture failed"));
      };
      holder.add(splat);
    }

    function loadQueue() {
      if (state.disposed) return;
      // Don't start another decode/upload while a visible scene is being dragged.
      // In-flight captures can finish; the rest resume when input settles.
      if (revealed && (interacting || performance.now() - lastInteraction < 300)) {
        if (!loadTimer && nextIndex < captures.length) loadTimer = window.setTimeout(() => {
          loadTimer = 0;
          loadQueue();
        }, 300);
        return;
      }
      const concurrency = touchDevice ? 1 : 2;
      while (inFlight < concurrency && nextIndex < captures.length) {
        const index = nextIndex++;
        inFlight++;
        try {
          addCapture(captures[index], index);
        } catch (error) {
          console.warn("Could not initialise Gaussian capture", error);
          finishCapture(error);
        }
      }
    }

    function animate(now = performance.now()) {
      state.raf = 0;
      if (state.disposed || document.hidden || gl.isContextLost()) return;
      state.raf = requestAnimationFrame(animate);
      const tickGap = previousTick ? now - previousTick : 0;
      previousTick = now;
      if (tickGap > 0 && tickGap < 45) tickInterval += (tickGap - tickInterval) * .10;

      // Finish the damping motion before the independent scene orbit resumes.
      const responsive = interacting || now - lastCameraChange < 320;
      const moving = !reducedMotion.matches && !responsive && now - lastInteraction > 4200;
      const loadingScene = completed < captures.length;
      const continuous = responsive || moving || loadingScene;
      if (!continuous && !needsRender && !pendingResolution) {
        resetStats(now);
        nextDue = 0;
        return;
      }

      // The old 60Hz gate could miss a display refresh on a slightly early RAF.
      // Quantise to display ticks: every tick on 60Hz, every second on 120Hz.
      const interval = Math.max(1, Math.round(targetInterval / Math.max(4, tickInterval))) * tickInterval;
      tickCount++;
      if (tickGap > Math.max(24, tickInterval * 1.65)) longTicks++;
      if (continuous && now + Math.min(3, tickInterval * .23) < nextDue && !revealPending) return;
      if (!gpuAvailable()) {
        blockedFrames++;
        if (continuous) assessQuality(now, responsive);
        return;
      }
      const frameStart = performance.now();
      if (pendingResolution) {
        // Apply only once the GPU can accept work, not during an outstanding frame.
        applyResolution();
        pendingResolution = false;
      }
      const delta = lastRenderedAt ? Math.min((now - lastRenderedAt)/1000, .10) : 0;
      lastRenderedAt = now;
      // Anchor the next deadline to the actual presentation opportunity.
      nextDue = continuous ? now + interval : 0;
      if (moving) orbit.rotation.y += delta * .035;
      needsRender = false;
      controls.update();
      renderer.render(scene, camera);
      submitFrame();
      renderedFrames++;
      cpuCost += performance.now() - frameStart;
      if (revealPending) {
        revealPending = false;
        revealScene();
      }
      if (continuous) assessQuality(now, responsive);
    }

    controls.addEventListener("start", () => {
      interacting = true;
      needsRender = true;
      nextDue = 0;
      stableWindows = 0;
      lastInteraction = performance.now();
    });
    controls.addEventListener("end", () => {
      interacting = false;
      needsRender = true;
      lastInteraction = performance.now();
      if (!loadTimer && nextIndex < captures.length) loadTimer = window.setTimeout(() => {
        loadTimer = 0;
        loadQueue();
      }, 300);
    });

    state.resize = () => {
      if (state.disposed) return;
      // Defer framebuffer reallocation until the next available render slot.
      pendingResolution = true;
      const width = Math.max(1, canvasRoot.clientWidth || window.innerWidth);
      const height = Math.max(1, canvasRoot.clientHeight || window.innerHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      needsRender = true;
      nextDue = 0;
    };
    state.visibility = () => {
      if (document.hidden) {
        if (state.raf) cancelAnimationFrame(state.raf);
        state.raf = 0;
      } else if (!state.disposed && !state.raf) {
        lastRenderedAt = 0;
        previousTick = 0;
        nextDue = 0;
        resetStats();
        stableWindows = 0;
        needsRender = true;
        animate();
      }
    };
    window.addEventListener("resize", state.resize, { passive: true });
    document.addEventListener("visibilitychange", state.visibility);
    renderer.domElement.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      if (state.disposed) return;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      clearGpuQueue();
      revealScene();
      showError("The graphics context was interrupted. Refresh the page to reload the spatial scenes.");
    }, false);

    state.loadingTimeout = window.setTimeout(() => {
      if (!state.disposed && completed < captures.length) {
        revealScene();
        showError("Some spatial captures are still loading.");
      }
    }, 45000);

    updateProgress();
    loadQueue();
    animate();
  }

  async function syncViewer() {
    if (!isHomeVisible()) {
      ++generation;
      disposeActive();
      return;
    }
    if (active || loading) return;
    const token = ++generation;
    loading = true;
    errorBox.hidden = true;
    signal("spatial-loading");
    try {
      // On touch devices let the native loader start playing before WebGL
      // initialisation, shader compilation and capture decoding compete for time.
      const touch = matchMedia("(pointer: coarse)").matches;
      await new Promise(resolve => window.setTimeout(resolve, touch ? 450 : 120));
      if (token !== generation || !isHomeVisible()) return;
      await startViewer(token);
    } catch (error) {
      console.error("LifeAfterLogic spatial homepage failed to initialise", error);
      if (token === generation && isHomeVisible()) {
        disposeActive();
        signal("spatial-ready");
        showError("The 3D viewer could not start in this browser. Try refreshing or using a browser with WebGL enabled.");
      }
    } finally {
      loading = false;
      if (token !== generation && isHomeVisible() && !active) syncViewer();
    }
  }

  window.addEventListener("lifeafterlogic:route-change", syncViewer);
  syncViewer();
})();
