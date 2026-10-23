/**
 * Live 3D view of a print plan (three.js). The tube grows along the path in sync with the 2D
 * pen (same per-stroke timing) with a rounded tip leading it. The flat-foot cut is shown with a
 * clipping plane (inside faces drawn flat so feet read as solid) and the base plate as a
 * rounded slab. Owns every GPU resource it creates; call `dispose()`.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildTubes } from '@/core/print/geometry/tube';
import type { Vec3 } from '@/core/print/geometry/vec';
import type { PrintPlan } from '@/core/print/plan.types';
import { strokeDuration, strokeLength } from '@/core/svg/svg';
import {
  CAMERA_FOV,
  CAP_SHADE,
  CLIP_RANGE,
  ENVIRONMENT_SIGMA,
  EXPOSURE,
  FRAME_MARGIN,
  KEY_LIGHT,
  MATERIAL,
  MAX_PIXEL_RATIO,
  PLATE_SEGMENTS,
  TIP_SEGMENTS,
  VIEW_ANGLE,
  ZOOM_RANGE,
} from './viewer.constants';

interface TimelineStep {
  time: number;
  count: number;
  c: Vec3;
  r: number;
}

export class Viewer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 1, 100000);
  private readonly controls: OrbitControls;
  private readonly group = new THREE.Group();
  private readonly material = new THREE.MeshPhysicalMaterial({ ...MATERIAL });
  private readonly capMaterial = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
  private readonly plateMaterial = this.material.clone();
  private readonly clip = new THREE.Plane();
  private readonly tip: THREE.Mesh;
  private readonly resizeObserver: ResizeObserver;
  private mesh: THREE.Mesh | null = null;
  private plate: THREE.Mesh | null = null;
  private timeline: TimelineStep[] = [];
  private playStart: number | null = null;
  private fitSize: THREE.Vector3 | null = null;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = EXPOSURE;
    this.renderer.localClippingEnabled = true;
    container.append(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), ENVIRONMENT_SIGMA).texture;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xffffff, KEY_LIGHT.intensity);
    key.position.set(...KEY_LIGHT.position);
    this.scene.add(key, this.group);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;

    this.tip = new THREE.Mesh(
      new THREE.SphereGeometry(1, TIP_SEGMENTS.width, TIP_SEGMENTS.height),
      this.material,
    );
    this.tip.visible = false;
    this.group.add(this.tip);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.clearModel();
    this.tip.geometry.dispose();
    for (const m of [this.material, this.capMaterial, this.plateMaterial]) m.dispose();
    this.scene.environment?.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  setColor(color: string) {
    this.material.color.set(color);
    this.plateMaterial.color.set(color);
    this.capMaterial.color.set(color).multiplyScalar(CAP_SHADE);
  }

  /** Shows a plan; `speed` matches the 2D preview's drawing speed. */
  setPlan(plan: PrintPlan | null, speed: number) {
    this.clearModel();
    // Pin dots are exported as separate parts but shown in place.
    const strokes = plan ? [...plan.strokes, ...plan.previewOnly] : [];
    const lengths = strokes.map(s => strokeLength(s));
    const tubes = plan ? buildTubes(strokes, plan.radiusScale) : [];
    if (!plan || !tubes.length) {
      this.fitSize = null;
      return;
    }

    // Merge tubes in drawing order into preallocated buffers, recording for every ring when
    // the pen reaches it.
    let vertexCount = 0,
      indexCount = 0;
    const ringsPerStroke = new Map<number, number>();
    for (const t of tubes) {
      vertexCount += t.positions.length / 3;
      indexCount += t.indices.length;
      ringsPerStroke.set(t.stroke, (ringsPerStroke.get(t.stroke) ?? 0) + t.progress.length);
    }
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const indices = new Uint32Array(indexCount);
    let vOffset = 0,
      iOffset = 0,
      strokeStart = 0,
      strokeTime = 0,
      currentStroke = -1,
      doneInStroke = 0;
    this.timeline = [];
    for (const t of tubes) {
      if (t.stroke !== currentStroke) {
        strokeStart += strokeTime;
        currentStroke = t.stroke;
        strokeTime = strokeDuration(lengths[t.stroke] ?? 1000, speed);
        doneInStroke = 0;
      }
      positions.set(t.positions, vOffset * 3);
      normals.set(t.normals, vOffset * 3);
      for (let i = 0; i < t.indices.length; i++) indices[iOffset + i] = t.indices[i] + vOffset;
      const total = ringsPerStroke.get(t.stroke)!;
      for (const p of t.progress) {
        doneInStroke++;
        this.timeline.push({
          time: strokeStart + strokeTime * (doneInStroke / total),
          count: iOffset + p.count,
          c: p.c,
          r: p.r,
        });
      }
      vOffset += t.positions.length / 3;
      iOffset += t.indices.length;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.add(new THREE.Mesh(geometry, this.capMaterial));
    this.group.add(this.mesh);

    const box = geometry.boundingBox!.clone();
    if (plan.cut) {
      const axis = plan.cut.axis === 1 ? 'y' : 'z';
      box.min[axis] = Math.max(box.min[axis], plan.cut.at);
    }
    if (plan.plate) {
      const { min, max, round } = plan.plate;
      const size = max.map((v, k) => v - min[k]) as Vec3;
      this.plate = new THREE.Mesh(new RoundedBoxGeometry(...size, PLATE_SEGMENTS, round), this.plateMaterial);
      this.plate.position.set(...(max.map((v, k) => (v + min[k]) / 2) as Vec3));
      this.group.add(this.plate);
      box.union(new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)));
    }
    const center = box.getCenter(new THREE.Vector3());
    this.group.position.copy(center).multiplyScalar(-1);

    // Clip below the cut; in world space the model is offset by the group position.
    if (plan.cut) {
      const n = new THREE.Vector3().setComponent(plan.cut.axis, 1);
      this.clip.set(n, -(plan.cut.at + this.group.position.getComponent(plan.cut.axis)));
      this.material.clippingPlanes = this.capMaterial.clippingPlanes = [this.clip];
    } else {
      this.material.clippingPlanes = this.capMaterial.clippingPlanes = [];
    }

    const fresh = !this.fitSize;
    this.fitSize = box.getSize(new THREE.Vector3());
    this.frameView(fresh);
    if (this.playStart === null) this.showAll();
  }

  resetView() {
    if (this.fitSize) this.frameView(true);
  }

  play() {
    this.playStart = performance.now();
  }

  private clearModel() {
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.plate) {
      this.group.remove(this.plate);
      this.plate.geometry.dispose();
      this.plate = null;
    }
    this.timeline = [];
  }

  private showAll() {
    this.playStart = null;
    this.tip.visible = false;
    this.mesh?.geometry.setDrawRange(0, Infinity);
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.fitSize) this.frameView(false);
  }

  /** Fits the model in view; on first fit (or reset) also sets a gentle 3/4 angle. */
  private frameView(resetAngle: boolean) {
    const { x, y } = this.fitSize!;
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const dist = Math.max(
      (y * FRAME_MARGIN.y) / (2 * Math.tan(halfFov)),
      (x * FRAME_MARGIN.x) / (2 * Math.tan(halfFov) * this.camera.aspect),
    );
    const dir = resetAngle
      ? new THREE.Vector3().setFromSphericalCoords(
          1,
          THREE.MathUtils.degToRad(VIEW_ANGLE.polar),
          THREE.MathUtils.degToRad(VIEW_ANGLE.azimuth),
        )
      : this.camera.position.clone().normalize();
    this.camera.position.copy(dir.multiplyScalar(dist));
    this.camera.near = dist * CLIP_RANGE.near;
    this.camera.far = dist * CLIP_RANGE.far;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = dist * ZOOM_RANGE.min;
    this.controls.maxDistance = dist * ZOOM_RANGE.max;
    this.controls.update();
  }

  private frame() {
    if (this.playStart !== null && this.mesh && this.timeline.length) {
      const t = (performance.now() - this.playStart) / 1000;
      const tl = this.timeline;
      if (t >= tl[tl.length - 1].time) {
        this.showAll();
      } else {
        let lo = 0,
          hi = tl.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (tl[mid].time < t) lo = mid + 1;
          else hi = mid;
        }
        const step = tl[lo];
        this.mesh.geometry.setDrawRange(0, step.count);
        this.tip.visible = true;
        this.tip.position.set(...step.c);
        this.tip.scale.setScalar(step.r);
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
