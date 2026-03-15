export interface SynologyLinks {
  shareLink: string;
  requestLink: string;
}

function normalizeLink(link: string): string {
  let url = link.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

export function isValidSynologyLink(link: string): boolean {
  if (!link || link.trim() === "") return false;
  try {
    const url = new URL(normalizeLink(link));
    return url.pathname.includes("/sharing/");
  } catch {
    return false;
  }
}

export function parseSynologyConfig(configJson: string): SynologyLinks | null {
  try {
    const data = JSON.parse(configJson);
    const shareLink = data.synologyShareLink || "";
    const requestLink = data.synologyRequestLink || "";

    if (!shareLink && !requestLink) return null;

    return {
      shareLink: shareLink ? normalizeLink(shareLink) : "",
      requestLink: requestLink ? normalizeLink(requestLink) : "",
    };
  } catch {
    return null;
  }
}
