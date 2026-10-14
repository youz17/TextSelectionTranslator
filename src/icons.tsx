// 面板图标。参考项目用 icons/*.svg 的资源文件，这里改成内联 SVG：
// 不用 web-accessible resource，也就不受页面 CSP 的 img-src 限制。
// 造型统一用纯描边（fill/stroke 由 shadow_css.ts 统一设置），只写几何。
// 注意只用 M/L/H/V/Z 和 rect/circle 这些基础图元，避免手写弧线出方向错误。

export function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6.5l4 4 4-4" />
    </svg>
  );
}

// 滑杆造型的“设置”，比齿轮更适合手写几何
export function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1.5 4h5M10.5 4h4M1.5 8h1.2M6.3 8h8.2M1.5 12h6.2M11.3 12h3.2" />
      <circle cx="8.5" cy="4" r="1.7" />
      <circle cx="4.5" cy="8" r="1.7" />
      <circle cx="9.5" cy="12" r="1.7" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 9v6" />
      <path d="M5 3h6l-1 4h1.5v2h-7V7H6z" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M13 7V4H4v10h3" />
    </svg>
  );
}

export function ErrorIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 5.5V11M10 13.8V14.2" />
    </svg>
  );
}
