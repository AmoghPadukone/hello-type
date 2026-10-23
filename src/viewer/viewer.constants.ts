/** Scene tuning for the 3D preview: camera, lighting, materials and framing. */

/** Vertical field of view in degrees. */
export const CAMERA_FOV = 30;
/** Upper bound on the renderer's pixel ratio. */
export const MAX_PIXEL_RATIO = 2;
export const EXPOSURE = 0.95;
/** Blur of the room environment used for reflections. */
export const ENVIRONMENT_SIGMA = 0.04;

export const KEY_LIGHT = { intensity: 1.2, position: [-0.6, 1, 1.2] } as const;

export const MATERIAL = { roughness: 0.32, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.18 } as const;
/** Inside faces show where the cut plane slices the tube; they are drawn slightly darker. */
export const CAP_SHADE = 0.8;

/** Rounded tip that leads the tube while it draws on (unit sphere, scaled to the tube radius). */
export const TIP_SEGMENTS = { width: 24, height: 12 } as const;
/** Rounded-box segments for the base plate. */
export const PLATE_SEGMENTS = 4;

/** How much larger than the model the view is when framing it, by height and by width. */
export const FRAME_MARGIN = { y: 1.25, x: 1.12 } as const;
/** Starting view, as spherical angles in degrees: a gentle 3/4 view from slightly above. */
export const VIEW_ANGLE = { polar: 72, azimuth: -16 } as const;
/** Orbit zoom limits relative to the framing distance. */
export const ZOOM_RANGE = { min: 0.3, max: 3 } as const;
/** Camera clip planes relative to the framing distance. */
export const CLIP_RANGE = { near: 1 / 50, far: 10 } as const;
