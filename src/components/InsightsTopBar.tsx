"use client";

export default function InsightsTopBar() {
  return (
    <div className="flex items-center justify-end h-14 px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* Bell */}
        <div className="relative">
          <button
            className="flex items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]"
            style={{ width: 32, height: 32, color: 'var(--color-gray-800, #222428)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M8.00228 1.33337C5.57825 1.33337 3.54861 3.17018 3.30741 5.58218L2.73229 11.3334H1.33301V12.6667H14.6689V11.3334H13.2723L12.6972 5.58217C12.456 3.17018 10.4263 1.33337 8.00228 1.33337ZM11.3704 5.71485L11.9323 11.3334H4.07227L4.63412 5.71485C4.80716 3.98445 6.26325 2.66671 8.00228 2.66671C9.7413 2.66671 11.1974 3.98445 11.3704 5.71485Z" fill="currentColor" />
              <path d="M6.66634 13.3334H9.33301V14L8.66634 14.6667H7.33301L6.66634 14V13.3334Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Create button */}
        <button
          className="flex items-center gap-1 text-md font-medium text-white rounded-full cursor-pointer hover:brightness-110 transition-all"
          style={{ background: '#2A2A2D', padding: '8px 16px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create
        </button>
      </div>
    </div>
  );
}
