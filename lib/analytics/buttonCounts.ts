import fs from 'fs'
import path from 'path'

type CategoryWord = {
  chinese?: string
  japanese?: string
}

type PracticeGroup = {
  title?: string
  words?: CategoryWord[]
}

type Category = {
  id?: string
  name?: string
  words?: CategoryWord[]
  practiceGroups?: PracticeGroup[]
}

function loadCategories(): Category[] {
  const filePath = path.resolve(process.cwd(), 'data', 'categories.json')
  const json = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(json)
}

function countWordsInCategory(category: Category): number {
  let count = 0
  if (Array.isArray(category.words)) count += category.words.length
  if (Array.isArray(category.practiceGroups)) {
    for (const group of category.practiceGroups) {
      if (Array.isArray(group.words)) count += group.words.length
    }
  }
  return count
}

export function getPerCategoryCounts() {
  const data = loadCategories()
  const perCategory: Record<string, number> = {}
  for (const c of data) {
    if (c.id === 'pronunciation') continue
    const name = c.name || c.id || 'unknown'
    perCategory[name] = countWordsInCategory(c)
  }
  return perCategory
}

export function countAllButtons(): number {
  const per = getPerCategoryCounts()
  return Object.values(per).reduce((sum, n) => sum + (n || 0), 0)
}

function isHospitalCategory(name: string): boolean {
  return /公立病院/.test(name) || /私立醫院/.test(name) || name === '中医病院'
}

function isMtrStationCategory(name: string): boolean {
  return name.startsWith('地下鉄駅名-') || name === '屯馬綫' || name === '迪士尼綫/南港島綫/昂坪360'
}

function isLrtFareZoneCategory(name: string): boolean {
  return name.startsWith('輕鐵第') || (/^第\d/.test(name) && /收費區/.test(name))
}

export function countHospitals(): number {
  const data = loadCategories()
  let total = 0
  for (const c of data) {
    if (c.id === 'pronunciation') continue
    const name = c.name || c.id || ''
    if (isHospitalCategory(name)) total += countWordsInCategory(c)
  }
  return total
}

export function countStations(options?: { includeZones?: boolean }): number {
  const includeZones = options?.includeZones === true
  const data = loadCategories()
  let total = 0
  for (const c of data) {
    if (c.id === 'pronunciation') continue
    const name = c.name || c.id || ''
    if (isMtrStationCategory(name)) total += countWordsInCategory(c)
    else if (includeZones && isLrtFareZoneCategory(name)) total += countWordsInCategory(c)
  }
  return total
}

export function getButtonCountsSummary() {
  const perCategory = getPerCategoryCounts()
  const total = Object.values(perCategory).reduce((a, b) => a + b, 0)
  const hospitals = countHospitals()
  const stationsOnly = countStations({ includeZones: false })
  const stationsWithZones = countStations({ includeZones: true })
  return {
    total,
    perCategory,
    hospitals,
    stationsOnly,
    stationsWithZones,
  }
}


