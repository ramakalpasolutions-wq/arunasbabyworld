// Re-mounted on every navigation, so each page fades in.
// Opacity only: a transform here would break the fixed header.
export default function Template({ children }) {
  return <div className="page-fade">{children}</div>;
}
