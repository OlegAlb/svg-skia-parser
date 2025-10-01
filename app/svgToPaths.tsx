import { processTransform2d, SkMatrix } from "@shopify/react-native-skia";

export interface RectPrimitiveSkia {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  r?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  matrix?: SkMatrix;
}

export interface CirclePrimitiveSkia {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  matrix?: SkMatrix;
}

export interface PathPrimitiveSkia {
  type: "path";
  d: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  matrix?: SkMatrix;
}

export type PrimitiveSkia =
  | RectPrimitiveSkia
  | CirclePrimitiveSkia
  | PathPrimitiveSkia;

const parseFloatWithUnits = (value: string | null, defaultVal = 0): number => {
  if (!value) return defaultVal;
  return parseFloat(value.replace(/[^0-9.-]/g, "")) || defaultVal;
};

const parseStyle = (style: string | null): Record<string, string> => {
  if (!style) return {};
  const obj: Record<string, string> = {};
  style.split(";").forEach((s) => {
    const [k, v] = s.split(":").map((str) => str.trim());
    if (k && v) obj[k] = v;
  });
  return obj;
};

const mergeStyles = (
  parent: Record<string, string>,
  el: Element
): Record<string, string> => {
  const style = parseStyle(el.getAttribute("style"));
  const merged = { ...parent, ...style };
  ["fill", "stroke", "stroke-width", "opacity"].forEach((attr) => {
    const val = el.getAttribute(attr);
    if (val !== null) merged[attr] = val;
  });
  return merged;
};

const parseTransformArray = (transform: string | null) => {
  if (!transform) return [];
  const array: any[] = [];

  const translateMatch = transform.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const [x, y = 0] = translateMatch[1]
      .split(/[\s,]+/)
      .map(parseFloatWithUnits);
    array.push({ translateX: x });
    array.push({ translateY: y });
  }

  const scaleMatch = transform.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const [sx, sy = sx] = scaleMatch[1]
      .split(/[\s,]+/)
      .map(parseFloatWithUnits);
    array.push({ scaleX: sx });
    array.push({ scaleY: sy });
  }

  const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    const [angle, cx = 0, cy = 0] = rotateMatch[1]
      .split(/[\s,]+/)
      .map(parseFloatWithUnits);
    array.push({ translateX: cx });
    array.push({ translateY: cy });
    array.push({ rotate: (angle * Math.PI) / 180 });
    array.push({ translateX: -cx });
    array.push({ translateY: -cy });
  }

  const skewXMatch = transform.match(/skewX\(([^)]+)\)/);
  if (skewXMatch)
    array.push({ skewX: (parseFloatWithUnits(skewXMatch[1]) * Math.PI) / 180 });

  const skewYMatch = transform.match(/skewY\(([^)]+)\)/);
  if (skewYMatch)
    array.push({ skewY: (parseFloatWithUnits(skewYMatch[1]) * Math.PI) / 180 });

  return array;
};

export const parseSVG = (svgString: string): PrimitiveSkia[] => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const primitives: PrimitiveSkia[] = [];

  const processElement = (
    el: Element,
    parentTransforms: any[] = [],
    parentStyle: Record<string, string> = {}
  ) => {
    const localTransforms = parseTransformArray(el.getAttribute("transform"));
    const combinedTransforms = [...parentTransforms, ...localTransforms];
    const style = mergeStyles(parentStyle, el);

    const matrix =
      combinedTransforms.length > 0
        ? processTransform2d(combinedTransforms)
        : undefined;

    // Rect
    if (el.tagName === "rect") {
      primitives.push({
        type: "rect",
        x: parseFloatWithUnits(el.getAttribute("x")),
        y: parseFloatWithUnits(el.getAttribute("y")),
        width: parseFloatWithUnits(el.getAttribute("width")),
        height: parseFloatWithUnits(el.getAttribute("height")),
        r: parseFloatWithUnits(el.getAttribute("rx")),
        fillColor: style.fill !== "none" ? style.fill : undefined,
        strokeColor: style.stroke !== "none" ? style.stroke : undefined,
        strokeWidth: parseFloatWithUnits(style["stroke-width"]),
        opacity: parseFloatWithUnits(style.opacity, 1),
        matrix,
      } as RectPrimitiveSkia);
    }

    // Circle
    else if (el.tagName === "circle") {
      primitives.push({
        type: "circle",
        cx: parseFloatWithUnits(el.getAttribute("cx")),
        cy: parseFloatWithUnits(el.getAttribute("cy")),
        r: parseFloatWithUnits(el.getAttribute("r")),
        fillColor: style.fill !== "none" ? style.fill : undefined,
        strokeColor: style.stroke !== "none" ? style.stroke : undefined,
        strokeWidth: parseFloatWithUnits(style["stroke-width"]),
        opacity: parseFloatWithUnits(style.opacity, 1),
        matrix,
      } as CirclePrimitiveSkia);
    }

    // Path
    else if (el.tagName === "path") {
      const d = el.getAttribute("d") || "";
      if (d) {
        primitives.push({
          type: "path",
          d,
          fillColor: style.fill !== "none" ? style.fill : undefined,
          strokeColor: style.stroke !== "none" ? style.stroke : undefined,
          strokeWidth: parseFloatWithUnits(style["stroke-width"]),
          opacity: parseFloatWithUnits(style.opacity, 1),
          matrix,
        } as PathPrimitiveSkia);
      }
    }

    // Group
    else if (el.tagName === "g") {
      Array.from(el.children).forEach((child) =>
        processElement(child, combinedTransforms, style)
      );
    }

    // SVG
    else if (el.tagName === "svg") {
      const vb = el.getAttribute("viewBox");
      const x = parseFloatWithUnits(el.getAttribute("x"), 0);
      const y = parseFloatWithUnits(el.getAttribute("y"), 0);
      let w = parseFloatWithUnits(el.getAttribute("width"));
      let h = parseFloatWithUnits(el.getAttribute("height"));

      const vbTransforms: any[] = [{ translateX: x }, { translateY: y }];

      if (vb) {
        const [minX, minY, vbWidth, vbHeight] = vb.split(/\s+/).map(parseFloat);

        // если width/height не заданы → берём размеры viewBox
        if (!w) w = vbWidth;
        if (!h) h = vbHeight;

        if (vbWidth > 0 && vbHeight > 0) {
          vbTransforms.push({ scaleX: w / vbWidth });
          vbTransforms.push({ scaleY: h / vbHeight });
          vbTransforms.push({ translateX: -minX });
          vbTransforms.push({ translateY: -minY });
        }
      }

      Array.from(el.children).forEach((child) =>
        processElement(child, [...combinedTransforms, ...vbTransforms], style)
      );
      return;
    }
  };

  processElement(svgDoc.documentElement);
  return primitives;
};
