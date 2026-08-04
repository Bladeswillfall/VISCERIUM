export const rightsConfig = Object.freeze({
  visceriumCreative: Object.freeze({
    startYear: 2021,
    creator: 'Fall',
    currentOwner: 'Fall',
    futureOwner: 'NULL Holdings Ltd',
  }),
  nullMaterials: Object.freeze({
    startYear: 2025,
    currentOwner: 'Fall',
    futureOwner: 'NULL Holdings Ltd',
  }),
  firstPartyCode: Object.freeze({
    startYear: 2026,
    currentOwner: 'Fall',
    futureOwner: 'NULL Holdings Ltd',
  }),
});

export function currentCopyrightYear(date = new Date()) {
  const year = date.getUTCFullYear();
  if (!Number.isInteger(year)) {
    throw new TypeError('Current copyright year must be an integer.');
  }
  return year;
}

export function formatYearRange(startYear, endYear = currentCopyrightYear()) {
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    throw new TypeError('Copyright years must be integers.');
  }
  if (startYear > endYear) {
    throw new RangeError(`Copyright start year ${startYear} cannot exceed ${endYear}.`);
  }
  return startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;
}

export function visceriumCreativeNotice(endYear = currentCopyrightYear()) {
  const rights = rightsConfig.visceriumCreative;
  return `VISCERIUM created by ${rights.creator}. © ${formatYearRange(rights.startYear, endYear)} ${rights.currentOwner}. All rights reserved.`;
}

export function plannedVisceriumNotice(endYear = currentCopyrightYear()) {
  const rights = rightsConfig.visceriumCreative;
  return `VISCERIUM created by ${rights.creator}. © ${formatYearRange(rights.startYear, endYear)} ${rights.futureOwner}. All rights reserved.`;
}

export function nullMaterialsNotice(endYear = currentCopyrightYear()) {
  const rights = rightsConfig.nullMaterials;
  return `NULL and its foundational materials © ${formatYearRange(rights.startYear, endYear)} ${rights.currentOwner}. All rights reserved.`;
}

export function firstPartyCodeNotice(endYear = currentCopyrightYear()) {
  const rights = rightsConfig.firstPartyCode;
  return `Copyright (c) ${formatYearRange(rights.startYear, endYear)} ${rights.currentOwner}`;
}
