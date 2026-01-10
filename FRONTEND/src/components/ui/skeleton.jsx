export default function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
      style={{
        minHeight: props.height || "1rem",
        minWidth: props.width || "100%",
        ...props.style
      }}
      {...props}
    />
  );
}