// Cloudflare Email Worker
// testarzt@facharzt-kontakt.org  → Arzt-Inbox speichern
// reply+{requestId}@...          → Terminvorschlag extrahieren

function decodeQuotedPrintable(str) {
  // Soft line breaks: =\r\n or =\n → remove
  str = str.replace(/=\r\n/g, "").replace(/=\n/g, "");
  // Convert =XX to %XX then use decodeURIComponent for correct UTF-8 handling
  str = str.replace(/=([0-9A-Fa-f]{2})/g, "%$1");
  try { return decodeURIComponent(str); } catch { return str; }
}

function decodeRFC2047(str) {
  // Decode =?charset?Q?...?= and =?charset?B?...?= encoded words
  return str.replace(/=\?([^?]+)\?([QqBb])\?([^?]*)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "Q") {
        const qp = text.replace(/_/g, " ");
        const decoded = qp.replace(/=([0-9A-Fa-f]{2})/g, "%$1");
        return decodeURIComponent(decoded);
      } else {
        const bytes = atob(text);
        const arr = new Uint8Array([...bytes].map(c => c.charCodeAt(0)));
        return new TextDecoder(charset).decode(arr);
      }
    } catch { return text; }
  });
}

function decodeBody(raw, contentType, transferEncoding) {
  // Multipart: extract text/plain part
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = raw.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"));
    for (const part of parts) {
      if (part.toLowerCase().includes("content-type: text/plain")) {
        const partBodyStart = part.indexOf("\r\n\r\n");
        if (partBodyStart === -1) continue;
        const partBody = part.slice(partBodyStart + 4).replace(/--$/, "").trim();
        const partEncMatch = part.match(/content-transfer-encoding:\s*(\S+)/i);
        const partEnc = partEncMatch ? partEncMatch[1].toLowerCase() : "";
        if (partEnc === "quoted-printable") return decodeQuotedPrintable(partBody);
        if (partEnc === "base64") {
          try { return atob(partBody.replace(/\s/g, "")); } catch { return partBody; }
        }
        return partBody;
      }
    }
  }

  // Non-multipart
  const enc = transferEncoding.toLowerCase();
  if (enc === "quoted-printable") return decodeQuotedPrintable(raw);
  if (enc === "base64") {
    try { return atob(raw.replace(/\s/g, "")); } catch { return raw; }
  }
  return raw;
}

export default {
  async email(message, env, ctx) {
    const recipient = message.to;
    const sender    = message.from;

    // Read raw email
    const reader = message.raw.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const rawEmail = new TextDecoder().decode(
      chunks.reduce((a, b) => {
        const merged = new Uint8Array(a.length + b.length);
        merged.set(a, 0);
        merged.set(b, a.length);
        return merged;
      })
    );

    const headerEnd   = rawEmail.indexOf("\r\n\r\n");
    const headerBlock = headerEnd !== -1 ? rawEmail.slice(0, headerEnd) : rawEmail;
    const rawBody     = headerEnd !== -1 ? rawEmail.slice(headerEnd + 4) : "";

    function getHeader(name) {
      const re = new RegExp(`^${name}:\\s*([\\s\\S]+?)(?=\\r\\n[^\\s]|$)`, "mi");
      const m  = headerBlock.match(re);
      return m ? m[1].replace(/\r\n\s+/g, " ").trim() : "";
    }

    const subject          = decodeRFC2047(getHeader("Subject"))   || "(kein Betreff)";
    const fromFull         = getHeader("From")                     || sender;
    const replyTo          = getHeader("Reply-To");
    const contentType      = getHeader("Content-Type")             || "";
    const transferEncoding = getHeader("Content-Transfer-Encoding")|| "";

    const bodyPlain = decodeBody(rawBody, contentType, transferEncoding);

    const formData = new FormData();
    formData.append("recipient",   recipient);
    formData.append("sender",      sender);
    formData.append("from",        fromFull);
    formData.append("subject",     subject);
    formData.append("body-plain",  bodyPlain);
    formData.append("reply-to",    replyTo);

    await fetch(`${env.BACKEND_URL}/api/inbound-email`, {
      method: "POST",
      body: formData,
    });
  },
};
