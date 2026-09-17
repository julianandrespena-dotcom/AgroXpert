export default function Badge({
  children,
  variant = "blue",
}) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}
