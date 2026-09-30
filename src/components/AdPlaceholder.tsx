// Reserved ad inventory. Decorative until a real ad provider is wired in, so it is
// hidden from assistive tech rather than announced as an empty region.
function AdPlaceholder({ variant }: { variant: 'banner' | 'rail' }) {
  return (
    <div className={`ad-slot ad-slot-${variant}`} aria-hidden="true">
      <span className="ad-slot-blob ad-slot-blob-1"></span>
      <span className="ad-slot-blob ad-slot-blob-2"></span>
      <span className="ad-slot-blob ad-slot-blob-3"></span>
    </div>
  );
}

export default AdPlaceholder;
