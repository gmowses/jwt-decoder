import { useState, useEffect, useCallback } from 'react'
import { Copy, Sun, Moon, Languages, CheckCircle, XCircle, Clock, AlertTriangle, Key } from 'lucide-react'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'JWT Decoder',
    subtitle: 'Decode and inspect JSON Web Tokens instantly. Everything runs client-side — your token never leaves the browser.',
    inputLabel: 'Paste your JWT token',
    inputPlaceholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    clearBtn: 'Clear',
    headerSection: 'Header',
    headerDesc: 'Algorithm and token type',
    payloadSection: 'Payload',
    payloadDesc: 'Claims and data',
    signatureSection: 'Signature',
    signatureDesc: 'Base64-encoded signature (cannot be verified client-side)',
    copyJson: 'Copy JSON',
    copied: 'Copied!',
    validToken: 'Valid format',
    invalidToken: 'Invalid JWT format',
    invalidDesc: 'Expected 3 parts separated by dots (header.payload.signature)',
    expiredLabel: 'Expired',
    validLabel: 'Valid',
    expiredAgo: 'ago',
    validFor: 'remaining',
    issuedAt: 'Issued at',
    expiresAt: 'Expires at',
    notBefore: 'Not before',
    subject: 'Subject',
    issuer: 'Issuer',
    audience: 'Audience',
    tokenId: 'Token ID',
    claimsSection: 'Registered Claims',
    algorithmLabel: 'Algorithm',
    tokenTypeLabel: 'Type',
    keyIdLabel: 'Key ID',
    emptyState: 'Paste a JWT token above to start decoding',
    second: 'second', seconds: 'seconds',
    minute: 'minute', minutes: 'minutes',
    hour: 'hour', hours: 'hours',
    day: 'day', days: 'days',
    month: 'month', months: 'months',
    year: 'year', years: 'years',
    builtBy: 'Built by',
  },
  pt: {
    title: 'JWT Decoder',
    subtitle: 'Decodifique e inspecione JSON Web Tokens instantaneamente. Tudo roda no navegador — seu token nunca sai do browser.',
    inputLabel: 'Cole seu token JWT',
    inputPlaceholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    clearBtn: 'Limpar',
    headerSection: 'Header',
    headerDesc: 'Algoritmo e tipo do token',
    payloadSection: 'Payload',
    payloadDesc: 'Claims e dados',
    signatureSection: 'Assinatura',
    signatureDesc: 'Assinatura em Base64 (nao pode ser verificada no cliente)',
    copyJson: 'Copiar JSON',
    copied: 'Copiado!',
    validToken: 'Formato valido',
    invalidToken: 'Formato JWT invalido',
    invalidDesc: 'Esperado 3 partes separadas por pontos (header.payload.assinatura)',
    expiredLabel: 'Expirado',
    validLabel: 'Valido',
    expiredAgo: 'atras',
    validFor: 'restantes',
    issuedAt: 'Emitido em',
    expiresAt: 'Expira em',
    notBefore: 'Valido a partir de',
    subject: 'Sujeito',
    issuer: 'Emissor',
    audience: 'Audiencia',
    tokenId: 'ID do token',
    claimsSection: 'Claims Registradas',
    algorithmLabel: 'Algoritmo',
    tokenTypeLabel: 'Tipo',
    keyIdLabel: 'Key ID',
    emptyState: 'Cole um token JWT acima para comecar a decodificar',
    second: 'segundo', seconds: 'segundos',
    minute: 'minuto', minutes: 'minutos',
    hour: 'hora', hours: 'horas',
    day: 'dia', days: 'dias',
    month: 'mes', months: 'meses',
    year: 'ano', years: 'anos',
    builtBy: 'Criado por',
  },
} as const

type Lang = keyof typeof translations
type Translations = { [K in keyof typeof translations.en]: string }

// ── JWT parsing ───────────────────────────────────────────────────────────────
function base64urlDecode(str: string): string {
  // Convert base64url to base64
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  // Pad to multiple of 4
  while (b64.length % 4 !== 0) b64 += '='
  try {
    return atob(b64)
  } catch {
    throw new Error('Invalid base64url encoding')
  }
}

function parseJsonPart(part: string): unknown {
  const decoded = base64urlDecode(part)
  return JSON.parse(decoded)
}

interface JWTHeader {
  alg?: string
  typ?: string
  kid?: string
  [key: string]: unknown
}

interface JWTPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  [key: string]: unknown
}

interface ParsedJWT {
  header: JWTHeader
  payload: JWTPayload
  signature: string
  raw: { header: string; payload: string; signature: string }
}

function parseJWT(token: string): ParsedJWT {
  const parts = token.trim().split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT: expected 3 parts')
  const [rawHeader, rawPayload, signature] = parts
  const header = parseJsonPart(rawHeader) as JWTHeader
  const payload = parseJsonPart(rawPayload) as JWTPayload
  return { header, payload, signature, raw: { header: rawHeader, payload: rawPayload, signature } }
}

// ── Time formatting ───────────────────────────────────────────────────────────
function fmtDuration(seconds: number, t: Translations): string {
  const abs = Math.abs(seconds)
  if (abs < 60) return `${Math.round(abs)} ${abs === 1 ? t.second : t.seconds}`
  const m = abs / 60
  if (m < 60) return `${Math.round(m)} ${Math.round(m) === 1 ? t.minute : t.minutes}`
  const h = m / 60
  if (h < 24) return `${Math.round(h)} ${Math.round(h) === 1 ? t.hour : t.hours}`
  const d = h / 24
  if (d < 30) return `${Math.round(d)} ${Math.round(d) === 1 ? t.day : t.days}`
  const mo = d / 30.44
  if (mo < 12) return `${Math.round(mo)} ${Math.round(mo) === 1 ? t.month : t.months}`
  const y = mo / 12
  return `${Math.round(y)} ${Math.round(y) === 1 ? t.year : t.years}`
}

function fmtDate(unix: number): string {
  return new Date(unix * 1000).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short',
  })
}

// ── Syntax highlighted JSON ───────────────────────────────────────────────────
function highlightJSON(json: string): string {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-blue-400'   // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = 'text-amber-400'  // key
          else cls = 'text-green-400'                    // string
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-400'
        } else if (/null/.test(match)) {
          cls = 'text-red-400'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300"
    >
      <Copy size={12} />
      {copied ? copiedLabel : label}
    </button>
  )
}

// ── JSON block ────────────────────────────────────────────────────────────────
function JsonBlock({ data, copyLabel, copiedLabel }: { data: unknown; copyLabel: string; copiedLabel: string }) {
  const json = JSON.stringify(data, null, 2)
  const highlighted = highlightJSON(json)
  return (
    <div className="relative group">
      <pre
        className="rounded-lg bg-zinc-950 dark:bg-black p-4 overflow-x-auto text-sm font-mono leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={json} label={copyLabel} copiedLabel={copiedLabel} />
      </div>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold text-sm">{title}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function JWTDecoder() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [token, setToken] = useState('')
  const [parsed, setParsed] = useState<ParsedJWT | null>(null)
  const [error, setError] = useState<string | null>(null)

  const t = translations[lang]

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const decode = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) { setParsed(null); setError(null); return }
    try {
      const result = parseJWT(trimmed)
      setParsed(result)
      setError(null)
    } catch {
      setParsed(null)
      setError(t.invalidDesc)
    }
  }, [t])

  const handleChange = (value: string) => {
    setToken(value)
    decode(value)
  }

  // Re-decode on language change (error messages update)
  useEffect(() => { if (token) decode(token) }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const now = Math.floor(Date.now() / 1000)

  // Expiration info
  let expInfo: { expired: boolean; label: string; duration: string } | null = null
  if (parsed?.payload.exp !== undefined) {
    const exp = parsed.payload.exp
    const diff = exp - now
    expInfo = {
      expired: diff < 0,
      label: diff < 0 ? t.expiredLabel : t.validLabel,
      duration: `${fmtDuration(diff, t)} ${diff < 0 ? t.expiredAgo : t.validFor}`,
    }
  }

  const isValid = parsed !== null
  const hasToken = token.trim().length > 0

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Key size={18} className="text-white" />
            </div>
            <span className="font-semibold">JWT Decoder</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle language"
            >
              <Languages size={14} />
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a
              href="https://github.com/gmowses/jwt-decoder"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t.inputLabel}</label>
              {hasToken && (
                <button
                  onClick={() => handleChange('')}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {t.clearBtn}
                </button>
              )}
            </div>
            <textarea
              value={token}
              onChange={e => handleChange(e.target.value)}
              placeholder={t.inputPlaceholder}
              spellCheck={false}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:focus:border-amber-500 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />

            {/* Status badge */}
            {hasToken && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                isValid
                  ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                  : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              }`}>
                {isValid
                  ? <CheckCircle size={15} />
                  : <XCircle size={15} />
                }
                <span className="font-medium">{isValid ? t.validToken : t.invalidToken}</span>
                {!isValid && error && <span className="text-xs opacity-80">— {error}</span>}
              </div>
            )}
          </div>

          {/* Expiration banner */}
          {parsed && expInfo && (
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              expInfo.expired
                ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                : 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
            }`}>
              {expInfo.expired ? <AlertTriangle size={18} /> : <Clock size={18} />}
              <div>
                <span className="font-semibold">{expInfo.label}</span>
                <span className="ml-2 text-sm opacity-80">{expInfo.duration}</span>
              </div>
              <div className="ml-auto text-xs opacity-60">{fmtDate(parsed.payload.exp!)}</div>
            </div>
          )}

          {/* Decoded sections */}
          {parsed && (
            <div className="space-y-4">
              {/* Header */}
              <SectionCard title={t.headerSection} desc={t.headerDesc}>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {parsed.header.alg && (
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{t.algorithmLabel}</p>
                        <p className="text-sm font-semibold font-mono text-amber-500">{parsed.header.alg}</p>
                      </div>
                    )}
                    {parsed.header.typ && (
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{t.tokenTypeLabel}</p>
                        <p className="text-sm font-semibold font-mono">{parsed.header.typ}</p>
                      </div>
                    )}
                    {parsed.header.kid && (
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{t.keyIdLabel}</p>
                        <p className="text-sm font-semibold font-mono">{parsed.header.kid}</p>
                      </div>
                    )}
                  </div>
                  <JsonBlock data={parsed.header} copyLabel={t.copyJson} copiedLabel={t.copied} />
                </div>
              </SectionCard>

              {/* Payload */}
              <SectionCard title={t.payloadSection} desc={t.payloadDesc}>
                <div className="space-y-4">
                  {/* Registered claims summary */}
                  {(parsed.payload.iss || parsed.payload.sub || parsed.payload.aud ||
                    parsed.payload.iat || parsed.payload.exp || parsed.payload.nbf ||
                    parsed.payload.jti) && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{t.claimsSection}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {parsed.payload.iss && (
                          <ClaimRow label={t.issuer} value={String(parsed.payload.iss)} />
                        )}
                        {parsed.payload.sub && (
                          <ClaimRow label={t.subject} value={String(parsed.payload.sub)} />
                        )}
                        {parsed.payload.aud && (
                          <ClaimRow
                            label={t.audience}
                            value={Array.isArray(parsed.payload.aud) ? parsed.payload.aud.join(', ') : String(parsed.payload.aud)}
                          />
                        )}
                        {parsed.payload.jti && (
                          <ClaimRow label={t.tokenId} value={String(parsed.payload.jti)} />
                        )}
                        {parsed.payload.iat !== undefined && (
                          <ClaimRow label={t.issuedAt} value={fmtDate(parsed.payload.iat)} mono={false} />
                        )}
                        {parsed.payload.exp !== undefined && (
                          <ClaimRow label={t.expiresAt} value={fmtDate(parsed.payload.exp)} mono={false} />
                        )}
                        {parsed.payload.nbf !== undefined && (
                          <ClaimRow label={t.notBefore} value={fmtDate(parsed.payload.nbf)} mono={false} />
                        )}
                      </div>
                    </div>
                  )}
                  <JsonBlock data={parsed.payload} copyLabel={t.copyJson} copiedLabel={t.copied} />
                </div>
              </SectionCard>

              {/* Signature */}
              <SectionCard title={t.signatureSection} desc={t.signatureDesc}>
                <div className="rounded-lg bg-zinc-950 dark:bg-black p-4 overflow-x-auto">
                  <code className="text-sm font-mono text-amber-400 break-all">{parsed.signature}</code>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Empty state */}
          {!hasToken && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Key size={32} className="text-amber-500" />
              </div>
              <p className="text-zinc-400 dark:text-zinc-500">{t.emptyState}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>
            {t.builtBy}{' '}
            <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-colors">
              Gabriel Mowses
            </a>
          </span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}

// ── Claim row helper ──────────────────────────────────────────────────────────
function ClaimRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2 min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium truncate ${mono ? 'font-mono' : ''}`} title={value}>{value}</p>
    </div>
  )
}
