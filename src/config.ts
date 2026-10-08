// Single source of truth for the Telegram bot username baked into
// download buttons. On bot swap: change this ONE line and redeploy.
// Content files store only the CODE (or a full https URL for legacy rows).
export const BOT_USERNAME = 'onlyforhtoo_bot';

export function downloadUrl(link: string): string {
  if (/^https?:\/\//i.test(link)) return link; // legacy full URL, use as-is
  return `https://t.me/${BOT_USERNAME}?start=${link}`;
}
