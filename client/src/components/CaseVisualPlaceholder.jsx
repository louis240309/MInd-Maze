import React from "react";

const themeLabels = {
  mansion: "MANOR ARCHIVE",
  museum: "MUSEUM ARCHIVE",
  hotel: "HOTEL ARCHIVE",
  cyberpunk: "CITY ARCHIVE",
  classic: "CASE ARCHIVE",
};

const EvidenceArtwork = ({ motif }) => {
  if (motif === "document") return <><path className="art-paper" d="M133 57h113l42 42v145H133z" /><path className="art-fold" d="M246 57v43h42" /><path className="art-ink" d="M157 128h105m-105 23h105m-105 23h78m-78 23h91" /><circle className="art-seal" cx="230" cy="210" r="13" /></>;
  if (motif === "key") return <><circle className="art-metal" cx="157" cy="145" r="40" /><circle className="art-cutout" cx="157" cy="145" r="14" /><path className="art-metal-stroke" d="m187 173 79 79m-23-23 20-20m-41 0 19-19" /></>;
  if (motif === "footprint") return <><path className="art-print" d="M160 214c-18-9-24-34-12-55 10-17 26-21 39-12 15 11 14 36 2 54-8 12-19 18-29 13Zm-3-79c-10-2-15-13-11-25 4-11 13-16 21-12 9 5 10 18 5 28-4 7-9 10-15 9Zm52 74c-18-8-22-31-10-51 9-16 24-19 37-10 14 10 13 32 2 49-8 12-19 17-29 12Zm-3-73c-9-2-13-12-9-23 4-10 12-14 20-10s8 16 3 25c-3 6-8 9-14 8Z" /></>;
  if (motif === "fiber") return <><path className="art-fiber" d="M111 204c42-95 87 39 133-64 17-39 35-45 54-38M110 218c49-80 77 25 126-60 19-33 41-42 63-35m-186 2c37 16 57 53 89 39m-42 72c50-24 64 24 118-23" /><circle className="art-highlight" cx="298" cy="101" r="8" /><circle className="art-highlight" cx="111" cy="204" r="6" /></>;
  if (motif === "glass") return <><path className="art-glass" d="M164 65h72l-8 56 34 85c8 19-5 38-25 38h-74c-20 0-33-19-25-38l34-85z" /><path className="art-glass-fill" d="m159 179 82-2 17 42c4 10-3 17-13 17h-74c-10 0-17-7-13-17z" /><path className="art-shine" d="m181 81-6 44-25 62m99 5-10-25" /></>;
  if (motif === "timepiece") return <><circle className="art-metal" cx="200" cy="150" r="76" /><circle className="art-cutout" cx="200" cy="150" r="60" /><path className="art-ink" d="M200 101v51l35 22" /><path className="art-metal-stroke" d="M186 70v-19h28v19m-14 160v18" /></>;
  if (motif === "jewelry") return <><path className="art-metal-stroke" d="M133 111q67 91 134 0l-67 121z" /><path className="art-jewel" d="m133 111 33-38h68l33 38-67 20z" /><path className="art-jewel-light" d="m166 73 34 58 34-58m-101 38h134m-67 0v122" /></>;
  return <><path className="art-object" d="m139 199 19-77 43-34 47 24 16 84-37 36h-62z" /><path className="art-object-detail" d="m158 122 42 17 45-27m-87 87 90-3m-47-77v79" /><circle className="art-highlight" cx="218" cy="151" r="8" /></>;
};

const SceneArtwork = ({ themeKey }) => {
  if (themeKey === "mansion") return <>
    <path className="art-wall" d="M55 246V99l145-57 145 57v147z" />
    <path className="art-wood" d="M55 246h290v20H55zM65 234h270v-9H65z" />
    <path className="art-window" d="M89 119h65v94H89zM97 127h49v78H97zM121 127v78m-24-39h49" />
    <path className="art-frame" d="M264 111h48v64h-48zM272 119h32v48h-32z" />
    <path className="art-chandelier" d="M200 42v40m-33 10h66m-58 0-12 28m62-28 12 28m-51-28v30m22-30v30" />
    <path className="art-furniture" d="M178 225v-57h44v57m-58 0h72v-12h-72z" />
  </>;
  if (themeKey === "museum") return <>
    <path className="art-wall" d="M48 246V77h304v169z" />
    <path className="art-column" d="M68 246V102h22v144m220 0V102h22v144M60 99h38v-11H60zm220 0h38v-11h-38z" />
    <path className="art-frame" d="M123 104h68v83h-68zM132 113h50v65h-50zM210 119h55v68h-55z" />
    <circle className="art-exhibit" cx="157" cy="143" r="15" /><path className="art-exhibit" d="M148 166h19v12h-19zM228 134h18v34h-18zm-9 35h36v8h-36z" />
    <path className="art-wood" d="M49 246h303v19H49z" />
  </>;
  if (themeKey === "hotel") return <>
    <path className="art-wall" d="M48 246V79h304v167z" />
    <path className="art-window" d="M78 101h78v91H78zM87 110h60v73H87zM117 110v73m-30-36h60" />
    <path className="art-frame" d="M232 96h68v54h-68zM240 104h52v38h-52z" />
    <path className="art-furniture" d="M175 178h142v59H175zM165 195h162v42H165zM179 179h48v27h-48z" />
    <path className="art-lamp" d="M178 178h-30v-49h30l-7 29h-16m8 20v58m-21 0h43" />
    <path className="art-wood" d="M49 246h303v19H49z" />
  </>;
  if (themeKey === "cyberpunk") return <>
    <path className="art-darkwall" d="M48 246V72h304v174z" />
    <path className="art-neon" d="M77 99h92v91H77zM88 110h70v68H88zM220 92h95v7h-95zm0 20h70v5h-70zm0 16h85v5h-85z" />
    <path className="art-console" d="M84 213h229v33H84zM103 223h55v12h-55zm67 0h11v12h-11zm23 0h11v12h-11z" />
    <path className="art-neon" d="m114 166 20-28 18 28m93 1 17-29 16 29" />
    <path className="art-floor" d="m48 246 304 0-62 24H111z" />
  </>;
  return <>
    <path className="art-wall" d="M48 246V83h304v163z" />
    <path className="art-window" d="M74 104h86v93H74zM83 113h68v75H83zM117 113v75M83 150h68" />
    <path className="art-frame" d="M229 103h72v73h-72zM238 112h54v55h-54z" />
    <path className="art-furniture" d="M190 224h121v-45H190zM181 224h140v12H181z" />
    <path className="art-wood" d="M49 246h303v19H49z" />
  </>;
};

const PortraitArtwork = ({ motif }) => {
  const index = Number(motif?.replace("portrait_", "")) || 1;
  return <>
    <circle className={`art-halo tone-${index}`} cx="200" cy="128" r="82" />
    <path className={`art-coat tone-${index}`} d="M92 300c8-81 43-122 108-122s100 41 108 122z" />
    <path className={`art-hair tone-${index}`} d="M143 133c-10-45 8-83 57-83 49 0 66 40 56 85l-14 22H155z" />
    <ellipse className="art-skin" cx="200" cy="129" rx="43" ry="53" />
    <path className={`art-hair tone-${index}`} d="M157 112c5-39 24-58 46-58 34 0 48 24 45 60-14-6-27-17-34-31-11 19-31 28-57 29z" />
    <path className="art-face" d="M183 137h2m29 0h2m-15 10v12m-12 11q12 8 24 0" />
    <path className="art-collar" d="m169 181 31 34 31-34 15 22-18 25h-56l-18-25z" />
  </>;
};

export const CaseVisualPlaceholder = ({
  type = "generic",
  themeKey = "classic",
  motif = "evidence",
  compact = false,
}) => (
  <div
    className={`case-visual-placeholder${compact ? " compact" : ""} theme-${themeKey} ${type}`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 400 300" focusable="false">
      <path className="art-background" d="M0 0h400v300H0z" />
      {type === "crime_scene"
        ? <SceneArtwork themeKey={themeKey} />
        : type === "evidence"
          ? <EvidenceArtwork motif={motif} />
          : <PortraitArtwork motif={motif} />}
      {!compact && <path className="art-plate" d="M24 24h352v252H24z" />}
    </svg>
    {!compact && <span>{themeLabels[themeKey] || themeLabels.classic} · ORIGINAL ART</span>}
  </div>
);
