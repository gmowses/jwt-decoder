# JWT Decoder

JWT token decoder with header/payload inspection, expiration check, and claim analysis. Everything runs client-side — your token never leaves the browser.

**Live:** https://gmowses.github.io/jwt-decoder

## Features

- Auto-decode on paste/type
- Header section: algorithm, token type, key ID
- Payload section: all claims with syntax-highlighted JSON
- Registered claims summary: iss, sub, aud, iat, exp, nbf, jti (human-readable dates)
- Expiration check: shows "Expired X ago" or "Valid for X remaining"
- Signature section: raw base64url value
- Copy decoded JSON to clipboard
- Token format validation (3 dot-separated parts)
- Dark/light mode (respects system preference)
- i18n: English and Portuguese (BR)
- Pure `atob` decoding — no external JWT library

## Stack

- React 19 + TypeScript
- Tailwind CSS v4
- Vite
- Lucide React (icons)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## License

MIT — Gabriel Mowses
