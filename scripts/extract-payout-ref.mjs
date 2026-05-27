import fs from 'fs'

const path =
  'C:/Users/A/.cursor/projects/c-Users-A-transcaty-webapp-transacty-webapp/uploads/c__Users_A_Downloads_Create_Payout__standalone_-L1-L249-0.html'
const html = fs.readFileSync(path, 'utf8')
const m = html.match(/script type="__bundler\/template"[^>]*>([\s\S]*?)<\/script>/)
if (!m) {
  console.error('no template')
  process.exit(1)
}
const tpl = JSON.parse(m[1])

const strings = [
  'New payout',
  'Select wallet',
  'Wallet',
  'Amount',
  'Beneficiary',
  'Review',
  'Continue',
  'Back',
  'Summary',
  'payout',
  'wallet',
  'merchant',
  'BKASH',
  'orgCode',
  'me/payouts',
]
for (const s of strings) {
  if (tpl.includes(s)) console.log('FOUND:', s)
}

const classMatches = [...tpl.matchAll(/className[=:]["']([^"']+)["']/g)].map((x) => x[1])
const uniq = [...new Set(classMatches)].filter((c) => /pay|wallet|step|payout/i.test(c))
console.log('\nCLASSNAMES:', uniq.slice(0, 80).join('\n'))

const textMatches = [
  ...tpl.matchAll(/>([^<]{3,60})</g),
].map((x) => x[1].trim()).filter((t) => /payout|wallet|amount|beneficiary|sender|continue|back/i.test(t))
console.log('\nTEXT:', [...new Set(textMatches)].slice(0, 40).join('\n'))

// extract CSS rules with payout in selector
const css = tpl.match(/<style>[\s\S]*?<\/style>/i)?.[0] ?? ''
const rules = [...css.matchAll(/[^{}]*payout[^{}]*\{[^}]+\}/gi)]
console.log('\nCSS rules:', rules.length)
for (const r of rules.slice(0, 25)) console.log(r[0].slice(0, 400))
