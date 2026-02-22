import React from 'react';

/** A-Ads ad units – reusable block for multiple unit IDs and placements */

type Placement = 'top' | 'middle' | 'bottom';

const placementClass: Record<Placement, string> = {
  top: 'border-b bg-muted/30 py-4',
  middle: 'border-y bg-muted/30 py-4',
  bottom: 'border-t bg-muted/30 py-4',
};

type AdUnitProps = {
  unitId: string;
  placement?: Placement;
  /** Show "Advertise here" link under the iframe (e.g. unit 2428400 has it) */
  showAdvertiseLink?: boolean;
};

export default function AdUnit({
  unitId,
  placement = 'bottom',
  showAdvertiseLink = false,
}: AdUnitProps) {
  const iframeSrc = `https://acceptable.a-ads.com/${unitId}/?size=Adaptive`;
  const advertiseLink = `https://aads.com/campaigns/new/?source_id=${unitId}&source_type=ad_unit&partner=${unitId}`;

  return (
    <section
      className={`w-full ${placementClass[placement]}`}
      aria-label="Advertisement"
    >
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* BEGIN AADS AD UNIT */}
        <div
          className="w-full mx-auto relative"
          style={{ position: 'relative', zIndex: 99998 }}
        >
          <iframe
            data-aa={unitId}
            src={iframeSrc}
            title="Advertisement"
            className="border-0 p-0 w-[70%] min-h-[90px] overflow-hidden block mx-auto"
            style={{ minHeight: 90 }}
          />
          {showAdvertiseLink && (
            <div className="w-[70%] mx-auto relative flex justify-center">
              <a
                target="_blank"
                rel="noopener noreferrer sponsored"
                href={advertiseLink}
                className="inline-block text-[13px] text-[#263238] dark:text-muted-foreground px-2.5 py-1 bg-[#F8F8F9] dark:bg-muted rounded-b-md no-underline hover:underline"
              >
                Advertise here
              </a>
            </div>
          )}
        </div>
        {/* END AADS AD UNIT */}
      </div>
    </section>
  );
}
