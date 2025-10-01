import {
  Canvas,
  Circle,
  Group,
  Path,
  processTransform2d,
  RoundedRect,
} from "@shopify/react-native-skia";
import React from "react";
import { Platform, Text } from "react-native";
import { svg1 } from "./consts";
import { parseSVG } from "./svgToPaths";

export default function Index() {
  if (Platform.OS !== "web") {
    console.warn("Only WEB is currently supported");
    return <Text>Only WEB is currently supported</Text>;
  }

  const primitives = Platform.OS === "web" ? parseSVG(svg1) : [];

  return (
    <Canvas style={{ flex: 1, backgroundColor: "white" }}>
      <Group matrix={processTransform2d([{ scale: 5 }])}>
        {primitives.map((p, i) => {
          if (p.type === "rect") {
            return (
              <>
                {p.fillColor && (
                  <RoundedRect
                    key={`${i}-fill`}
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    r={p.r}
                    color={p.fillColor}
                    style="fill"
                    opacity={p.opacity}
                    matrix={p.matrix}
                  />
                )}
                {p.strokeColor && (
                  <RoundedRect
                    key={`${i}-stroke`}
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    r={p.r}
                    color={p.strokeColor}
                    style="stroke"
                    strokeWidth={p.strokeWidth}
                    opacity={p.opacity}
                    matrix={p.matrix}
                  />
                )}
              </>
            );
          } else if (p.type === "circle") {
            return (
              <>
                {p.fillColor && (
                  <Circle
                    key={`${i}-fill`}
                    cx={p.cx}
                    cy={p.cy}
                    r={p.r}
                    color={p.fillColor}
                    style="fill"
                    opacity={p.opacity}
                    matrix={p.matrix}
                  />
                )}
                {p.strokeColor && (
                  <Circle
                    key={`${i}-stroke`}
                    cx={p.cx}
                    cy={p.cy}
                    r={p.r}
                    color={p.strokeColor}
                    style="stroke"
                    strokeWidth={p.strokeWidth}
                    opacity={p.opacity}
                    matrix={p.matrix}
                  />
                )}
              </>
            );
          } else if (p.type === "path") {
            return (
              <>
                {p.fillColor && (
                  <Path
                    key={`${i}-fill`}
                    path={p.d}
                    color={p.fillColor}
                    style="fill"
                    opacity={p.opacity}
                    matrix={p.matrix}
                  />
                )}
                {p.strokeColor && (
                  <Path
                    key={`${i}-stroke`}
                    path={p.d}
                    color={p.strokeColor}
                    style="stroke"
                    strokeWidth={p.strokeWidth}
                    opacity={p.opacity}
                    matrix={p.matrix}
                  />
                )}
              </>
            );
          }
          return null;
        })}
      </Group>
    </Canvas>
  );
}
