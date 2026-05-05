import countries from 'i18n-iso-countries'
import zhLocale from 'i18n-iso-countries/langs/zh.json'

countries.registerLocale(zhLocale)

export type TimeRange = '30min' | '1h' | '6h' | 'today' | 'yesterday' | '3d' | '7d' | '14d' | '31d'

const provinceMap: Record<string, string> = {
  '22': '北京',
  '1177': '天津',
  '1069': '河北',
  '146': '山西',
  '86': '内蒙古',
  '1464': '辽宁',
  '1445': '吉林',
  '145': '黑龙江',
  '1050': '上海',
  '120': '江苏',
  '1442': '浙江',
  '121': '安徽',
  '2': '福建',
  '1465': '江西',
  '122': '山东',
  '182': '河南',
  '1135': '湖北',
  '1466': '湖南',
  '4': '广东',
  '173': '广西',
  '1441': '海南',
  '1051': '重庆',
  '1068': '四川',
  '118': '贵州',
  '153': '云南',
  '1155': '西藏',
  '152': '陕西',
  '1208': '甘肃',
  '1467': '青海',
  '119': '宁夏',
  '1468': '新疆',
  '0': '其他',
  '1': '港澳台',
  '-1': '境外',
}

export function formatIsoUtcNoMs(date: Date) {
  return `${date.toISOString().slice(0, 19)}Z`
}

export function calculateTimeRange(range: TimeRange) {
  const now = new Date()
  let endTime = new Date(now)
  let startTime: Date

  switch (range) {
    case '30min':
      startTime = new Date(now.getTime() - 30 * 60 * 1000)
      break
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case '6h':
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
      break
    case 'today':
      startTime = new Date(now)
      startTime.setHours(0, 0, 0, 0)
      break
    case 'yesterday':
      startTime = new Date(now)
      startTime.setDate(now.getDate() - 1)
      startTime.setHours(0, 0, 0, 0)
      endTime = new Date(startTime)
      endTime.setHours(23, 59, 59, 999)
      break
    case '3d':
      startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      break
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '14d':
      startTime = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      break
    case '31d':
      startTime = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
      break
  }

  return {
    startTime: formatIsoUtcNoMs(startTime),
    endTime: formatIsoUtcNoMs(endTime),
  }
}

export function formatTimeLabel(timestamp: number, range: TimeRange) {
  const date = new Date(timestamp * 1000)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')

  if (range === '14d' || range === '31d')
    return `${month}-${day}`
  if (range === '3d' || range === '7d' || range === 'yesterday')
    return `${month}-${day} ${hour}:${minute}`
  return `${hour}:${minute}`
}

export function formatCount(value: number) {
  return Math.trunc(value).toLocaleString('zh-CN')
}

export function mixHexColor(from: string, to: string, ratio: number) {
  const parse = (hex: string) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
  const start = parse(from)
  const end = parse(to)
  const next = start.map((value, index) => Math.round(value + (end[index] - value) * ratio))
  return `#${next.map(value => value.toString(16).padStart(2, '0')).join('')}`
}

export function normalizeCountryCode(key: string) {
  const clean = key.trim().toUpperCase()
  if (/^\d{1,3}$/.test(clean))
    return countries.numericToAlpha2(clean.padStart(3, '0'))
  if (clean.length === 3)
    return countries.alpha3ToAlpha2(clean) ?? clean
  return clean
}

export function getCountryName(key: string) {
  const alpha2 = normalizeCountryCode(key)
  if (!alpha2) return key
  return countries.getName(alpha2, 'zh') ?? alpha2
}

export function getCountryNameByNumericCode(numericCode: string) {
  const alpha2 = countries.numericToAlpha2(numericCode)
  if (!alpha2) return numericCode
  return countries.getName(alpha2, 'zh') ?? alpha2
}

export function getCountryNumericCode(key: string) {
  const alpha2 = normalizeCountryCode(key)
  if (!alpha2) return undefined
  return countries.alpha2ToNumeric(alpha2)
}

export function getProvinceName(key: string) {
  const clean = key.trim()
  if (!clean || clean === '-') return '未知地区'
  return provinceMap[clean] ?? '未知地区'
}

export function formatMetricName(type: string, key: string) {
  const clean = key.replace(/`/g, '').trim()
  if (!clean || clean === '-') return 'Direct'
  if (type === 'country') return getCountryName(clean)
  if (type === 'region') return getProvinceName(clean)
  if (type === 'slug') return clean.replace(/^https?:\/\/[^/]+/, '') || '/'
  return clean
}
