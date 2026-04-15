import React from 'react';
import Svg, { Path } from 'react-native-svg';

// All arrows same size (24x24 viewBox), but different shaft lengths.
// Arrow head always points UP in the path; rotation handles direction.
// Head at top, shaft extends downward — longer shaft = longer arrow.
const ARROW_PATHS = [
  // Short shaft
  "M12 4L5 11H9V16H15V11H19L12 4Z",
  // Medium shaft
  "M12 4L5 11H9V19H15V11H19L12 4Z",
  // Long shaft
  "M12 4L5 11H9V22H15V11H19L12 4Z",
  // Medium-short shaft
  "M12 4L5 11H9V17H15V11H19L12 4Z",
  // Medium-long shaft
  "M12 4L5 11H9V20H15V11H19L12 4Z",
];

export default function ArrowSvg({ size = 24, color = '#1B2A4A', direction = 'up', variant = 0 }) {
  const rotations = { up: 0, right: 90, down: 180, left: 270 };
  const rotation = rotations[direction] || 0;
  const path = ARROW_PATHS[variant % ARROW_PATHS.length];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: [{ rotate: `${rotation}deg` }] }}
    >
      <Path d={path} fill={color} />
    </Svg>
  );
}
