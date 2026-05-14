interface ArtistFooterProps {
  instagramHandle: string
}

export function ArtistFooter({ instagramHandle }: ArtistFooterProps) {
  return (
    <footer className="flex justify-center py-6 mt-2">
      <a
        href={`https://instagram.com/${instagramHandle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-full active:scale-95 transition-transform"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
      >
        {/* Instagram gradient icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-grad)" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="4.5" stroke="url(#ig-grad)" strokeWidth="2" fill="none" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig-grad)" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: '#ccc' }}>@{instagramHandle}</span>
      </a>
    </footer>
  )
}
