/** 内联 SVG 占位图(保证离线可用;from/to 为渐变色,缺省为原站蓝粉渐变) */
export function mockPhoto(
  label: string,
  from = "#ffd3d3",
  to = "#cfe8ff"
): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="600" height="400" fill="url(#g)"/>` +
    `<text x="300" y="205" font-size="26" fill="#ffffff" text-anchor="middle" font-family="serif">${label}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
