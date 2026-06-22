<script lang="ts">
  type CurrencyCode = 'USD' | 'AUD';

  interface FxAssumption {
    baseCurrency: 'USD';
    audPerUsd: number;
    usdPerAud: number;
    asOf: string;
    sourceLabel: string;
    sourceUrl: string;
  }

  interface CurrencyDefinition {
    code: CurrencyCode;
    label: string;
  }

  interface CurrencyConverter {
    toDisplay(usdValue: number, currency: CurrencyCode): number;
    toUsd(displayValue: number, currency: CurrencyCode): number;
  }

  type ValidationStatus = 'pass' | 'warn' | 'fail';

  interface ValidationCheck {
    name: string;
    status: ValidationStatus;
    notes: string;
  }

  let { workbookHref = '/budget.xlsx' }: { workbookHref?: string } = $props();

  function cn(...inputs: unknown[]) {
    const classes: string[] = [];

    function collect(input: unknown): void {
      if (!input) return;
      if (Array.isArray(input)) {
        input.forEach(collect);
        return;
      }
      if (typeof input === 'object') {
        for (const [key, value] of Object.entries(input)) {
          if (value) classes.push(key);
        }
        return;
      }
      classes.push(String(input));
    }

    inputs.forEach(collect);
    return classes.join(' ');
  }

  const model: any = {
  "metadata": {
    "title": "NYU CS Master's NYC Budget Model",
    "generatedAt": "2026-06-19T04:32:38.604Z",
    "modelVersion": "1.0.0",
    "zoriLatestDate": "2026-05-31",
    "currency": "USD",
    "months": 24
  },
  "fxAssumption": {
    "baseCurrency": "USD",
    "displayCurrencies": [
      "USD",
      "AUD"
    ],
    "usdPerAud": 0.7031,
    "audPerUsd": 1.422273,
    "asOf": "2026-06-18",
    "sourceLabel": "Reserve Bank of Australia F11.1 Exchange Rates",
    "sourceUrl": "https://www.rba.gov.au/statistics/tables/csv/f11.1-data.csv",
    "quote": "A$1 = USD 0.7031"
  },
  "selectedDefaults": {
    "campusAnchor": "Courant/Washington Square",
    "lifestyleTier": "Affordable",
    "neighborhood": "Astoria / Long Island City",
    "startMonth": "2026-09-01",
    "financialAidAnnual": 0,
    "startingSavings": 0,
    "monthlyIncome": 0,
    "reserveMonths": 3,
    "year2Escalation": 0.04
  },
  "nyuCosts": {
    "tuitionFeesAnnual": 65048,
    "roomBoardAnnualReference": 25516,
    "travelPersonalAnnualReference": 5850,
    "healthInsuranceAnnual": 2490
  },
  "reference": {
    "nyuAnnualCOA": 98904,
    "nyuTwoYearBaselineWithEscalation": 201764
  },
  "countyCosts": {
    "New York County": {
      "foodAnnual": 7116,
      "internetMobileAnnual": 1627,
      "civicAnnual": 3456,
      "otherAnnual": 4715
    },
    "Kings County": {
      "foodAnnual": 5118,
      "internetMobileAnnual": 1594,
      "civicAnnual": 3456,
      "otherAnnual": 4715
    },
    "Queens County": {
      "foodAnnual": 4568,
      "internetMobileAnnual": 1601,
      "civicAnnual": 3456,
      "otherAnnual": 4715
    }
  },
  "lifestyleTiers": [
    {
      "id": "cheap",
      "label": "Cheap",
      "housingPosture": "Shared room in a roommate apartment; older walk-up acceptable",
      "rentFactor": 0.52,
      "foodFactor": 0.95,
      "internetMobileFactor": 0.85,
      "personalFactor": 0.62,
      "utilitiesMonthly": 115,
      "transitMonthly": 120,
      "travelAnnual": 1000,
      "moveInSetup": 1500
    },
    {
      "id": "affordable",
      "label": "Affordable",
      "housingPosture": "Roommate-friendly, better room/building mix; occasional private sublet possible",
      "rentFactor": 0.72,
      "foodFactor": 1.25,
      "internetMobileFactor": 1,
      "personalFactor": 1,
      "utilitiesMonthly": 180,
      "transitMonthly": 152,
      "travelAnnual": 2200,
      "moveInSetup": 3000
    },
    {
      "id": "bougie",
      "label": "Bougie",
      "housingPosture": "Private studio/1BR or premium share, stronger amenities and more convenience spend",
      "rentFactor": 1.18,
      "foodFactor": 2.1,
      "internetMobileFactor": 1.25,
      "personalFactor": 1.85,
      "utilitiesMonthly": 275,
      "transitMonthly": 330,
      "travelAnnual": 4200,
      "moveInSetup": 6500
    }
  ],
  "neighborhoods": [
    {
      "name": "Greenwich Village / NoHo",
      "borough": "Manhattan",
      "county": "New York County",
      "zips": [
        "10003",
        "10012"
      ],
      "commuteMin": 6,
      "commuteMode": "Walk",
      "notes": "Closest to Courant; strongest convenience premium.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 5271,
      "zoriYoY": 0.1002669745780046,
      "zipRentObservations": [
        {
          "zip": "10003",
          "latestRent": 5350,
          "yoyChange": 0.10031951343505918
        },
        {
          "zip": "10012",
          "latestRent": 5193,
          "yoyChange": 0.10021443572095001
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 2750,
          "food": 563,
          "utilities": 115,
          "internetMobile": 115,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 4168,
          "movingCash": 4250,
          "emergencyReserve": 12504,
          "tuition": 132698,
          "insurance": 5080,
          "living": 102033,
          "totalRequired": 244060,
          "cashTarget": 256564
        },
        "Affordable": {
          "rent": 3800,
          "food": 741,
          "utilities": 180,
          "internetMobile": 136,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 5873,
          "movingCash": 6800,
          "emergencyReserve": 17619,
          "tuition": 132698,
          "insurance": 5080,
          "living": 143771,
          "totalRequired": 288349,
          "cashTarget": 305968
        },
        "Bougie": {
          "rent": 6225,
          "food": 1245,
          "utilities": 275,
          "internetMobile": 169,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 9854,
          "movingCash": 12725,
          "emergencyReserve": 29562,
          "tuition": 132698,
          "insurance": 5080,
          "living": 241226,
          "totalRequired": 391728,
          "cashTarget": 421290
        }
      }
    },
    {
      "name": "East Village / Lower East Side",
      "borough": "Manhattan",
      "county": "New York County",
      "zips": [
        "10009",
        "10002"
      ],
      "commuteMin": 18,
      "commuteMode": "Subway / walk",
      "notes": "Close to campus with more nightlife and older inventory.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 4799,
      "zoriYoY": 0.08585752182329942,
      "zipRentObservations": [
        {
          "zip": "10009",
          "latestRent": 4754,
          "yoyChange": 0.0877920862759598
        },
        {
          "zip": "10002",
          "latestRent": 4844,
          "yoyChange": 0.08392295737063904
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 2500,
          "food": 563,
          "utilities": 115,
          "internetMobile": 115,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 3918,
          "movingCash": 4000,
          "emergencyReserve": 11754,
          "tuition": 132698,
          "insurance": 5080,
          "living": 95913,
          "totalRequired": 237690,
          "cashTarget": 249444
        },
        "Affordable": {
          "rent": 3450,
          "food": 741,
          "utilities": 180,
          "internetMobile": 136,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 5523,
          "movingCash": 6450,
          "emergencyReserve": 16569,
          "tuition": 132698,
          "insurance": 5080,
          "living": 135203,
          "totalRequired": 279431,
          "cashTarget": 296000
        },
        "Bougie": {
          "rent": 5675,
          "food": 1245,
          "utilities": 275,
          "internetMobile": 169,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 9304,
          "movingCash": 12175,
          "emergencyReserve": 27912,
          "tuition": 132698,
          "insurance": 5080,
          "living": 227762,
          "totalRequired": 377714,
          "cashTarget": 405626
        }
      }
    },
    {
      "name": "Chelsea / Flatiron",
      "borough": "Manhattan",
      "county": "New York County",
      "zips": [
        "10011",
        "10010"
      ],
      "commuteMin": 18,
      "commuteMode": "Subway / walk",
      "notes": "Central, convenient, expensive.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 5527,
      "zoriYoY": 0.07019472175447938,
      "zipRentObservations": [
        {
          "zip": "10011",
          "latestRent": 5786,
          "yoyChange": 0.07901063923434415
        },
        {
          "zip": "10010",
          "latestRent": 5268,
          "yoyChange": 0.06137880427461462
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 2875,
          "food": 563,
          "utilities": 115,
          "internetMobile": 115,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 4293,
          "movingCash": 4375,
          "emergencyReserve": 12879,
          "tuition": 132698,
          "insurance": 5080,
          "living": 105093,
          "totalRequired": 247245,
          "cashTarget": 260124
        },
        "Affordable": {
          "rent": 3975,
          "food": 741,
          "utilities": 180,
          "internetMobile": 136,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 6048,
          "movingCash": 6975,
          "emergencyReserve": 18144,
          "tuition": 132698,
          "insurance": 5080,
          "living": 148055,
          "totalRequired": 292808,
          "cashTarget": 310952
        },
        "Bougie": {
          "rent": 6525,
          "food": 1245,
          "utilities": 275,
          "internetMobile": 169,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 10154,
          "movingCash": 13025,
          "emergencyReserve": 30462,
          "tuition": 132698,
          "insurance": 5080,
          "living": 248570,
          "totalRequired": 399372,
          "cashTarget": 429834
        }
      }
    },
    {
      "name": "Downtown Brooklyn / Fort Greene",
      "borough": "Brooklyn",
      "county": "Kings County",
      "zips": [
        "11201",
        "11217",
        "11205"
      ],
      "commuteMin": 28,
      "commuteMode": "A/C/F/R subway",
      "notes": "Large new-rental supply and direct access to Manhattan.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 4366,
      "zoriYoY": 0.06077034390757041,
      "zipRentObservations": [
        {
          "zip": "11201",
          "latestRent": 4661,
          "yoyChange": 0.05074056544510208
        },
        {
          "zip": "11217",
          "latestRent": 4475,
          "yoyChange": 0.0745120982736942
        },
        {
          "zip": "11205",
          "latestRent": 3963,
          "yoyChange": 0.05705836800391495
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 2275,
          "food": 405,
          "utilities": 115,
          "internetMobile": 113,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 3533,
          "movingCash": 3775,
          "emergencyReserve": 10599,
          "tuition": 132698,
          "insurance": 5080,
          "living": 86488,
          "totalRequired": 228040,
          "cashTarget": 238639
        },
        "Affordable": {
          "rent": 3150,
          "food": 533,
          "utilities": 180,
          "internetMobile": 133,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 5012,
          "movingCash": 6150,
          "emergencyReserve": 15036,
          "tuition": 132698,
          "insurance": 5080,
          "living": 122694,
          "totalRequired": 266621,
          "cashTarget": 281657
        },
        "Bougie": {
          "rent": 5150,
          "food": 896,
          "utilities": 275,
          "internetMobile": 166,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 8427,
          "movingCash": 11650,
          "emergencyReserve": 25281,
          "tuition": 132698,
          "insurance": 5080,
          "living": 206293,
          "totalRequired": 355720,
          "cashTarget": 381001
        }
      }
    },
    {
      "name": "Williamsburg / Greenpoint",
      "borough": "Brooklyn",
      "county": "Kings County",
      "zips": [
        "11211",
        "11222"
      ],
      "commuteMin": 32,
      "commuteMode": "L/G subway",
      "notes": "High demand, lifestyle-heavy Brooklyn option.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 4695,
      "zoriYoY": 0.053452824173180424,
      "zipRentObservations": [
        {
          "zip": "11211",
          "latestRent": 4803,
          "yoyChange": 0.06490744438382534
        },
        {
          "zip": "11222",
          "latestRent": 4587,
          "yoyChange": 0.04199820396253551
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 2450,
          "food": 405,
          "utilities": 115,
          "internetMobile": 113,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 3708,
          "movingCash": 3950,
          "emergencyReserve": 11124,
          "tuition": 132698,
          "insurance": 5080,
          "living": 90772,
          "totalRequired": 232499,
          "cashTarget": 243623
        },
        "Affordable": {
          "rent": 3375,
          "food": 533,
          "utilities": 180,
          "internetMobile": 133,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 5237,
          "movingCash": 6375,
          "emergencyReserve": 15711,
          "tuition": 132698,
          "insurance": 5080,
          "living": 128202,
          "totalRequired": 272354,
          "cashTarget": 288065
        },
        "Bougie": {
          "rent": 5550,
          "food": 896,
          "utilities": 275,
          "internetMobile": 166,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 8827,
          "movingCash": 12050,
          "emergencyReserve": 26481,
          "tuition": 132698,
          "insurance": 5080,
          "living": 216085,
          "totalRequired": 365912,
          "cashTarget": 392393
        }
      }
    },
    {
      "name": "Astoria / Long Island City",
      "borough": "Queens",
      "county": "Queens County",
      "zips": [
        "11101",
        "11102",
        "11103",
        "11106"
      ],
      "commuteMin": 34,
      "commuteMode": "N/W/7/E/M subway",
      "notes": "Balanced commute/cost option; LIC is pricier than Astoria.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 3340,
      "zoriYoY": 0.039664092461696,
      "zipRentObservations": [
        {
          "zip": "11101",
          "latestRent": 4318,
          "yoyChange": 0.03208990459753225
        },
        {
          "zip": "11102",
          "latestRent": 3025,
          "yoyChange": 0.018124819927404445
        },
        {
          "zip": "11103",
          "latestRent": 2945,
          "yoyChange": 0.06385285438133592
        },
        {
          "zip": "11106",
          "latestRent": 3071,
          "yoyChange": 0.04458879094051138
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 1725,
          "food": 362,
          "utilities": 115,
          "internetMobile": 113,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 2940,
          "movingCash": 3225,
          "emergencyReserve": 8820,
          "tuition": 132698,
          "insurance": 5080,
          "living": 71971,
          "totalRequired": 212974,
          "cashTarget": 221794
        },
        "Affordable": {
          "rent": 2400,
          "food": 476,
          "utilities": 180,
          "internetMobile": 133,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 4205,
          "movingCash": 5400,
          "emergencyReserve": 12615,
          "tuition": 132698,
          "insurance": 5080,
          "living": 102938,
          "totalRequired": 246116,
          "cashTarget": 258731
        },
        "Bougie": {
          "rent": 3950,
          "food": 799,
          "utilities": 275,
          "internetMobile": 167,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 7131,
          "movingCash": 10450,
          "emergencyReserve": 21393,
          "tuition": 132698,
          "insurance": 5080,
          "living": 174567,
          "totalRequired": 322794,
          "cashTarget": 344187
        }
      }
    },
    {
      "name": "Bushwick / Ridgewood",
      "borough": "Brooklyn / Queens",
      "county": "Kings County",
      "zips": [
        "11237",
        "11221",
        "11385"
      ],
      "commuteMin": 45,
      "commuteMode": "L/M subway",
      "notes": "More cost control, longer commute, lively roommate market.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 3532,
      "zoriYoY": 0.05592515962714728,
      "zipRentObservations": [
        {
          "zip": "11237",
          "latestRent": 3728,
          "yoyChange": 0.05297121765534252
        },
        {
          "zip": "11221",
          "latestRent": 3527,
          "yoyChange": 0.05104291803283023
        },
        {
          "zip": "11385",
          "latestRent": 3340,
          "yoyChange": 0.0637613431932691
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 1825,
          "food": 405,
          "utilities": 115,
          "internetMobile": 113,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 3083,
          "movingCash": 3325,
          "emergencyReserve": 9249,
          "tuition": 132698,
          "insurance": 5080,
          "living": 75472,
          "totalRequired": 216574,
          "cashTarget": 225823
        },
        "Affordable": {
          "rent": 2550,
          "food": 533,
          "utilities": 180,
          "internetMobile": 133,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 4412,
          "movingCash": 5550,
          "emergencyReserve": 13236,
          "tuition": 132698,
          "insurance": 5080,
          "living": 108006,
          "totalRequired": 251333,
          "cashTarget": 264569
        },
        "Bougie": {
          "rent": 4175,
          "food": 896,
          "utilities": 275,
          "internetMobile": 166,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 7452,
          "movingCash": 10675,
          "emergencyReserve": 22356,
          "tuition": 132698,
          "insurance": 5080,
          "living": 182425,
          "totalRequired": 330877,
          "cashTarget": 353233
        }
      }
    },
    {
      "name": "Crown Heights / Prospect Lefferts",
      "borough": "Brooklyn",
      "county": "Kings County",
      "zips": [
        "11225",
        "11238",
        "11216"
      ],
      "commuteMin": 43,
      "commuteMode": "2/3/4/5/B/Q subway",
      "notes": "Often better rent per room with longer travel time.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 3620,
      "zoriYoY": 0.05220319250504043,
      "zipRentObservations": [
        {
          "zip": "11225",
          "latestRent": 3346,
          "yoyChange": 0.0513037778214358
        },
        {
          "zip": "11238",
          "latestRent": 4023,
          "yoyChange": 0.04997149643521426
        },
        {
          "zip": "11216",
          "latestRent": 3492,
          "yoyChange": 0.05533430325847122
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 1875,
          "food": 405,
          "utilities": 115,
          "internetMobile": 113,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 3133,
          "movingCash": 3375,
          "emergencyReserve": 9399,
          "tuition": 132698,
          "insurance": 5080,
          "living": 76696,
          "totalRequired": 217848,
          "cashTarget": 227247
        },
        "Affordable": {
          "rent": 2600,
          "food": 533,
          "utilities": 180,
          "internetMobile": 133,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 4462,
          "movingCash": 5600,
          "emergencyReserve": 13386,
          "tuition": 132698,
          "insurance": 5080,
          "living": 109230,
          "totalRequired": 252607,
          "cashTarget": 265993
        },
        "Bougie": {
          "rent": 4275,
          "food": 896,
          "utilities": 275,
          "internetMobile": 166,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 7552,
          "movingCash": 10775,
          "emergencyReserve": 22656,
          "tuition": 132698,
          "insurance": 5080,
          "living": 184873,
          "totalRequired": 333425,
          "cashTarget": 356081
        }
      }
    },
    {
      "name": "Harlem / Washington Heights",
      "borough": "Manhattan",
      "county": "New York County",
      "zips": [
        "10027",
        "10031",
        "10032",
        "10033"
      ],
      "commuteMin": 38,
      "commuteMode": "A/C/B/D/1 subway",
      "notes": "Manhattan address with a lower rent base than downtown.",
      "zoriLatestDate": "2026-05-31",
      "zoriBaseRent": 3101,
      "zoriYoY": 0.06203475373566625,
      "zipRentObservations": [
        {
          "zip": "10027",
          "latestRent": 3584,
          "yoyChange": 0.052062849264526534
        },
        {
          "zip": "10031",
          "latestRent": 3129,
          "yoyChange": 0.07035234052236827
        },
        {
          "zip": "10032",
          "latestRent": 2819,
          "yoyChange": 0.053281629035124345
        },
        {
          "zip": "10033",
          "latestRent": 2873,
          "yoyChange": 0.07244219612064584
        }
      ],
      "tiers": {
        "Cheap": {
          "rent": 1625,
          "food": 563,
          "utilities": 115,
          "internetMobile": 115,
          "personal": 422,
          "transit": 120,
          "travel": 83,
          "monthlyLiving": 3043,
          "movingCash": 3125,
          "emergencyReserve": 9129,
          "tuition": 132698,
          "insurance": 5080,
          "living": 74493,
          "totalRequired": 215395,
          "cashTarget": 224524
        },
        "Affordable": {
          "rent": 2225,
          "food": 741,
          "utilities": 180,
          "internetMobile": 136,
          "personal": 681,
          "transit": 152,
          "travel": 183,
          "monthlyLiving": 4298,
          "movingCash": 5225,
          "emergencyReserve": 12894,
          "tuition": 132698,
          "insurance": 5080,
          "living": 105215,
          "totalRequired": 248218,
          "cashTarget": 261112
        },
        "Bougie": {
          "rent": 3650,
          "food": 1245,
          "utilities": 275,
          "internetMobile": 169,
          "personal": 1260,
          "transit": 330,
          "travel": 350,
          "monthlyLiving": 7279,
          "movingCash": 10150,
          "emergencyReserve": 21837,
          "tuition": 132698,
          "insurance": 5080,
          "living": 178190,
          "totalRequired": 326117,
          "cashTarget": 347954
        }
      }
    }
  ],
  "monthlySeries": [
    {
      "month": "2026-09-01",
      "label": "Sep 2026",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 32524,
      "healthInsurance": 2490,
      "living": 4205,
      "moving": 5400,
      "totalOutflow": 44619
    },
    {
      "month": "2026-10-01",
      "label": "Oct 2026",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2026-11-01",
      "label": "Nov 2026",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2026-12-01",
      "label": "Dec 2026",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-01-01",
      "label": "Jan 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 32524,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 36729
    },
    {
      "month": "2027-02-01",
      "label": "Feb 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-03-01",
      "label": "Mar 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-04-01",
      "label": "Apr 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-05-01",
      "label": "May 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-06-01",
      "label": "Jun 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-07-01",
      "label": "Jul 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-08-01",
      "label": "Aug 2027",
      "academicYear": 1,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4205,
      "moving": 0,
      "totalOutflow": 4205
    },
    {
      "month": "2027-09-01",
      "label": "Sep 2027",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 33825,
      "healthInsurance": 2590,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 40788
    },
    {
      "month": "2027-10-01",
      "label": "Oct 2027",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2027-11-01",
      "label": "Nov 2027",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2027-12-01",
      "label": "Dec 2027",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2028-01-01",
      "label": "Jan 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 33825,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 38198
    },
    {
      "month": "2028-02-01",
      "label": "Feb 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2028-03-01",
      "label": "Mar 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2028-04-01",
      "label": "Apr 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2028-05-01",
      "label": "May 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2028-06-01",
      "label": "Jun 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2028-07-01",
      "label": "Jul 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    },
    {
      "month": "2028-08-01",
      "label": "Aug 2028",
      "academicYear": 2,
      "neighborhood": "Astoria / Long Island City",
      "lifestyleTier": "Affordable",
      "tuition": 0,
      "healthInsurance": 0,
      "living": 4373,
      "moving": 0,
      "totalOutflow": 4373
    }
  ],
  "scenarioMatrix": [
    {
      "neighborhood": "Greenwich Village / NoHo",
      "borough": "Manhattan",
      "lifestyleTier": "Cheap",
      "commuteMin": 6,
      "monthlyLiving": 4168,
      "modeledRent": 2750,
      "movingCash": 4250,
      "totalRequired": 244060,
      "cashTarget": 256564
    },
    {
      "neighborhood": "Greenwich Village / NoHo",
      "borough": "Manhattan",
      "lifestyleTier": "Affordable",
      "commuteMin": 6,
      "monthlyLiving": 5873,
      "modeledRent": 3800,
      "movingCash": 6800,
      "totalRequired": 288349,
      "cashTarget": 305968
    },
    {
      "neighborhood": "Greenwich Village / NoHo",
      "borough": "Manhattan",
      "lifestyleTier": "Bougie",
      "commuteMin": 6,
      "monthlyLiving": 9854,
      "modeledRent": 6225,
      "movingCash": 12725,
      "totalRequired": 391728,
      "cashTarget": 421290
    },
    {
      "neighborhood": "East Village / Lower East Side",
      "borough": "Manhattan",
      "lifestyleTier": "Cheap",
      "commuteMin": 18,
      "monthlyLiving": 3918,
      "modeledRent": 2500,
      "movingCash": 4000,
      "totalRequired": 237690,
      "cashTarget": 249444
    },
    {
      "neighborhood": "East Village / Lower East Side",
      "borough": "Manhattan",
      "lifestyleTier": "Affordable",
      "commuteMin": 18,
      "monthlyLiving": 5523,
      "modeledRent": 3450,
      "movingCash": 6450,
      "totalRequired": 279431,
      "cashTarget": 296000
    },
    {
      "neighborhood": "East Village / Lower East Side",
      "borough": "Manhattan",
      "lifestyleTier": "Bougie",
      "commuteMin": 18,
      "monthlyLiving": 9304,
      "modeledRent": 5675,
      "movingCash": 12175,
      "totalRequired": 377714,
      "cashTarget": 405626
    },
    {
      "neighborhood": "Chelsea / Flatiron",
      "borough": "Manhattan",
      "lifestyleTier": "Cheap",
      "commuteMin": 18,
      "monthlyLiving": 4293,
      "modeledRent": 2875,
      "movingCash": 4375,
      "totalRequired": 247245,
      "cashTarget": 260124
    },
    {
      "neighborhood": "Chelsea / Flatiron",
      "borough": "Manhattan",
      "lifestyleTier": "Affordable",
      "commuteMin": 18,
      "monthlyLiving": 6048,
      "modeledRent": 3975,
      "movingCash": 6975,
      "totalRequired": 292808,
      "cashTarget": 310952
    },
    {
      "neighborhood": "Chelsea / Flatiron",
      "borough": "Manhattan",
      "lifestyleTier": "Bougie",
      "commuteMin": 18,
      "monthlyLiving": 10154,
      "modeledRent": 6525,
      "movingCash": 13025,
      "totalRequired": 399372,
      "cashTarget": 429834
    },
    {
      "neighborhood": "Downtown Brooklyn / Fort Greene",
      "borough": "Brooklyn",
      "lifestyleTier": "Cheap",
      "commuteMin": 28,
      "monthlyLiving": 3533,
      "modeledRent": 2275,
      "movingCash": 3775,
      "totalRequired": 228040,
      "cashTarget": 238639
    },
    {
      "neighborhood": "Downtown Brooklyn / Fort Greene",
      "borough": "Brooklyn",
      "lifestyleTier": "Affordable",
      "commuteMin": 28,
      "monthlyLiving": 5012,
      "modeledRent": 3150,
      "movingCash": 6150,
      "totalRequired": 266621,
      "cashTarget": 281657
    },
    {
      "neighborhood": "Downtown Brooklyn / Fort Greene",
      "borough": "Brooklyn",
      "lifestyleTier": "Bougie",
      "commuteMin": 28,
      "monthlyLiving": 8427,
      "modeledRent": 5150,
      "movingCash": 11650,
      "totalRequired": 355720,
      "cashTarget": 381001
    },
    {
      "neighborhood": "Williamsburg / Greenpoint",
      "borough": "Brooklyn",
      "lifestyleTier": "Cheap",
      "commuteMin": 32,
      "monthlyLiving": 3708,
      "modeledRent": 2450,
      "movingCash": 3950,
      "totalRequired": 232499,
      "cashTarget": 243623
    },
    {
      "neighborhood": "Williamsburg / Greenpoint",
      "borough": "Brooklyn",
      "lifestyleTier": "Affordable",
      "commuteMin": 32,
      "monthlyLiving": 5237,
      "modeledRent": 3375,
      "movingCash": 6375,
      "totalRequired": 272354,
      "cashTarget": 288065
    },
    {
      "neighborhood": "Williamsburg / Greenpoint",
      "borough": "Brooklyn",
      "lifestyleTier": "Bougie",
      "commuteMin": 32,
      "monthlyLiving": 8827,
      "modeledRent": 5550,
      "movingCash": 12050,
      "totalRequired": 365912,
      "cashTarget": 392393
    },
    {
      "neighborhood": "Astoria / Long Island City",
      "borough": "Queens",
      "lifestyleTier": "Cheap",
      "commuteMin": 34,
      "monthlyLiving": 2940,
      "modeledRent": 1725,
      "movingCash": 3225,
      "totalRequired": 212974,
      "cashTarget": 221794
    },
    {
      "neighborhood": "Astoria / Long Island City",
      "borough": "Queens",
      "lifestyleTier": "Affordable",
      "commuteMin": 34,
      "monthlyLiving": 4205,
      "modeledRent": 2400,
      "movingCash": 5400,
      "totalRequired": 246116,
      "cashTarget": 258731
    },
    {
      "neighborhood": "Astoria / Long Island City",
      "borough": "Queens",
      "lifestyleTier": "Bougie",
      "commuteMin": 34,
      "monthlyLiving": 7131,
      "modeledRent": 3950,
      "movingCash": 10450,
      "totalRequired": 322794,
      "cashTarget": 344187
    },
    {
      "neighborhood": "Bushwick / Ridgewood",
      "borough": "Brooklyn / Queens",
      "lifestyleTier": "Cheap",
      "commuteMin": 45,
      "monthlyLiving": 3083,
      "modeledRent": 1825,
      "movingCash": 3325,
      "totalRequired": 216574,
      "cashTarget": 225823
    },
    {
      "neighborhood": "Bushwick / Ridgewood",
      "borough": "Brooklyn / Queens",
      "lifestyleTier": "Affordable",
      "commuteMin": 45,
      "monthlyLiving": 4412,
      "modeledRent": 2550,
      "movingCash": 5550,
      "totalRequired": 251333,
      "cashTarget": 264569
    },
    {
      "neighborhood": "Bushwick / Ridgewood",
      "borough": "Brooklyn / Queens",
      "lifestyleTier": "Bougie",
      "commuteMin": 45,
      "monthlyLiving": 7452,
      "modeledRent": 4175,
      "movingCash": 10675,
      "totalRequired": 330877,
      "cashTarget": 353233
    },
    {
      "neighborhood": "Crown Heights / Prospect Lefferts",
      "borough": "Brooklyn",
      "lifestyleTier": "Cheap",
      "commuteMin": 43,
      "monthlyLiving": 3133,
      "modeledRent": 1875,
      "movingCash": 3375,
      "totalRequired": 217848,
      "cashTarget": 227247
    },
    {
      "neighborhood": "Crown Heights / Prospect Lefferts",
      "borough": "Brooklyn",
      "lifestyleTier": "Affordable",
      "commuteMin": 43,
      "monthlyLiving": 4462,
      "modeledRent": 2600,
      "movingCash": 5600,
      "totalRequired": 252607,
      "cashTarget": 265993
    },
    {
      "neighborhood": "Crown Heights / Prospect Lefferts",
      "borough": "Brooklyn",
      "lifestyleTier": "Bougie",
      "commuteMin": 43,
      "monthlyLiving": 7552,
      "modeledRent": 4275,
      "movingCash": 10775,
      "totalRequired": 333425,
      "cashTarget": 356081
    },
    {
      "neighborhood": "Harlem / Washington Heights",
      "borough": "Manhattan",
      "lifestyleTier": "Cheap",
      "commuteMin": 38,
      "monthlyLiving": 3043,
      "modeledRent": 1625,
      "movingCash": 3125,
      "totalRequired": 215395,
      "cashTarget": 224524
    },
    {
      "neighborhood": "Harlem / Washington Heights",
      "borough": "Manhattan",
      "lifestyleTier": "Affordable",
      "commuteMin": 38,
      "monthlyLiving": 4298,
      "modeledRent": 2225,
      "movingCash": 5225,
      "totalRequired": 248218,
      "cashTarget": 261112
    },
    {
      "neighborhood": "Harlem / Washington Heights",
      "borough": "Manhattan",
      "lifestyleTier": "Bougie",
      "commuteMin": 38,
      "monthlyLiving": 7279,
      "modeledRent": 3650,
      "movingCash": 10150,
      "totalRequired": 326117,
      "cashTarget": 347954
    }
  ],
  "sources": [
    {
      "id": "nyu_user_costs",
      "label": "User-provided NYU cost figures",
      "url": "User prompt",
      "asOf": "2026-06-19",
      "notes": "Annual baseline: Tuition & Fees, Room & Board, Travel & Personal, Health Insurance."
    },
    {
      "id": "nyu_courant",
      "label": "NYU Courant MS CS",
      "url": "https://cs.nyu.edu/dynamic/masters/prospective-overview/",
      "asOf": "2026-06-19",
      "notes": "Used for default campus anchor at Warren Weaver Hall, 251 Mercer Street."
    },
    {
      "id": "nyu_tandon",
      "label": "NYU Tandon Computer Science, M.S.",
      "url": "https://engineering.nyu.edu/academics/programs/computer-science-ms",
      "asOf": "2026-06-19",
      "notes": "Included as an alternate NYU CS campus reference."
    },
    {
      "id": "zillow_zori",
      "label": "Zillow Observed Rent Index ZIP CSV",
      "url": "https://www.zillow.com/research/data/",
      "asOf": "2026-06-16",
      "notes": "ZORI is a repeat-rent index for typical observed market-rate rent; ZIP CSV latest period used here is 2026-05-31."
    },
    {
      "id": "mit_ny",
      "label": "MIT Living Wage Calculator - New York County",
      "url": "https://livingwage.mit.edu/counties/36061",
      "asOf": "2026-02-15",
      "notes": "Food, internet/mobile, civic, and other annual expense baselines."
    },
    {
      "id": "mit_kings",
      "label": "MIT Living Wage Calculator - Kings County",
      "url": "https://livingwage.mit.edu/counties/36047",
      "asOf": "2026-02-15",
      "notes": "Food, internet/mobile, civic, and other annual expense baselines."
    },
    {
      "id": "mit_queens",
      "label": "MIT Living Wage Calculator - Queens County",
      "url": "https://livingwage.mit.edu/counties/36081",
      "asOf": "2026-02-15",
      "notes": "Food, internet/mobile, civic, and other annual expense baselines."
    },
    {
      "id": "mta_fares",
      "label": "MTA fares and savings",
      "url": "https://www.mta.info/fares-tolls",
      "asOf": "2026-06-19",
      "notes": "Subway/local bus fare is $3; fare-capping page says free rides after 12 fares within seven days."
    },
    {
      "id": "ny_ag_tenants",
      "label": "New York State Attorney General tenant rights guide",
      "url": "https://ag.ny.gov/publications/residential-tenants-rights-guide",
      "asOf": "2026-06-19",
      "notes": "Security deposit limited to no more than one month of rent."
    },
    {
      "id": "rba_fx",
      "label": "Reserve Bank of Australia F11.1 Exchange Rates",
      "url": "https://www.rba.gov.au/statistics/tables/csv/f11.1-data.csv",
      "asOf": "2026-06-18",
      "notes": "Latest RBA daily row used for app display conversion: A$1 = USD 0.7031, so 1 USD = A$1.422273."
    }
  ]
};

  const currencyDefinitions: CurrencyDefinition[] = [
    { code: 'USD', label: 'USD' },
    { code: 'AUD', label: 'AUD' }
  ];

  class UsdBasedCurrencyConverter implements CurrencyConverter {
    private readonly fx: FxAssumption;

    constructor(fx: FxAssumption) {
      this.fx = fx;
    }

    toDisplay(usdValue: number, currency: CurrencyCode): number {
      if (currency === 'AUD') return usdValue * this.fx.audPerUsd;
      return usdValue;
    }

    toUsd(displayValue: number, currency: CurrencyCode): number {
      if (currency === 'AUD') return displayValue * this.fx.usdPerAud;
      return displayValue;
    }
  }

  class CurrencyPresenter {
    readonly options = currencyDefinitions;

    private readonly fx: FxAssumption;
    private readonly converter: CurrencyConverter;
    private readonly numberFormatter = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    });

    constructor(fx: FxAssumption) {
      this.fx = fx;
      this.converter = new UsdBasedCurrencyConverter(fx);
    }

    format(usdValue: number, currency: CurrencyCode): string {
      const displayValue = Math.round(this.converter.toDisplay(usdValue || 0, currency));
      return `$${this.numberFormatter.format(displayValue)}`;
    }

    compact(usdValue: number, currency: CurrencyCode): string {
      const displayValue = this.converter.toDisplay(usdValue || 0, currency);
      const absolute = Math.abs(displayValue);
      if (absolute >= 1_000_000) return `$${(displayValue / 1_000_000).toFixed(1)}M`;
      if (absolute >= 1_000) return `$${Math.round(displayValue / 1_000)}k`;
      return this.format(usdValue, currency);
    }

    inputValue(usdValue: number, currency: CurrencyCode): number {
      return Math.round(this.converter.toDisplay(usdValue || 0, currency));
    }

    inputToUsd(displayValue: number, currency: CurrencyCode): number {
      if (!Number.isFinite(displayValue)) return 0;
      return this.converter.toUsd(displayValue, currency);
    }
  }

  const currencyPresenter = new CurrencyPresenter(model.fxAssumption);
  const percent = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1
  });

  const cardRootBase = 'min-w-0 max-w-full rounded-2xl border border-[var(--nyu-budget-line)] bg-white/78 shadow-[0_8px_24px_rgba(15,23,42,0.045)]';
  const buttonGroupBase = 'inline-flex min-w-0 max-w-full items-center rounded-2xl border border-[var(--nyu-budget-track-line)] bg-[var(--nyu-budget-track)] p-1';
  const inputBase = 'min-h-8 w-full min-w-0 max-w-full rounded-xl border border-[var(--nyu-budget-control-border)] bg-white/90 px-2.5 py-1 text-[0.95rem] font-medium text-[var(--nyu-budget-ink)] shadow-[inset_0_0_0_1px_rgba(82,97,108,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors placeholder:text-[var(--nyu-budget-muted)] hover:border-[var(--nyu-budget-control-border-hover)] focus-visible:border-[rgba(69,107,145,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.15)]';
  const selectTriggerBase = 'flex min-h-8 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border border-[var(--nyu-budget-control-border)] bg-white/90 px-2.5 py-1 text-left text-[0.95rem] font-medium text-[var(--nyu-budget-ink)] shadow-[inset_0_0_0_1px_rgba(82,97,108,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors hover:border-[var(--nyu-budget-control-border-hover)] focus-visible:border-[rgba(69,107,145,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.15)]';
  const selectItemBase = 'flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[0.92rem] font-medium text-[var(--nyu-budget-ink)] transition-colors hover:bg-[var(--nyu-budget-track)] focus-visible:bg-[var(--nyu-budget-track)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[selected=true]:bg-[var(--nyu-budget-ink)] data-[selected=true]:text-white';
  const sliderRoot =
    'group relative flex h-7 w-full touch-none select-none items-center';
  const sliderInput =
    'absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none';
  const sliderTrack =
    'relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--nyu-budget-track)] shadow-[inset_0_0_0_1px_var(--nyu-budget-track-line)]';
  const sliderRange =
    'absolute h-full rounded-full bg-[var(--nyu-budget-ink)]';
  const sliderThumb =
    'pointer-events-none absolute top-1/2 z-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--nyu-budget-control-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18),0_0_0_4px_rgba(69,107,145,0.08)] transition-shadow group-focus-within:shadow-[0_1px_3px_rgba(15,23,42,0.18),0_0_0_5px_rgba(69,107,145,0.16)]';

  const actionButton =
    'rounded-xl px-2 text-[0.92rem] font-semibold text-[#51615f]';
  const actionButtonActive = 'bg-[var(--nyu-budget-ink)] font-semibold text-white';
  const lifestyleButton =
    'flex h-7 w-full items-center justify-center rounded-xl px-3 text-center text-[0.92rem] font-semibold text-[#51615f]';
  const linkButton =
    'inline-flex h-8 items-center justify-center rounded-xl border border-[var(--nyu-budget-line)] bg-white/80 px-3 py-0 text-[0.92rem] font-semibold text-[var(--nyu-budget-ink)] no-underline transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.25)]';
  const kpiCard =
    'min-w-0 !rounded-2xl !border-[#e6edf3] !bg-white px-4 py-4 !shadow-[0_1px_3px_rgba(15,23,42,0.07)]';
  const kpiLabel =
    'mb-2 block min-w-0 truncate text-[0.7rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-muted)]';
  const kpiValue =
    'block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.55rem,2.65vw,2.7rem)] font-semibold leading-none tracking-[-0.02em] text-[var(--nyu-budget-ink)]';
  const panel = 'min-w-0 max-w-full rounded-[24px] border-[rgba(220,229,236,0.8)] bg-white/82 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.045)]';
  const widePanel = `${panel} overflow-hidden max-[640px]:overflow-x-auto`;
  const moneyValue = 'min-w-0 font-semibold tracking-[-0.01em] text-[var(--nyu-budget-ink)]';
  const mutedText = 'min-w-0 text-[var(--nyu-budget-muted)]';
  const fieldLabel = 'text-[0.72rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-label)]';
  const fieldControl =
    'min-h-8 max-w-full rounded-xl px-2.5 py-1 text-[0.95rem]';
  const tableHeader = 'border-b border-[var(--nyu-budget-line-soft)] px-2 py-2 text-right text-[0.68rem] font-semibold uppercase text-[var(--nyu-budget-label)] whitespace-nowrap';
  const tableHeaderLeft = `${tableHeader} text-left`;
  const tableCell = 'border-b border-[var(--nyu-budget-line-soft)] px-2 py-2 text-right text-[0.86rem] whitespace-nowrap';
  const tableCellLeft = `${tableCell} text-left`;
  const lifestyleLabels: Record<string, string> = {
    Cheap: '$',
    Affordable: '$$',
    Bougie: '$$$'
  };

  let selectedCurrency = $state<CurrencyCode>('USD');
  let selectedTier = $state(model.selectedDefaults.lifestyleTier);
  let selectedNeighborhood = $state(model.selectedDefaults.neighborhood);
  let financialAidAnnual = $state(model.selectedDefaults.financialAidAnnual);
  let startingSavings = $state(model.selectedDefaults.startingSavings);
  let monthlyIncome = $state(model.selectedDefaults.monthlyIncome);
  let reserveMonths = $state(model.selectedDefaults.reserveMonths);
  let year2Escalation = $state(model.selectedDefaults.year2Escalation);
  let neighborhoodSelectOpen = $state(false);

  const academicMonths = new Set([0, 4, 12, 16]);

  function money(value: number) {
    return currencyPresenter.format(value, selectedCurrency);
  }

  function compactMoney(value: number) {
    return currencyPresenter.compact(value, selectedCurrency);
  }

  function displayedMoneyInput(value: number) {
    return currencyPresenter.inputValue(value, selectedCurrency);
  }

  function lifestyleDisplay(label: string) {
    return lifestyleLabels[label] ?? label;
  }

  function setCurrency(currency: CurrencyCode) {
    selectedCurrency = currency;
  }

  function setNumber(setter: (value: number) => void, event: Event) {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    setter(Number.isFinite(value) ? value : 0);
  }

  function setUsdAmount(setter: (value: number) => void, event: Event) {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    setter(currencyPresenter.inputToUsd(value, selectedCurrency));
  }

  function monthLabel(dateString: string) {
    return new Date(`${dateString}T00:00:00Z`).toLocaleString('en-US', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC'
    });
  }

  function addMonths(dateString: string, count: number) {
    const date = new Date(`${dateString}T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + count);
    return date.toISOString().slice(0, 10);
  }

  function totalsFor(monthlyLiving: number, movingCash: number) {
    const tuition = model.nyuCosts.tuitionFeesAnnual * (2 + year2Escalation);
    const insurance = model.nyuCosts.healthInsuranceAnnual * (2 + year2Escalation);
    const living = monthlyLiving * 12 + monthlyLiving * (1 + year2Escalation) * 12;
    const totalRequired = tuition + insurance + living + movingCash;
    const cashTarget = totalRequired + monthlyLiving * reserveMonths;
    return {
      tuition,
      insurance,
      living,
      movingCash,
      totalRequired,
      cashTarget
    };
  }

  function buildMonthly(monthlyLiving: number, movingCash: number) {
    return Array.from({ length: 24 }, (_, index) => {
      const academicYear = index < 12 ? 1 : 2;
      const escalation = academicYear === 1 ? 1 : 1 + year2Escalation;
      const monthInYear = index % 12;
      const tuition = monthInYear === 0 || monthInYear === 4
        ? (model.nyuCosts.tuitionFeesAnnual * escalation) / 2
        : 0;
      const insurance = monthInYear === 0 ? model.nyuCosts.healthInsuranceAnnual * escalation : 0;
      const living = monthlyLiving * escalation;
      const moving = index === 0 ? movingCash : 0;
      const totalOutflow = tuition + insurance + living + moving;
      return {
        month: addMonths(model.selectedDefaults.startMonth, index),
        label: monthLabel(addMonths(model.selectedDefaults.startMonth, index)),
        academicYear,
        tuition,
        insurance,
        living,
        moving,
        totalOutflow,
        isTuitionMonth: academicMonths.has(index)
      };
    });
  }

  function isFinitePositive(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }

  function withinTolerance(actual: number, expected: number, tolerance = 1) {
    return Math.abs(actual - expected) <= tolerance;
  }

  function validationDotClass(status: ValidationStatus) {
    if (status === 'fail') return 'bg-[#b94747] shadow-[0_0_0_4px_rgba(185,71,71,0.14)]';
    if (status === 'warn') return 'bg-[#b8842f] shadow-[0_0_0_4px_rgba(184,132,47,0.14)]';
    return 'bg-[var(--nyu-budget-positive)] shadow-[0_0_0_4px_rgba(47,107,79,0.12)]';
  }

  function buildValidationChecks(): ValidationCheck[] {
    const selectedScenarioExists = Boolean(neighborhood?.tiers?.[selectedTier]);
    const selectedObservations = neighborhood.zipRentObservations ?? [];
    const neighborhoodsWithMissingRent = model.neighborhoods.filter((item: any) => {
      const observations = item.zipRentObservations ?? [];
      return observations.length === 0 || observations.some((observation: any) => !isFinitePositive(observation.latestRent));
    });
    const componentTotal = totals.tuition + totals.insurance + totals.living + totals.movingCash;
    const expectedCashTarget = totals.totalRequired + selected.monthlyLiving * reserveMonths;
    const inputsAreSane = [financialAidAnnual, startingSavings, monthlyIncome, reserveMonths, year2Escalation].every((value) => Number.isFinite(value)) &&
      financialAidAnnual >= 0 &&
      startingSavings >= 0 &&
      monthlyIncome >= 0 &&
      reserveMonths >= 0 &&
      reserveMonths <= 12 &&
      year2Escalation >= 0 &&
      year2Escalation <= 0.1;
    const reciprocalFx = model.fxAssumption.usdPerAud * model.fxAssumption.audPerUsd;
    const fxAvailable = isFinitePositive(model.fxAssumption.usdPerAud) &&
      isFinitePositive(model.fxAssumption.audPerUsd) &&
      withinTolerance(reciprocalFx, 1, 0.01);

    return [
      {
        name: 'Rent observations',
        status: neighborhoodsWithMissingRent.length === 0 && selectedObservations.length > 0 ? 'pass' : 'fail',
        notes: selectedObservations.length > 0
          ? `${selectedObservations.length} ZIP observations for ${neighborhood.name}; latest ${neighborhood.zoriLatestDate}.`
          : `${neighborhood.name} is missing ZIP rent observations.`
      },
      {
        name: 'Selected scenario',
        status: selectedScenarioExists ? 'pass' : 'fail',
        notes: selectedScenarioExists
          ? `${selectedTier} in ${neighborhood.name} resolves to ${money(totals.cashTarget)} target.`
          : `${selectedTier} is not available for ${neighborhood.name}.`
      },
      {
        name: 'Totals reconcile',
        status: withinTolerance(componentTotal, totals.totalRequired) && withinTolerance(expectedCashTarget, totals.cashTarget) ? 'pass' : 'fail',
        notes: `${money(totals.totalRequired)} total plus ${reserveMonths} month reserve gives ${money(totals.cashTarget)}.`
      },
      {
        name: 'Inputs in range',
        status: inputsAreSane ? 'pass' : 'warn',
        notes: inputsAreSane
          ? `Aid, savings, income, reserve, and escalation are inside modeled ranges.`
          : `Review negative values, reserve months above 12, or escalation outside 0-10%.`
      },
      {
        name: 'AUD conversion',
        status: fxAvailable ? 'pass' : 'warn',
        notes: fxAvailable
          ? `Using ${model.fxAssumption.sourceLabel}, ${model.fxAssumption.asOf}.`
          : `FX assumption is missing or not reciprocal.`
      }
    ];
  }

  let neighborhood = $derived(
    model.neighborhoods.find((item: any) => item.name === selectedNeighborhood) ?? model.neighborhoods[0]
  );
  let tier = $derived(
    model.lifestyleTiers.find((item: any) => item.label === selectedTier) ?? model.lifestyleTiers[1]
  );
  let selected = $derived(neighborhood.tiers[selectedTier]);
  let totals = $derived(totalsFor(selected.monthlyLiving, selected.movingCash));
  let funding = $derived(startingSavings + financialAidAnnual * 2 + monthlyIncome * 24);
  let gap = $derived(Math.max(0, totals.cashTarget - funding));
  let monthly = $derived(buildMonthly(selected.monthlyLiving, selected.movingCash));
  let monthMax = $derived(Math.max(...monthly.map((item) => item.totalOutflow)));
  let validationChecks = $derived(buildValidationChecks());
  let comparison = $derived(
    model.neighborhoods
      .map((item: any) => {
        const scenario = item.tiers[selectedTier];
        const itemTotals = totalsFor(scenario.monthlyLiving, scenario.movingCash);
        return {
          ...item,
          scenario,
          totalRequired: itemTotals.totalRequired,
          cashTarget: itemTotals.cashTarget
        };
      })
      .sort((a: any, b: any) => a.cashTarget - b.cashTarget)
  );
  let comparisonMax = $derived(Math.max(...comparison.map((item: any) => item.cashTarget)));
  let escalationPercent = $derived((year2Escalation / 0.1) * 100);
  let breakdown = $derived([
    { label: 'Rent', value: selected.rent, barClass: 'bg-[var(--nyu-budget-ink)]' },
    { label: 'Food', value: selected.food, barClass: 'bg-[var(--nyu-budget-green)]' },
    { label: 'Utilities', value: selected.utilities + selected.internetMobile, barClass: 'bg-[var(--nyu-budget-amber)]' },
    { label: 'Personal', value: selected.personal, barClass: 'bg-[var(--nyu-budget-blue)]' },
    { label: 'Transit', value: selected.transit, barClass: 'bg-[var(--nyu-budget-gray)]' },
    { label: 'Travel', value: selected.travel, barClass: 'bg-[var(--nyu-budget-rose)]' }
  ]);
  let breakdownMax = $derived(Math.max(...breakdown.map((item) => item.value)));
</script>

<svelte:window onclick={() => (neighborhoodSelectOpen = false)} />

<main class="nyu-budget-model mx-auto w-[min(1440px,100%)] max-w-full p-6 max-[980px]:p-4">
  <section class="mb-8 flex items-end justify-between gap-6 max-[640px]:mb-6 max-[640px]:flex-col max-[640px]:items-start">
    <div class="min-w-0">
      <h1 class="m-0 text-[clamp(2.75rem,5vw,5.5rem)] font-semibold leading-[0.9] tracking-normal text-[var(--nyu-budget-heading)] max-[640px]:text-[clamp(2.35rem,13vw,4.25rem)]">
        Two years in New York City
      </h1>
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2.5 max-[980px]:justify-start max-[640px]:w-full max-[640px]:items-start">
      <div class={cn(buttonGroupBase, 'grid grid-cols-2')} role="group" aria-label="Display currency">
        {#each currencyPresenter.options as option}
          <button
            aria-pressed={selectedCurrency === option.code}
            class={`${actionButton} w-[58px] data-[pressed=true]:bg-[var(--nyu-budget-ink)] data-[pressed=true]:text-white ${selectedCurrency === option.code ? actionButtonActive : ''}`}
            type="button"
            onclick={() => setCurrency(option.code)}
          >
            {option.label}
          </button>
        {/each}
      </div>
      <a
        class={linkButton}
        href={workbookHref}
        download
      >
        Download
      </a>
    </div>
  </section>

  <section class="grid grid-cols-[290px_minmax(0,1fr)] items-start gap-5 max-[980px]:grid-cols-1">
    <div
      class={cn(cardRootBase, 'sticky top-4 grid min-w-0 gap-3 rounded-[26px] border-[rgba(220,229,236,0.8)] bg-white/74 px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] max-[980px]:static')}
      aria-label="Budget controls"
    >
      <div class="grid min-w-0 gap-1.5">
        <span class={fieldLabel}>Lifestyle</span>
        <div class="grid grid-cols-3 rounded-[16px] border border-[var(--nyu-budget-track-line)] bg-[var(--nyu-budget-track)] p-1" role="group" aria-label="Lifestyle tier">
          {#each model.lifestyleTiers as option}
            <button
              aria-pressed={selectedTier === option.label}
              aria-label={option.label}
              class={`${lifestyleButton} ${selectedTier === option.label ? actionButtonActive : ''}`}
              type="button"
              onclick={() => (selectedTier = option.label)}
            >
              {lifestyleDisplay(option.label)}
            </button>
          {/each}
        </div>
      </div>

      <div class="grid min-w-0 gap-1.5">
        <label class={fieldLabel} for="neighborhood">Neighborhood</label>
        <div class="relative min-w-0 w-full max-w-full">
          <button
            id="neighborhood"
            type="button"
            aria-expanded={neighborhoodSelectOpen}
            aria-haspopup="listbox"
            onclick={(event) => {
              event.stopPropagation();
              neighborhoodSelectOpen = !neighborhoodSelectOpen;
            }}
            class={cn(selectTriggerBase, fieldControl)}
          >
            <span class="block min-w-0 flex-1 truncate">{selectedNeighborhood}</span>
            <span aria-hidden="true" class="shrink-0 text-[0.75rem] text-[var(--nyu-budget-muted)]">v</span>
          </button>
          {#if neighborhoodSelectOpen}
            <div
              role="listbox"
              tabindex="-1"
              onclick={(event) => event.stopPropagation()}
              onkeydown={(event) => event.stopPropagation()}
              class="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 min-w-0 overflow-auto rounded-2xl border border-[var(--nyu-budget-line)] bg-white/95 p-1 shadow-[0_18px_45px_rgba(15,23,42,0.13)] backdrop-blur"
            >
              {#each model.neighborhoods as item}
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedNeighborhood === item.name}
                  data-selected={selectedNeighborhood === item.name}
                  class={cn(selectItemBase, selectedNeighborhood === item.name && 'bg-[var(--nyu-budget-ink)] text-white')}
                  onclick={() => {
                    selectedNeighborhood = item.name;
                    neighborhoodSelectOpen = false;
                  }}
                >
                  <span class="min-w-0 flex-1 truncate">{item.name}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="grid min-w-0 grid-cols-2 gap-2 max-[640px]:grid-cols-1">
        <div class="grid min-w-0 gap-1.5">
          <label class={fieldLabel} for="aid">Annual aid</label>
          <input
            class={cn(inputBase, fieldControl)}
            id="aid"
            type="number"
            min="0"
            step="1000"
            value={displayedMoneyInput(financialAidAnnual)}
            oninput={(event) => setUsdAmount((value) => (financialAidAnnual = value), event)}
          />
        </div>
        <div class="grid min-w-0 gap-1.5">
          <label class={fieldLabel} for="savings">Savings</label>
          <input
            class={cn(inputBase, fieldControl)}
            id="savings"
            type="number"
            min="0"
            step="1000"
            value={displayedMoneyInput(startingSavings)}
            oninput={(event) => setUsdAmount((value) => (startingSavings = value), event)}
          />
        </div>
      </div>

      <div class="grid min-w-0 grid-cols-2 gap-2 max-[640px]:grid-cols-1">
        <div class="grid min-w-0 gap-1.5">
          <label class={fieldLabel} for="income">Monthly income</label>
          <input
            class={cn(inputBase, fieldControl)}
            id="income"
            type="number"
            min="0"
            step="250"
            value={displayedMoneyInput(monthlyIncome)}
            oninput={(event) => setUsdAmount((value) => (monthlyIncome = value), event)}
          />
        </div>
        <div class="grid min-w-0 gap-1.5">
          <label class={fieldLabel} for="reserve">Reserve months</label>
          <input
            class={cn(inputBase, fieldControl)}
            id="reserve"
            type="number"
            min="0"
            max="12"
            step="1"
            value={reserveMonths}
            oninput={(event) => setNumber((value) => (reserveMonths = value), event)}
          />
        </div>
      </div>

      <div class="grid min-w-0 gap-1.5">
        <label class={fieldLabel} for="escalation">Year-2 escalation</label>
        <div class={sliderRoot} data-orientation="horizontal">
          <div class={sliderTrack} data-orientation="horizontal">
            <div
              class={sliderRange}
              data-orientation="horizontal"
              style={`left: 0%; width: ${escalationPercent}%`}
            ></div>
          </div>
          <span
            class={sliderThumb}
            data-orientation="horizontal"
            style={`left: ${escalationPercent}%`}
          ></span>
          <input
            class={sliderInput}
            id="escalation"
            type="range"
            min="0"
            max="0.1"
            step="0.005"
            value={year2Escalation}
            aria-label="Year-2 escalation"
            oninput={(event) => setNumber((value) => (year2Escalation = value), event)}
          />
        </div>
        <div class="text-sm font-semibold text-[var(--nyu-budget-ink)]">{percent.format(year2Escalation)}</div>
      </div>

      <div class="flex min-w-0 justify-between gap-3 border-t border-[#e1e6e3] pt-3 text-[0.82rem] text-[var(--nyu-budget-label)]">
        <span class="shrink-0 text-[1.4rem] font-semibold tracking-[-0.01em] text-[var(--nyu-budget-ink)]">{neighborhood.commuteMin} min</span>
        <span class="min-w-0 truncate text-right">{neighborhood.commuteMode} · to Courant</span>
      </div>
    </div>

    <section class="grid gap-5">
      <section class="grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="Selected scenario summary">
        <div class={cn(cardRootBase, kpiCard)}>
          <span class={kpiLabel}>Cash target</span>
          <strong class={kpiValue}>
            {money(totals.cashTarget)}
          </strong>
        </div>
        <div class={cn(cardRootBase, kpiCard)}>
          <span class={kpiLabel}>Funding gap</span>
          <strong class={`${kpiValue} ${gap === 0 ? 'text-[var(--nyu-budget-positive)]' : ''}`}>
            {money(gap)}
          </strong>
        </div>
        <div class={cn(cardRootBase, kpiCard)}>
          <span class={kpiLabel}>Monthly living</span>
          <strong class={kpiValue}>
            {money(selected.monthlyLiving)}
          </strong>
        </div>
        <div class={cn(cardRootBase, kpiCard)}>
          <span class={kpiLabel}>Move-in cash</span>
          <strong class={kpiValue}>
            {money(selected.movingCash)}
          </strong>
        </div>
      </section>

      <section class="grid grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] gap-4 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
        <div class={cn(cardRootBase, panel)}>
          <div class="mb-3 flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="m-0 text-lg font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)] [overflow-wrap:anywhere]">{selectedTier} in {selectedNeighborhood}</h2>
            </div>
            <span class="whitespace-nowrap border-l border-[#d8dfdc] pl-3 text-[0.72rem] font-medium text-[var(--nyu-budget-label)]">
              ZORI {model.metadata.zoriLatestDate}
            </span>
          </div>

          <div class="grid gap-2">
            {#each breakdown as item}
              <div class="grid min-w-0 grid-cols-[76px_minmax(0,1fr)_minmax(66px,82px)] items-center gap-3 text-[0.9rem] max-[640px]:grid-cols-[68px_minmax(0,1fr)_66px] max-[640px]:gap-[9px]">
                <span class="min-w-0 truncate font-medium text-[var(--nyu-budget-ink)]">{item.label}</span>
                <div class="h-2 overflow-hidden rounded-full bg-[var(--nyu-budget-track)]">
                  <div
                    class={`h-full rounded-[inherit] ${item.barClass}`}
                    style={`width: ${Math.max(6, (item.value / breakdownMax) * 100)}%`}
                  ></div>
                </div>
                <strong class={`overflow-hidden text-ellipsis whitespace-nowrap text-right ${moneyValue}`}>{money(item.value)}</strong>
              </div>
            {/each}
          </div>
        </div>

        <div class={cn(cardRootBase, panel)}>
          <div class="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 class="m-0 text-lg font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Cost composition</h2>
            </div>
          </div>
          <dl class="m-0 grid min-w-0">
            <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[var(--nyu-budget-line-soft)] py-2 first:pt-0">
              <dt class={`${mutedText} truncate`}>Tuition & fees</dt>
              <dd class={`m-0 shrink-0 whitespace-nowrap text-right tabular-nums ${moneyValue}`}>{money(totals.tuition)}</dd>
            </div>
            <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[var(--nyu-budget-line-soft)] py-2">
              <dt class={`${mutedText} truncate`}>Health insurance</dt>
              <dd class={`m-0 shrink-0 whitespace-nowrap text-right tabular-nums ${moneyValue}`}>{money(totals.insurance)}</dd>
            </div>
            <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[var(--nyu-budget-line-soft)] py-2">
              <dt class={`${mutedText} truncate`}>Living expenses</dt>
              <dd class={`m-0 shrink-0 whitespace-nowrap text-right tabular-nums ${moneyValue}`}>{money(totals.living)}</dd>
            </div>
            <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 py-2">
              <dt class={`${mutedText} truncate`}>Move-in cash</dt>
              <dd class={`m-0 shrink-0 whitespace-nowrap text-right tabular-nums ${moneyValue}`}>{money(totals.movingCash)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div class={cn(cardRootBase, widePanel)}>
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Monthly cashflow</h2>
          </div>
        </div>

        <svg class="h-auto min-h-[158px] w-full max-[640px]:min-w-[720px]" viewBox="0 0 760 220" role="img" aria-label="Monthly cashflow chart">
          <line x1="32" y1="186" x2="744" y2="186" class="stroke-[#d4dbd8] stroke-[1]" />
          {#each monthly as item, index}
            {@const height = Math.max(5, (item.totalOutflow / monthMax) * 154)}
            {@const x = 38 + index * 29}
            <rect
              class={item.isTuitionMonth ? 'fill-[var(--nyu-budget-ink)]' : 'fill-[#91a09b]'}
              x={x}
              y={186 - height}
              width="17"
              height={height}
              rx="3"
            />
            {#if index % 3 === 0}
              <text class="fill-[#697572] text-[10px]" x={x + 8} y="205" text-anchor="middle">{item.label}</text>
            {/if}
          {/each}
        </svg>

        <div class="flex flex-wrap gap-2 text-[0.82rem] text-[var(--nyu-budget-muted)]">
          {#each monthly.filter((item) => item.isTuitionMonth) as item}
            <span class="border-l border-[#dce2df] pl-2">
              {item.label}: {compactMoney(item.totalOutflow)}
            </span>
          {/each}
        </div>
      </div>

      <div class={cn(cardRootBase, widePanel)}>
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Neighborhood comparison</h2>
          </div>
        </div>

        <div class="grid">
          {#each comparison as item}
            {@const isCurrent = item.name === selectedNeighborhood}
            <div class={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(110px,2fr)_minmax(64px,82px)] items-center gap-3 border-b border-[var(--nyu-budget-line-soft)] px-0 py-2.5 max-[640px]:grid-cols-[minmax(0,1fr)_70px] ${isCurrent ? 'bg-[#fbfcfb]' : ''}`}>
              <button class="grid min-w-0 cursor-pointer gap-0.5 bg-transparent p-0 text-left text-[var(--nyu-budget-ink)]" type="button" onclick={() => (selectedNeighborhood = item.name)}>
                <span class={`font-medium [overflow-wrap:anywhere] ${isCurrent ? 'font-semibold' : ''}`}>{item.name}</span>
                <small class={mutedText}>{item.commuteMin} min · {item.borough}</small>
              </button>
              <div class="h-2 overflow-hidden rounded-full bg-[var(--nyu-budget-track)] max-[640px]:order-3 max-[640px]:col-span-full">
                <div
                  class={`h-full rounded-[inherit] ${isCurrent ? 'bg-[var(--nyu-budget-ink)]' : 'bg-[var(--nyu-budget-blue)]'}`}
                  style={`width: ${(item.cashTarget / comparisonMax) * 100}%`}
                ></div>
              </div>
              <strong class={`overflow-hidden text-ellipsis whitespace-nowrap text-right ${moneyValue}`}>{compactMoney(item.cashTarget)}</strong>
            </div>
          {/each}
        </div>
      </div>

      <div class={cn(cardRootBase, `${widePanel} pb-2`)}>
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Rent research</h2>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th class={tableHeaderLeft}>Neighborhood</th>
                <th class={tableHeaderLeft}>ZIPs</th>
                <th class={tableHeader}>ZORI base</th>
                <th class={tableHeader}>Cheap</th>
                <th class={tableHeader}>Affordable</th>
                <th class={tableHeader}>Bougie</th>
                <th class={tableHeader}>YoY</th>
              </tr>
            </thead>
            <tbody>
              {#each model.neighborhoods as item}
                <tr class={item.name === selectedNeighborhood ? 'bg-[var(--nyu-budget-soft)]' : ''}>
                  <td class={tableCellLeft}>{item.name}</td>
                  <td class={tableCellLeft}>{item.zips.join(', ')}</td>
                  <td class={tableCell}>{money(item.zoriBaseRent)}</td>
                  <td class={tableCell}>{money(item.tiers.Cheap.rent)}</td>
                  <td class={tableCell}>{money(item.tiers.Affordable.rent)}</td>
                  <td class={tableCell}>{money(item.tiers.Bougie.rent)}</td>
                  <td class={tableCell}>{item.zoriYoY === null ? 'n/a' : percent.format(item.zoriYoY)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <section class="min-w-0 max-w-full rounded-[24px] border border-[#e6edf3] bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] max-[640px]:px-4" aria-label="Sources and checks">
        <div class="grid min-w-0 grid-cols-[minmax(0,1.45fr)_minmax(240px,0.55fr)] gap-8 max-[980px]:grid-cols-1">
          <article class="min-w-0">
            <div class="mb-5 max-w-2xl">
              <p class="m-0 mb-2 text-[0.72rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-muted)]">Sources</p>
              <h2 class="m-0 text-[1.45rem] font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Reference trail</h2>
            </div>

            <div class="border-t border-[#edf2f6]">
              {#each model.sources as source}
                <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_96px] gap-5 border-b border-[#edf2f6] py-3.5 max-[640px]:grid-cols-1 max-[640px]:gap-1.5">
                  <div class="min-w-0">
                    {#if source.url === 'User prompt'}
                      <span class="block font-semibold leading-snug text-[var(--nyu-budget-ink)] [overflow-wrap:anywhere]">{source.label}</span>
                    {:else}
                      <a
                        class="block font-semibold leading-snug text-[var(--nyu-budget-ink)] underline decoration-[#c8d3dc] underline-offset-4 transition-colors hover:decoration-[var(--nyu-budget-ink)] [overflow-wrap:anywhere]"
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.label}
                      </a>
                    {/if}
                    <p class="m-0 mt-1 max-w-2xl text-[0.86rem] leading-5 text-[var(--nyu-budget-muted)]">{source.notes}</p>
                  </div>
                  <time class="text-right text-[0.78rem] font-medium text-[var(--nyu-budget-label)] max-[640px]:text-left">{source.asOf}</time>
                </div>
              {/each}
            </div>
          </article>

          <aside class="min-w-0">
            <div class="mb-5">
              <p class="m-0 mb-2 text-[0.72rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-muted)]">Checks</p>
              <h2 class="m-0 text-[1.45rem] font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Validation status</h2>
            </div>

            <div class="min-w-0">
              {#each validationChecks as check}
                <div class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-[#edf2f6] px-3.5 py-3 last:border-b-0">
                  <span class={`mt-1.5 size-2 rounded-full ${validationDotClass(check.status)}`} aria-label={`Validation ${check.status}`}></span>
                  <div class="min-w-0">
                    <p class="m-0 text-[0.92rem] font-semibold leading-snug text-[var(--nyu-budget-ink)] [overflow-wrap:anywhere]">{check.name}</p>
                    <p class="m-0 mt-1 text-[0.8rem] leading-5 text-[var(--nyu-budget-muted)] [overflow-wrap:anywhere]">{check.notes}</p>
                  </div>
                </div>
              {/each}
            </div>
          </aside>
        </div>
      </section>
    </section>
  </section>
</main>


<style>
  :global(.nyu-budget-model),
  :global(.nyu-budget-model *),
  :global(.nyu-budget-model *::before),
  :global(.nyu-budget-model *::after) {
    box-sizing: border-box;
  }

  :global(.nyu-budget-model) {
    --nyu-budget-ink: #172026;
    --nyu-budget-heading: #101518;
    --nyu-budget-muted: #6a7681;
    --nyu-budget-label: #52616c;
    --nyu-budget-bg: #f6f8fb;
    --nyu-budget-soft: #f8fafc;
    --nyu-budget-line: #dce5ec;
    --nyu-budget-line-soft: #edf2f6;
    --nyu-budget-control-border: #c9d5df;
    --nyu-budget-control-border-hover: #b8c7d3;
    --nyu-budget-track: #eef3f7;
    --nyu-budget-track-line: #dbe4eb;
    --nyu-budget-green: #4d8a63;
    --nyu-budget-green-soft: #e6f4ea;
    --nyu-budget-positive: #2f6b4f;
    --nyu-budget-amber: #c89539;
    --nyu-budget-blue: #456b91;
    --nyu-budget-gray: #838c89;
    --nyu-budget-rose: #aa6f69;
    color: var(--nyu-budget-ink);
    background: var(--nyu-budget-bg);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  :global(.nyu-budget-model button),
  :global(.nyu-budget-model input),
  :global(.nyu-budget-model select) {
    font: inherit;
  }

  :global(.nyu-budget-model button:not(#neighborhood)) {
    border: 0;
  }

  :global(.nyu-budget-model #neighborhood) {
    border: 1px solid var(--nyu-budget-control-border);
  }

  :global(.nyu-budget-model #neighborhood:hover) {
    border-color: var(--nyu-budget-control-border-hover);
  }

  :global(.nyu-budget-model #neighborhood:focus-visible) {
    border-color: rgba(69, 107, 145, 0.65);
  }

  :global(.nyu-budget-model table) {
    border-collapse: collapse;
    width: 100%;
  }

  :global(.nyu-budget-model svg) {
    display: block;
    max-width: 100%;
  }
</style>
