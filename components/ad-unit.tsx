import React from 'react';

/** A-Ads ad unit 2428400 – single reusable block for site-wide placement */
const AD_UNIT_ID = '2428400';
const IFRAME_SRC = `https://acceptable.a-ads.com/${AD_UNIT_ID}/?size=Adaptive`;
const ADVERTISE_LINK = `https://aads.com/campaigns/new/?source_id=${AD_UNIT_ID}&source_type=ad_unit&partner=${AD_UNIT_ID}`;

export default function AdUnit() {
  return (
    <section
      className="w-full border-t bg-muted/30 py-4"
      aria-label="Advertisement"
    >
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* BEGIN AADS AD UNIT 2428400 */}
        <div
          className="w-full mx-auto relative"
          style={{ position: 'relative', zIndex: 99998 }}
        >
          <iframe
            data-aa={AD_UNIT_ID}
            src={IFRAME_SRC}
            title="Advertisement"
            className="border-0 p-0 w-[70%] min-h-[90px] overflow-hidden block mx-auto"
            style={{ minHeight: 90 }}
          />
          <div className="w-[70%] mx-auto relative flex justify-center">
            <a
              target="_blank"
              rel="noopener noreferrer sponsored"
              href={ADVERTISE_LINK}
              className="inline-block text-[13px] text-[#263238] dark:text-muted-foreground px-2.5 py-1 bg-[#F8F8F9] dark:bg-muted rounded-b-md no-underline hover:underline"
            >
              Advertise here
            </a>
          </div>
        </div>
        {/* END AADS AD UNIT 2428400 */}
      </div>
    </section>
  );
}
