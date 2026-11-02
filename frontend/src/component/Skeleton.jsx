const Skeleton = ({ className = "", style }) => (
  <div aria-hidden="true" className={`skeleton-shimmer ${className}`} style={style} />
);

export default Skeleton;
