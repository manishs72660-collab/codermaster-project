function TagPill({ tag }) {
  return (
    <span className="tag-pill text-white/35 border-white/10 bg-white/[0.03]">
      #{tag}
    </span>
  );
}

export default TagPill;