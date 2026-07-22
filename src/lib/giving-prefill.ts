// Deep-link builder for common giving platforms.
// Returns { url, prefilled } — prefilled=true means the amount was baked into
// the URL; false means the user still needs to type/paste the amount on the
// destination page (we copy it to the clipboard for them).

export type PrefillResult = { url: string; prefilled: boolean; note?: string };

function money(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

function withParam(url: string, key: string, value: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    // not a valid URL — return as-is
    return url;
  }
}

export function buildGivingLink(givingUrl: string | null | undefined, amountCents: number): PrefillResult {
  if (!givingUrl) return { url: "", prefilled: false };
  const host = (() => { try { return new URL(givingUrl).hostname.toLowerCase(); } catch { return ""; } })();
  const amt = money(amountCents);

  // Tithe.ly — supports ?amount=
  if (host.includes("tithe.ly")) {
    return { url: withParam(givingUrl, "amount", amt), prefilled: true };
  }
  // DonorBox — ?default_interval=o&amount=
  if (host.includes("donorbox.org")) {
    let u = withParam(givingUrl, "default_interval", "o");
    u = withParam(u, "amount", amt);
    return { url: u, prefilled: true };
  }
  // Overflow — does not accept prefill in public URL
  // Pushpay, Givelify, EasyTithe, Generis — same
  return {
    url: givingUrl,
    prefilled: false,
    note: "This platform doesn't accept a preset amount in the URL — we've copied the amount for you.",
  };
}

export async function copyAmountToClipboard(amountCents: number): Promise<void> {
  try {
    await navigator.clipboard.writeText(money(amountCents));
  } catch {
    /* ignore */
  }
}
