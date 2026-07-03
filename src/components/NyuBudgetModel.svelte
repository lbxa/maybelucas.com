<script lang="ts">
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import { onDestroy, onMount, tick } from 'svelte';

  type CurrencyCode = 'USD' | 'AUD';
  type ComparisonView = 'map' | 'list';
  type MapCoordinate = [number, number];

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

  interface PlannerMapAreaDefinition {
    name: string;
    shortName: string;
    center: MapCoordinate;
    coordinates: MapCoordinate[];
  }

  interface PlannerMapRow {
    area: PlannerMapAreaDefinition;
    item: any;
    fill: string;
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
    },
    "Hudson County": {
      "foodAnnual": 5930,
      "internetMobileAnnual": 1640,
      "civicAnnual": 3500,
      "otherAnnual": 4800
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

  const additionalPlannerNeighborhoods = [
    {
      name: 'Upper West Side / Lincoln Square',
      borough: 'Manhattan',
      county: 'New York County',
      zips: ['10023', '10024'],
      commuteMin: 22,
      commuteMode: '1/2/3/A/C/B/D subway',
      notes: 'Classic Manhattan option with strong park access and a quick train to campus.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 4875,
      zoriYoY: 0.074,
      zipRentObservations: [
        { zip: '10023', latestRent: 5125, yoyChange: 0.077 },
        { zip: '10024', latestRent: 4625, yoyChange: 0.071 }
      ]
    },
    {
      name: 'Upper East Side / Yorkville',
      borough: 'Manhattan',
      county: 'New York County',
      zips: ['10021', '10028', '10128'],
      commuteMin: 25,
      commuteMode: '4/5/6/Q subway',
      notes: 'Often a little calmer than downtown Manhattan with good subway coverage.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 4560,
      zoriYoY: 0.068,
      zipRentObservations: [
        { zip: '10021', latestRent: 4850, yoyChange: 0.071 },
        { zip: '10028', latestRent: 4500, yoyChange: 0.067 },
        { zip: '10128', latestRent: 4330, yoyChange: 0.066 }
      ]
    },
    {
      name: "Midtown / Hell's Kitchen",
      borough: 'Manhattan',
      county: 'New York County',
      zips: ['10019', '10036'],
      commuteMin: 20,
      commuteMode: 'A/C/E/N/R/W/1 subway',
      notes: 'Very central, transit-rich, and usually priced like a convenience premium.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 5015,
      zoriYoY: 0.078,
      zipRentObservations: [
        { zip: '10019', latestRent: 5140, yoyChange: 0.081 },
        { zip: '10036', latestRent: 4890, yoyChange: 0.075 }
      ]
    },
    {
      name: 'Financial District / Tribeca',
      borough: 'Manhattan',
      county: 'New York County',
      zips: ['10004', '10005', '10006', '10007', '10038'],
      commuteMin: 18,
      commuteMode: 'A/C/E/R/W/4/5/6 subway',
      notes: 'Fast downtown commute, high-rise inventory, and a wide spread between FiDi and Tribeca.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 5480,
      zoriYoY: 0.065,
      zipRentObservations: [
        { zip: '10004', latestRent: 5040, yoyChange: 0.059 },
        { zip: '10005', latestRent: 5050, yoyChange: 0.062 },
        { zip: '10006', latestRent: 5200, yoyChange: 0.061 },
        { zip: '10007', latestRent: 6840, yoyChange: 0.073 },
        { zip: '10038', latestRent: 5270, yoyChange: 0.067 }
      ]
    },
    {
      name: 'Morningside Heights / Manhattanville',
      borough: 'Manhattan',
      county: 'New York County',
      zips: ['10025', '10026'],
      commuteMin: 32,
      commuteMode: '1/A/C/B/D subway',
      notes: 'Student-heavy uptown option with better rent control than downtown Manhattan.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 3425,
      zoriYoY: 0.059,
      zipRentObservations: [
        { zip: '10025', latestRent: 3600, yoyChange: 0.061 },
        { zip: '10026', latestRent: 3250, yoyChange: 0.057 }
      ]
    },
    {
      name: 'Sunnyside / Woodside',
      borough: 'Queens',
      county: 'Queens County',
      zips: ['11104', '11377'],
      commuteMin: 36,
      commuteMode: '7/R/M subway',
      notes: 'Lower-key Queens option with a strong commute-to-rent tradeoff.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 2860,
      zoriYoY: 0.041,
      zipRentObservations: [
        { zip: '11104', latestRent: 3050, yoyChange: 0.044 },
        { zip: '11377', latestRent: 2670, yoyChange: 0.038 }
      ]
    },
    {
      name: 'Park Slope / Gowanus',
      borough: 'Brooklyn',
      county: 'Kings County',
      zips: ['11215', '11231'],
      commuteMin: 34,
      commuteMode: 'F/G/R subway',
      notes: 'Comfortable Brooklyn option with strong neighborhood amenities and moderate commute.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 4300,
      zoriYoY: 0.056,
      zipRentObservations: [
        { zip: '11215', latestRent: 4400, yoyChange: 0.058 },
        { zip: '11231', latestRent: 4200, yoyChange: 0.054 }
      ]
    },
    {
      name: 'Hoboken / Jersey City',
      borough: 'New Jersey',
      county: 'Hudson County',
      zips: ['07030', '07302', '07310'],
      commuteMin: 42,
      commuteMode: 'PATH / subway',
      notes: 'Across the Hudson with larger apartment inventory, offset by PATH transfers.',
      zoriLatestDate: model.metadata.zoriLatestDate,
      zoriBaseRent: 4200,
      zoriYoY: 0.047,
      transitPremium: 64,
      zipRentObservations: [
        { zip: '07030', latestRent: 4500, yoyChange: 0.049 },
        { zip: '07302', latestRent: 4300, yoyChange: 0.047 },
        { zip: '07310', latestRent: 3800, yoyChange: 0.045 }
      ]
    }
  ];

  function rounded(value: number, step = 1) {
    return Math.round(value / step) * step;
  }

  function buildModeledTierScenarios(neighborhood: any) {
    const countyCosts = model.countyCosts[neighborhood.county] ?? model.countyCosts['New York County'];
    const defaultReserveMonths = model.selectedDefaults.reserveMonths;
    const defaultEscalation = model.selectedDefaults.year2Escalation;

    return Object.fromEntries(
      model.lifestyleTiers.map((tier: any) => {
        const rent = rounded(neighborhood.zoriBaseRent * tier.rentFactor, 25);
        const food = rounded((countyCosts.foodAnnual / 12) * tier.foodFactor);
        const internetMobile = rounded((countyCosts.internetMobileAnnual / 12) * tier.internetMobileFactor);
        const personal = rounded(((countyCosts.civicAnnual + countyCosts.otherAnnual) / 12) * tier.personalFactor);
        const travel = rounded(tier.travelAnnual / 12);
        const transit = tier.transitMonthly + (neighborhood.transitPremium ?? 0);
        const monthlyLiving = rent + food + tier.utilitiesMonthly + internetMobile + personal + transit + travel;
        const movingCash = rent + tier.moveInSetup;
        const emergencyReserve = monthlyLiving * defaultReserveMonths;
        const tuition = rounded(model.nyuCosts.tuitionFeesAnnual * (2 + defaultEscalation));
        const insurance = rounded(model.nyuCosts.healthInsuranceAnnual * (2 + defaultEscalation));
        const living = rounded(monthlyLiving * 12 + monthlyLiving * (1 + defaultEscalation) * 12);
        const totalRequired = tuition + insurance + living + movingCash;
        const cashTarget = totalRequired + emergencyReserve;

        return [
          tier.label,
          {
            rent,
            food,
            utilities: tier.utilitiesMonthly,
            internetMobile,
            personal,
            transit,
            travel,
            monthlyLiving,
            movingCash,
            emergencyReserve,
            tuition,
            insurance,
            living,
            totalRequired,
            cashTarget
          }
        ];
      })
    );
  }

  model.neighborhoods = [
    ...model.neighborhoods,
    ...additionalPlannerNeighborhoods.map((neighborhood) => ({
      ...neighborhood,
      tiers: buildModeledTierScenarios(neighborhood)
    }))
  ];

  model.sources = [
    ...model.sources,
    {
      "id": "mit_hudson",
      "label": "MIT Living Wage Calculator - Hudson County",
      "url": "https://livingwage.mit.edu/counties/34017",
      "asOf": "2026-02-15",
      "notes": "Food, internet/mobile, civic, and other annual expense baselines for the Hoboken / Jersey City option."
    },
    {
      "id": "expanded_planner_areas",
      "label": "Expanded planner neighborhoods",
      "url": "Local model extension",
      "asOf": "2026-06-19",
      "notes": "Additional ZIP bundles were added to broaden Manhattan, Brooklyn, Queens, and New Jersey comparisons."
    }
  ];

  const mapboxToken = (import.meta.env.PUBLIC_MAPBOX_TOKEN ?? import.meta.env.VITE_MAPBOX_TOKEN) as string | undefined;
  const plannerMapAreas: PlannerMapAreaDefinition[] = [
    {
      name: 'Harlem / Washington Heights',
      shortName: 'Harlem',
      center: [-73.949, 40.837],
      coordinates: [
        [-73.9656, 40.8033],
        [-73.9534, 40.7986],
        [-73.9435, 40.8068],
        [-73.9364, 40.8216],
        [-73.9315, 40.8394],
        [-73.9235, 40.8562],
        [-73.9287, 40.8718],
        [-73.9448, 40.8784],
        [-73.9558, 40.8665],
        [-73.9634, 40.8451],
        [-73.9713, 40.8202],
        [-73.9656, 40.8033]
      ]
    },
    {
      name: 'Morningside Heights / Manhattanville',
      shortName: 'Morningside',
      center: [-73.961, 40.807],
      coordinates: [
        [-73.9738, 40.7928],
        [-73.9617, 40.7902],
        [-73.9502, 40.797],
        [-73.9456, 40.8094],
        [-73.9517, 40.8216],
        [-73.9634, 40.819],
        [-73.9714, 40.8073],
        [-73.9738, 40.7928]
      ]
    },
    {
      name: 'Upper West Side / Lincoln Square',
      shortName: 'UWS',
      center: [-73.979, 40.783],
      coordinates: [
        [-73.994, 40.7604],
        [-73.9818, 40.7562],
        [-73.9671, 40.7664],
        [-73.9583, 40.7856],
        [-73.9639, 40.8044],
        [-73.9786, 40.8124],
        [-73.9899, 40.795],
        [-73.9965, 40.7734],
        [-73.994, 40.7604]
      ]
    },
    {
      name: 'Upper East Side / Yorkville',
      shortName: 'UES',
      center: [-73.954, 40.777],
      coordinates: [
        [-73.9782, 40.7584],
        [-73.9632, 40.7548],
        [-73.944, 40.7637],
        [-73.9345, 40.7795],
        [-73.9364, 40.7937],
        [-73.9512, 40.804],
        [-73.9656, 40.7908],
        [-73.9748, 40.7712],
        [-73.9782, 40.7584]
      ]
    },
    {
      name: "Midtown / Hell's Kitchen",
      shortName: 'Midtown',
      center: [-73.993, 40.759],
      coordinates: [
        [-74.0111, 40.7505],
        [-73.9987, 40.7462],
        [-73.9824, 40.7497],
        [-73.9755, 40.7587],
        [-73.9819, 40.7682],
        [-73.994, 40.7735],
        [-74.0086, 40.7654],
        [-74.0111, 40.7505]
      ]
    },
    {
      name: 'Astoria / Long Island City',
      shortName: 'Astoria / LIC',
      center: [-73.931, 40.766],
      coordinates: [
        [-73.9626, 40.741],
        [-73.9474, 40.7345],
        [-73.9248, 40.7403],
        [-73.9077, 40.7518],
        [-73.9027, 40.7688],
        [-73.9101, 40.785],
        [-73.9276, 40.792],
        [-73.9443, 40.7847],
        [-73.9576, 40.7703],
        [-73.9632, 40.7522],
        [-73.9626, 40.741]
      ]
    },
    {
      name: 'Sunnyside / Woodside',
      shortName: 'Sunnyside',
      center: [-73.913, 40.744],
      coordinates: [
        [-73.936, 40.7322],
        [-73.9184, 40.7264],
        [-73.8966, 40.7334],
        [-73.8841, 40.7456],
        [-73.8917, 40.7579],
        [-73.9149, 40.7613],
        [-73.9333, 40.751],
        [-73.936, 40.7322]
      ]
    },
    {
      name: 'Chelsea / Flatiron',
      shortName: 'Chelsea',
      center: [-73.995, 40.745],
      coordinates: [
        [-74.0103, 40.7407],
        [-74.0033, 40.7369],
        [-73.9944, 40.7362],
        [-73.9834, 40.7388],
        [-73.9774, 40.7461],
        [-73.9877, 40.7527],
        [-74.0026, 40.7563],
        [-74.0102, 40.7493],
        [-74.0103, 40.7407]
      ]
    },
    {
      name: 'Greenwich Village / NoHo',
      shortName: 'Village',
      center: [-73.999, 40.728],
      coordinates: [
        [-74.0115, 40.7201],
        [-74.0028, 40.7172],
        [-73.9932, 40.7177],
        [-73.987, 40.7254],
        [-73.9905, 40.7348],
        [-74.0014, 40.7388],
        [-74.0098, 40.733],
        [-74.0115, 40.7201]
      ]
    },
    {
      name: 'East Village / Lower East Side',
      shortName: 'East Village',
      center: [-73.982, 40.719],
      coordinates: [
        [-73.9961, 40.7089],
        [-73.9869, 40.7067],
        [-73.9742, 40.7085],
        [-73.9637, 40.7153],
        [-73.9703, 40.7288],
        [-73.9842, 40.7338],
        [-73.9945, 40.7276],
        [-73.9961, 40.7089]
      ]
    },
    {
      name: 'Financial District / Tribeca',
      shortName: 'FiDi / Tribeca',
      center: [-74.01, 40.713],
      coordinates: [
        [-74.0193, 40.704],
        [-74.0118, 40.6997],
        [-74.0005, 40.7038],
        [-73.9951, 40.7133],
        [-73.9997, 40.722],
        [-74.0108, 40.7256],
        [-74.0197, 40.7162],
        [-74.0193, 40.704]
      ]
    },
    {
      name: 'Williamsburg / Greenpoint',
      shortName: 'Williamsburg',
      center: [-73.947, 40.724],
      coordinates: [
        [-73.969, 40.7044],
        [-73.9556, 40.7005],
        [-73.9407, 40.705],
        [-73.9286, 40.7136],
        [-73.9231, 40.7252],
        [-73.9292, 40.7389],
        [-73.9459, 40.742],
        [-73.9588, 40.7351],
        [-73.9668, 40.7221],
        [-73.9707, 40.7109],
        [-73.969, 40.7044]
      ]
    },
    {
      name: 'Downtown Brooklyn / Fort Greene',
      shortName: 'Downtown BK',
      center: [-73.989, 40.694],
      coordinates: [
        [-74.0142, 40.6864],
        [-74.006, 40.6802],
        [-73.9901, 40.68],
        [-73.9732, 40.6834],
        [-73.9613, 40.6918],
        [-73.9631, 40.7008],
        [-73.9772, 40.7048],
        [-73.9938, 40.7044],
        [-74.0096, 40.6978],
        [-74.016, 40.6925],
        [-74.0142, 40.6864]
      ]
    },
    {
      name: 'Park Slope / Gowanus',
      shortName: 'Park Slope',
      center: [-73.989, 40.672],
      coordinates: [
        [-74.0069, 40.6655],
        [-73.9984, 40.657],
        [-73.981, 40.6535],
        [-73.9682, 40.6628],
        [-73.9724, 40.6796],
        [-73.9869, 40.6881],
        [-74.0032, 40.6804],
        [-74.0069, 40.6655]
      ]
    },
    {
      name: 'Hoboken / Jersey City',
      shortName: 'Hoboken / JC',
      center: [-74.043, 40.728],
      coordinates: [
        [-74.0537, 40.6988],
        [-74.0376, 40.6997],
        [-74.0304, 40.7167],
        [-74.026, 40.7448],
        [-74.0344, 40.7584],
        [-74.0494, 40.7525],
        [-74.0586, 40.7278],
        [-74.0537, 40.6988]
      ]
    },
    {
      name: 'Bushwick / Ridgewood',
      shortName: 'Bushwick',
      center: [-73.913, 40.703],
      coordinates: [
        [-73.948, 40.6852],
        [-73.9342, 40.6784],
        [-73.9139, 40.681],
        [-73.8886, 40.6928],
        [-73.8705, 40.7045],
        [-73.8793, 40.719],
        [-73.9022, 40.7237],
        [-73.9268, 40.7208],
        [-73.9443, 40.7084],
        [-73.9524, 40.6944],
        [-73.948, 40.6852]
      ]
    },
    {
      name: 'Crown Heights / Prospect Lefferts',
      shortName: 'Crown Hts',
      center: [-73.948, 40.671],
      coordinates: [
        [-73.9706, 40.6808],
        [-73.9594, 40.6748],
        [-73.9579, 40.664],
        [-73.9659, 40.6535],
        [-73.9442, 40.6461],
        [-73.9238, 40.656],
        [-73.9164, 40.6689],
        [-73.9236, 40.6832],
        [-73.9466, 40.6909],
        [-73.963, 40.6868],
        [-73.9706, 40.6808]
      ]
    }
  ];

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

  const cardRootBase = 'nyu-motion-card min-w-0 max-w-full rounded-2xl border border-[var(--nyu-budget-line)] bg-white/78 shadow-[0_8px_24px_rgba(15,23,42,0.045)]';
  const buttonGroupBase = 'nyu-control-cluster inline-flex min-w-0 max-w-full items-center rounded-2xl border border-[var(--nyu-budget-track-line)] bg-[var(--nyu-budget-track)] p-1';
  const inputBase = 'nyu-soft-control min-h-8 w-full min-w-0 max-w-full rounded-xl border border-[var(--nyu-budget-control-border)] bg-white/90 px-2.5 py-1 text-[0.95rem] font-medium text-[var(--nyu-budget-ink)] shadow-[inset_0_0_0_1px_rgba(82,97,108,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors placeholder:text-[var(--nyu-budget-muted)] hover:border-[var(--nyu-budget-control-border-hover)] focus-visible:border-[rgba(69,107,145,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.15)]';
  const selectTriggerBase = 'nyu-soft-control flex min-h-8 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border border-[var(--nyu-budget-control-border)] bg-white/90 px-2.5 py-1 text-left text-[0.95rem] font-medium text-[var(--nyu-budget-ink)] shadow-[inset_0_0_0_1px_rgba(82,97,108,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors hover:border-[var(--nyu-budget-control-border-hover)] focus-visible:border-[rgba(69,107,145,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.15)]';
  const selectItemBase = 'nyu-button-motion flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[0.92rem] font-medium text-[var(--nyu-budget-ink)] transition-colors hover:bg-[var(--nyu-budget-track)] focus-visible:bg-[var(--nyu-budget-track)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[selected=true]:bg-[var(--nyu-budget-ink)] data-[selected=true]:text-white';
  const sliderRoot =
    'group relative flex h-7 w-full touch-none select-none items-center';
  const sliderInput =
    'absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none';
  const sliderTrack =
    'relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--nyu-budget-track)] shadow-[inset_0_0_0_1px_var(--nyu-budget-track-line)]';
  const sliderRange =
    'absolute h-full rounded-full bg-[var(--nyu-budget-ink)]';
  const sliderThumb =
    'nyu-slider-thumb pointer-events-none absolute top-1/2 z-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--nyu-budget-control-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18),0_0_0_4px_rgba(69,107,145,0.08)] transition-shadow group-focus-within:shadow-[0_1px_3px_rgba(15,23,42,0.18),0_0_0_5px_rgba(69,107,145,0.16)]';

  const actionButton =
    'nyu-button-motion rounded-xl px-2 text-[0.92rem] font-semibold text-[#51615f]';
  const actionButtonActive = 'bg-[var(--nyu-budget-ink)] font-semibold text-white';
  const lifestyleButton =
    'nyu-button-motion flex h-7 w-full items-center justify-center rounded-xl px-3 text-center text-[0.92rem] font-semibold text-[#51615f]';
  const linkButton =
    'nyu-button-motion inline-flex h-8 items-center justify-center rounded-xl border border-[var(--nyu-budget-line)] bg-white/80 px-3 py-0 text-[0.92rem] font-semibold text-[var(--nyu-budget-ink)] no-underline transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.25)]';
  const kpiCard =
    'nyu-kpi-card min-w-0 !rounded-2xl !border-[#e6edf3] !bg-white px-4 py-4 !shadow-[0_1px_3px_rgba(15,23,42,0.07)]';
  const kpiLabel =
    'mb-2 block min-w-0 truncate text-[0.7rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-muted)]';
  const kpiValue =
    'block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.55rem,2.65vw,2.7rem)] font-semibold leading-none tracking-[-0.02em] text-[var(--nyu-budget-ink)]';
  const panel = 'nyu-panel min-w-0 max-w-full rounded-[24px] border-[rgba(220,229,236,0.8)] bg-white/82 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.045)]';
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
  const subwayRouteColors: Record<string, { background: string; color: string }> = {
    A: { background: '#0039a6', color: '#ffffff' },
    C: { background: '#0039a6', color: '#ffffff' },
    E: { background: '#0039a6', color: '#ffffff' },
    B: { background: '#ff6319', color: '#ffffff' },
    D: { background: '#ff6319', color: '#ffffff' },
    F: { background: '#ff6319', color: '#ffffff' },
    M: { background: '#ff6319', color: '#ffffff' },
    G: { background: '#6cbe45', color: '#ffffff' },
    L: { background: '#a7a9ac', color: '#172026' },
    N: { background: '#fccc0a', color: '#172026' },
    Q: { background: '#fccc0a', color: '#172026' },
    R: { background: '#fccc0a', color: '#172026' },
    W: { background: '#fccc0a', color: '#172026' },
    '1': { background: '#ee352e', color: '#ffffff' },
    '2': { background: '#ee352e', color: '#ffffff' },
    '3': { background: '#ee352e', color: '#ffffff' },
    '4': { background: '#00933c', color: '#ffffff' },
    '5': { background: '#00933c', color: '#ffffff' },
    '6': { background: '#00933c', color: '#ffffff' },
    '7': { background: '#b933ad', color: '#ffffff' },
    Subway: { background: '#e7eef4', color: '#172026' },
    Walk: { background: '#e6f4ea', color: '#172026' }
  };

  let comparisonView = $state<ComparisonView>('map');
  let hoveredMapNeighborhood = $state<string | null>(null);
  let mapContainer = $state<HTMLDivElement | null>(null);
  let mapReady = $state(false);
  let mapError = $state<string | null>(mapboxToken ? null : 'Mapbox token missing');
  let mapboxMap: mapboxgl.Map | null = null;
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

  function campusDisplay(anchor: string) {
    if (anchor.includes('Washington Square')) return 'Washington Sq';
    return anchor;
  }

  function commuteRouteTokens(mode: string) {
    return mode
      .replace(/\s+subway$/i, '')
      .split('/')
      .map((route) => route.trim())
      .map((route) => (route.length === 1 ? route.toUpperCase() : `${route.charAt(0).toUpperCase()}${route.slice(1).toLowerCase()}`))
      .filter(Boolean);
  }

  function commuteBadgeClass(route: string) {
    const base = 'inline-flex h-6 shrink-0 items-center justify-center rounded-full font-semibold leading-none shadow-[inset_0_0_0_1px_rgba(23,32,38,0.16)]';
    if (route.length === 1) return `${base} w-6 text-[0.72rem]`;
    return `${base} max-w-full px-2.5 text-[0.68rem] whitespace-nowrap`;
  }

  function subwayBadgeStyle(route: string) {
    const color = subwayRouteColors[route] ?? { background: '#172026', color: '#ffffff' };
    return `background-color: ${color.background}; color: ${color.color};`;
  }

  function buildPlannerMapRows(items: any[]): PlannerMapRow[] {
    const itemByName = new Map(items.map((item: any) => [item.name, item]));
    const cashTargets = items.map((item: any) => item.cashTarget).filter((value: unknown): value is number => Number.isFinite(value));
    const minCash = Math.min(...cashTargets);
    const maxCash = Math.max(...cashTargets);
    const range = Math.max(1, maxCash - minCash);

    return plannerMapAreas
      .map((area) => {
        const item = itemByName.get(area.name);
        if (!item) return null;

        return {
          area,
          item,
          fill: cashTargetColor(item.cashTarget, minCash, minCash + range * 0.52, minCash + range)
        };
      })
      .filter((row): row is PlannerMapRow => Boolean(row));
  }

  function cashTargetColor(value: number, min: number, mid: number, max: number) {
    if (value <= mid) return interpolateHex('#dbeadf', '#d3b765', (value - min) / Math.max(1, mid - min));
    return interpolateHex('#d3b765', '#a6635f', (value - mid) / Math.max(1, max - mid));
  }

  function interpolateHex(start: string, end: string, amount: number) {
    const t = Math.max(0, Math.min(1, amount));
    const from = hexToRgb(start);
    const to = hexToRgb(end);
    const channel = (key: 'r' | 'g' | 'b') => Math.round(from[key] + (to[key] - from[key]) * t);
    return `rgb(${channel('r')}, ${channel('g')}, ${channel('b')})`;
  }

  function hexToRgb(hex: string) {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function buildPlannerMapGeoJson(rows: PlannerMapRow[]) {
    return {
      type: 'FeatureCollection',
      features: rows.map((row) => {
        const active = row.area.name === (hoveredMapNeighborhood ?? selectedNeighborhood);
        const selectedArea = row.area.name === selectedNeighborhood;
        return {
          type: 'Feature',
          id: row.area.name,
          properties: {
            name: row.area.name,
            shortName: row.area.shortName,
            rentLabel: money(row.item.scenario.rent),
            cashLabel: compactMoney(row.item.cashTarget),
            fill: row.fill,
            active,
            selected: selectedArea
          },
          geometry: {
            type: 'Polygon',
            coordinates: [row.area.coordinates]
          }
        };
      })
    };
  }

  function buildPlannerMapLabelGeoJson(rows: PlannerMapRow[]) {
    return {
      type: 'FeatureCollection',
      features: rows.map((row) => ({
        type: 'Feature',
        id: `${row.area.name}-label`,
        properties: {
          name: row.area.name,
          shortName: row.area.shortName,
          rentLabel: money(row.item.scenario.rent),
          cashLabel: compactMoney(row.item.cashTarget),
          selected: row.area.name === selectedNeighborhood
        },
        geometry: {
          type: 'Point',
          coordinates: row.area.center
        }
      }))
    };
  }

  function mapSource(id: string) {
    if (!mapboxMap) return null;
    return mapboxMap.getSource(id) as mapboxgl.GeoJSONSource | undefined;
  }

  function syncPlannerMapData() {
    if (!mapboxMap || !mapReady) return;
    mapSource('nyc-budget-areas')?.setData(plannerMapGeoJson as any);
    mapSource('nyc-budget-labels')?.setData(plannerMapLabelsGeoJson as any);
  }

  async function refreshVisiblePlannerMap() {
    if (comparisonView !== 'map' || !mapboxMap || !mapReady) return;
    await tick();
    mapboxMap.resize();
    syncPlannerMapData();
  }

  function fitPlannerMapToAreas() {
    if (!mapboxMap || !mapReady) return;
    const bounds = new mapboxgl.LngLatBounds();
    plannerMapAreas.forEach((area) => {
      area.coordinates.forEach((coordinate) => bounds.extend(coordinate));
    });
    mapboxMap.fitBounds(bounds, {
      padding: { top: 34, right: 34, bottom: 30, left: 34 },
      maxZoom: 10.85,
      duration: 0
    });
  }

  function flyToMapNeighborhood(name: string) {
    if (!mapboxMap || !mapReady) return;
    const area = plannerMapAreas.find((item) => item.name === name);
    if (!area) return;
    mapboxMap.easeTo({
      center: area.center,
      zoom: Math.max(mapboxMap.getZoom(), 11.4),
      duration: 520,
      essential: true
    });
  }

  function installPlannerMapLayers() {
    if (!mapboxMap) return;

    if (!mapboxMap.getSource('nyc-budget-areas')) {
      mapboxMap.addSource('nyc-budget-areas', {
        type: 'geojson',
        data: plannerMapGeoJson as any
      });
    }

    if (!mapboxMap.getSource('nyc-budget-labels')) {
      mapboxMap.addSource('nyc-budget-labels', {
        type: 'geojson',
        data: plannerMapLabelsGeoJson as any
      });
    }

    if (!mapboxMap.getLayer('nyc-budget-area-fill')) {
      mapboxMap.addLayer({
        id: 'nyc-budget-area-fill',
        type: 'fill',
        source: 'nyc-budget-areas',
        paint: {
          'fill-color': ['get', 'fill'],
          'fill-antialias': true,
          'fill-opacity': [
            'case',
            ['boolean', ['get', 'selected'], false],
            0.58,
            ['boolean', ['get', 'active'], false],
            0.52,
            0.36
          ]
        }
      });
    }

    if (!mapboxMap.getLayer('nyc-budget-area-halo')) {
      mapboxMap.addLayer({
        id: 'nyc-budget-area-halo',
        type: 'line',
        source: 'nyc-budget-areas',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'rgba(255,255,255,0.94)',
          'line-width': [
            'case',
            ['boolean', ['get', 'selected'], false],
            5.2,
            ['boolean', ['get', 'active'], false],
            4.4,
            3.4
          ],
          'line-opacity': [
            'case',
            ['boolean', ['get', 'selected'], false],
            0.9,
            0.72
          ]
        }
      });
    }

    if (!mapboxMap.getLayer('nyc-budget-area-line')) {
      mapboxMap.addLayer({
        id: 'nyc-budget-area-line',
        type: 'line',
        source: 'nyc-budget-areas',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['get', 'selected'], false],
            '#172026',
            ['boolean', ['get', 'active'], false],
            'rgba(23,32,38,0.72)',
            'rgba(23,32,38,0.48)'
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'selected'], false],
            2.2,
            ['boolean', ['get', 'active'], false],
            1.8,
            1.1
          ],
          'line-opacity': [
            'case',
            ['boolean', ['get', 'selected'], false],
            0.96,
            ['boolean', ['get', 'active'], false],
            0.86,
            0.64
          ]
        }
      });
    }

    if (!mapboxMap.getLayer('nyc-budget-area-labels')) {
      mapboxMap.addLayer({
        id: 'nyc-budget-area-labels',
        type: 'symbol',
        source: 'nyc-budget-labels',
        layout: {
          'text-field': ['format', ['get', 'shortName'], { 'font-scale': 1 }, '\n', {}, ['get', 'rentLabel'], { 'font-scale': 0.78 }],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9.5, 10.5, 12.5, 13],
          'text-line-height': 1.08,
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-padding': 4
        },
        paint: {
          'text-color': '#172026',
          'text-halo-color': 'rgba(255,255,255,0.92)',
          'text-halo-width': 1.5
        }
      });
    }

    if (!mapboxMap.getSource('nyu-campus')) {
      mapboxMap.addSource('nyu-campus', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { label: 'NYU' },
          geometry: { type: 'Point', coordinates: [-73.9965, 40.7295] }
        } as any
      });
    }

    if (!mapboxMap.getLayer('nyu-campus-dot')) {
      mapboxMap.addLayer({
        id: 'nyu-campus-dot',
        type: 'circle',
        source: 'nyu-campus',
        paint: {
          'circle-radius': 6,
          'circle-color': '#172026',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });
    }

    if (!mapboxMap.getLayer('nyu-campus-label')) {
      mapboxMap.addLayer({
        id: 'nyu-campus-label',
        type: 'symbol',
        source: 'nyu-campus',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-offset': [1.3, 0],
          'text-anchor': 'left'
        },
        paint: {
          'text-color': '#172026',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5
        }
      });
    }

    mapboxMap.on('click', 'nyc-budget-area-fill', (event) => {
      const feature = event.features?.[0];
      const name = feature?.properties?.name;
      if (typeof name !== 'string') return;
      selectedNeighborhood = name;
      hoveredMapNeighborhood = name;
      flyToMapNeighborhood(name);
    });
    mapboxMap.on('mousemove', 'nyc-budget-area-fill', (event) => {
      const feature = event.features?.[0];
      const name = feature?.properties?.name;
      if (typeof name !== 'string') return;
      hoveredMapNeighborhood = name;
      mapboxMap!.getCanvas().style.cursor = 'pointer';
    });
    mapboxMap.on('mouseleave', 'nyc-budget-area-fill', () => {
      hoveredMapNeighborhood = null;
      mapboxMap!.getCanvas().style.cursor = '';
    });
  }

  function comparisonTabClass(view: ComparisonView) {
    const active = comparisonView === view;
    return cn(
      'bg-transparent px-0 py-0.5 text-[0.82rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.18)]',
      active
        ? 'text-[var(--nyu-budget-ink)] shadow-[inset_0_-1px_0_var(--nyu-budget-ink)]'
        : 'text-[var(--nyu-budget-muted)] hover:text-[var(--nyu-budget-ink)]'
    );
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

  function buildYearlyCashflow(items: ReturnType<typeof buildMonthly>) {
    return [0, 1].map((yearIndex) => {
      const months = items.slice(yearIndex * 12, yearIndex * 12 + 12);
      const sum = (key: 'tuition' | 'insurance' | 'living' | 'moving' | 'totalOutflow') =>
        months.reduce((total, item) => total + item[key], 0);

      return {
        label: `Year ${yearIndex + 1}`,
        range: `${months[0]?.label ?? ''} - ${months[months.length - 1]?.label ?? ''}`,
        tuition: sum('tuition'),
        insurance: sum('insurance'),
        living: sum('living'),
        moving: sum('moving'),
        totalOutflow: sum('totalOutflow')
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
          ? `Aid, savings, income, reserve, and second-year cost increase are inside modeled ranges.`
          : `Review negative values, reserve months above 12, or second-year cost increase outside 0-10%.`
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
  let yearlyCashflow = $derived(buildYearlyCashflow(monthly));
  let commuteRoutes = $derived(commuteRouteTokens(neighborhood.commuteMode));
  let commuteDestination = $derived(campusDisplay(model.selectedDefaults.campusAnchor));
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
  let comparisonMin = $derived(Math.min(...comparison.map((item: any) => item.cashTarget)));
  let plannerMapRows = $derived(buildPlannerMapRows(comparison));
  let plannerMapGeoJson = $derived(buildPlannerMapGeoJson(plannerMapRows));
  let plannerMapLabelsGeoJson = $derived(buildPlannerMapLabelGeoJson(plannerMapRows));
  let activeMapRow = $derived(
    plannerMapRows.find((row) => row.area.name === (hoveredMapNeighborhood ?? selectedNeighborhood)) ??
      plannerMapRows.find((row) => row.area.name === selectedNeighborhood) ??
      plannerMapRows[0]
  );
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

  onMount(() => {
    if (!mapContainer || !mapboxToken) return;

    mapboxMap = new mapboxgl.Map({
      accessToken: mapboxToken,
      container: mapContainer,
      style: 'mapbox://styles/mapbox/standard',
      config: {
        basemap: {
          theme: 'monochrome'
        }
      },
      center: [-73.965, 40.735],
      zoom: 10.75,
      minZoom: 9.4,
      maxZoom: 15.2,
      maxBounds: [[-74.08, 40.6], [-73.8, 40.9]],
      attributionControl: false
    });

    mapboxMap.on('load', () => {
      mapReady = true;
      mapError = null;
      installPlannerMapLayers();
      syncPlannerMapData();
      fitPlannerMapToAreas();
    });
    mapboxMap.on('error', (event) => {
      mapError = event.error?.message ?? 'Mapbox could not load this map.';
    });
  });

  onDestroy(() => {
    mapboxMap?.remove();
    mapboxMap = null;
  });

  $effect(() => {
    plannerMapGeoJson;
    plannerMapLabelsGeoJson;
    syncPlannerMapData();
  });

  $effect(() => {
    comparisonView;
    void refreshVisiblePlannerMap();
  });
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
      class={cn(cardRootBase, 'nyu-control-card sticky top-4 grid min-w-0 gap-3 rounded-[26px] border-[rgba(220,229,236,0.8)] bg-white/74 px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] max-[980px]:static')}
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
              class="nyu-dropdown absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 min-w-0 overflow-auto rounded-2xl border border-[var(--nyu-budget-line)] bg-white/95 p-1 shadow-[0_18px_45px_rgba(15,23,42,0.13)] backdrop-blur"
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
        <label class={fieldLabel} for="escalation">Second-year cost increase</label>
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
            aria-label="Second-year cost increase"
            oninput={(event) => setNumber((value) => (year2Escalation = value), event)}
          />
        </div>
        <div class="text-sm font-semibold text-[var(--nyu-budget-ink)]">{percent.format(year2Escalation)}</div>
      </div>

      <div class="grid min-w-0 gap-2 border-t border-[#e1e6e3] pt-3 text-[0.82rem] text-[var(--nyu-budget-label)]">
        <div class="grid min-w-0 gap-0.5">
          <span class="text-[1.4rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--nyu-budget-ink)]">{neighborhood.commuteMin} min</span>
          <span class="min-w-0 text-[0.78rem] font-medium leading-tight">
            {neighborhood.borough} -> {commuteDestination}
          </span>
        </div>
        <div class="flex min-w-0 flex-wrap items-center gap-1.5" role="list" aria-label={`Subway routes: ${commuteRoutes.join(', ')}`}>
          {#each commuteRoutes as route}
            <span
              class={commuteBadgeClass(route)}
              role="listitem"
              style={subwayBadgeStyle(route)}
            >
              {route}
            </span>
          {/each}
        </div>
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
                    class={`nyu-breakdown-bar h-full rounded-[inherit] ${item.barClass}`}
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

      <div class={cn(cardRootBase, `${panel} overflow-hidden`)}>
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Monthly cashflow</h2>
          </div>
        </div>

        <div class="mb-3 grid min-w-0 gap-3 border-y border-[var(--nyu-budget-line-soft)] py-3 min-[760px]:grid-cols-2">
          {#each yearlyCashflow as year}
            <div class="min-w-0">
              <div class="flex min-w-0 items-baseline justify-between gap-3">
                <span class="min-w-0 text-[0.72rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-label)]">{year.label}</span>
                <strong class={`shrink-0 text-right text-[1.18rem] tabular-nums ${moneyValue}`}>{money(year.totalOutflow)}</strong>
              </div>
              <p class="m-0 mt-0.5 text-[0.8rem] leading-5 text-[var(--nyu-budget-muted)]">{year.range}</p>
              <dl class="m-0 mt-2 grid min-w-0 grid-cols-2 gap-x-3 gap-y-1 text-[0.78rem]">
                <div class="flex min-w-0 justify-between gap-2">
                  <dt class={`${mutedText} truncate`}>Tuition</dt>
                  <dd class={`m-0 shrink-0 tabular-nums ${moneyValue}`}>{compactMoney(year.tuition)}</dd>
                </div>
                <div class="flex min-w-0 justify-between gap-2">
                  <dt class={`${mutedText} truncate`}>Living</dt>
                  <dd class={`m-0 shrink-0 tabular-nums ${moneyValue}`}>{compactMoney(year.living)}</dd>
                </div>
                <div class="flex min-w-0 justify-between gap-2">
                  <dt class={`${mutedText} truncate`}>Insurance</dt>
                  <dd class={`m-0 shrink-0 tabular-nums ${moneyValue}`}>{compactMoney(year.insurance)}</dd>
                </div>
                <div class="flex min-w-0 justify-between gap-2">
                  <dt class={`${mutedText} truncate`}>Move-in</dt>
                  <dd class={`m-0 shrink-0 tabular-nums ${moneyValue}`}>{compactMoney(year.moving)}</dd>
                </div>
              </dl>
            </div>
          {/each}
        </div>

        <div class="max-[640px]:overflow-x-auto">
          <svg class="nyu-cashflow-chart h-auto min-h-[158px] w-full max-[640px]:min-w-[720px]" viewBox="0 0 760 220" role="img" aria-label="Monthly cashflow chart">
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
        </div>

        <div class="flex flex-wrap gap-2 text-[0.82rem] text-[var(--nyu-budget-muted)]">
          {#each monthly.filter((item) => item.isTuitionMonth) as item}
            <span class="border-l border-[#dce2df] pl-2">
              {item.label}: {compactMoney(item.totalOutflow)}
            </span>
          {/each}
        </div>
      </div>

      <div class={cn(cardRootBase, panel)}>
        <div class="mb-3 flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="m-0 text-lg font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)]">Neighborhood comparison</h2>
          </div>
          <div class="flex shrink-0 items-center gap-2.5" role="group" aria-label="Comparison view">
            <button
              aria-pressed={comparisonView === 'map'}
              class={comparisonTabClass('map')}
              type="button"
              onclick={() => (comparisonView = 'map')}
            >
              Map
            </button>
            <span class="text-[0.82rem] text-[#c7d0d6]" aria-hidden="true">/</span>
            <button
              aria-pressed={comparisonView === 'list'}
              class={comparisonTabClass('list')}
              type="button"
              onclick={() => (comparisonView = 'list')}
            >
              List
            </button>
          </div>
        </div>

        <div class={cn('nyu-view-pane min-w-0 gap-3', comparisonView === 'map' ? 'grid' : 'hidden')}>
            <div class="min-w-0">
              <div class="nyu-map-shell relative min-h-[430px] min-w-0 overflow-hidden rounded-[18px] border border-[var(--nyu-budget-line-soft)] bg-[#eef3f5]">
                <div
                  class="absolute inset-0"
                  class:opacity-0={Boolean(mapError)}
                  bind:this={mapContainer}
                  aria-label="New York City rent comparison map"
                ></div>
                {#if mapError}
                  <div class="relative z-10 grid min-h-[430px] place-items-center px-5 text-center">
                    <div class="max-w-sm">
                      <p class="m-0 text-[0.72rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-muted)]">Mapbox</p>
                      <p class="m-0 mt-2 text-[0.95rem] font-semibold text-[var(--nyu-budget-ink)]">{mapError}</p>
                    </div>
                  </div>
                {/if}
              </div>

              <div class="mt-3 grid min-w-0 grid-cols-[auto_minmax(140px,220px)_auto] items-center gap-2 text-[0.72rem] font-medium text-[var(--nyu-budget-muted)]">
                <span>{compactMoney(comparisonMin)}</span>
                <span class="h-1.5 rounded-full bg-[linear-gradient(90deg,#dbeadf,#d3b765,#a6635f)]"></span>
                <span class="text-right">{compactMoney(comparisonMax)}</span>
              </div>
            </div>

            {#if activeMapRow}
              <aside class="nyu-map-detail grid min-w-0 grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(96px,auto))] items-start gap-x-5 gap-y-2 border-t border-[var(--nyu-budget-line-soft)] pt-3 text-[0.84rem] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
                <div class="min-w-0">
                  <p class="m-0 mb-1 text-[0.7rem] font-semibold uppercase tracking-normal text-[var(--nyu-budget-muted)]">{activeMapRow.item.borough}</p>
                  <h3 class="m-0 text-[1.05rem] font-semibold leading-tight tracking-normal text-[var(--nyu-budget-ink)] [overflow-wrap:anywhere]">
                    {activeMapRow.item.name}
                  </h3>
                  <div class="mt-2 flex min-w-0 flex-wrap gap-1.5" aria-label={`${activeMapRow.item.name} ZIP codes`}>
                    {#each activeMapRow.item.zips as zip}
                      <span class="rounded-full bg-[var(--nyu-budget-track)] px-2 py-0.5 text-[0.72rem] font-semibold text-[var(--nyu-budget-label)]">{zip}</span>
                    {/each}
                  </div>
                </div>
                <dl class="contents">
                  <div class="grid gap-0.5">
                    <dt class={`${mutedText} truncate`}>Cash target</dt>
                    <dd class={`m-0 tabular-nums ${moneyValue}`}>{money(activeMapRow.item.cashTarget)}</dd>
                  </div>
                  <div class="grid gap-0.5">
                    <dt class={`${mutedText} truncate`}>Modeled rent</dt>
                    <dd class={`m-0 tabular-nums ${moneyValue}`}>{money(activeMapRow.item.scenario.rent)}</dd>
                  </div>
                  <div class="grid gap-0.5">
                    <dt class={`${mutedText} truncate`}>Monthly living</dt>
                    <dd class={`m-0 tabular-nums ${moneyValue}`}>{money(activeMapRow.item.scenario.monthlyLiving)}</dd>
                  </div>
                  <div class="grid gap-0.5">
                    <dt class={`${mutedText} truncate`}>Commute</dt>
                    <dd class={`m-0 tabular-nums ${moneyValue}`}>{activeMapRow.item.commuteMin} min</dd>
                  </div>
                  <div class="grid gap-0.5">
                    <dt class={`${mutedText} truncate`}>YoY rent</dt>
                    <dd class={`m-0 tabular-nums ${moneyValue}`}>{activeMapRow.item.zoriYoY === null ? 'n/a' : percent.format(activeMapRow.item.zoriYoY)}</dd>
                  </div>
                </dl>
              </aside>
            {/if}
        </div>

        <div class={cn('nyu-view-pane min-w-0', comparisonView === 'list' ? 'grid' : 'hidden')}>
            {#each comparison as item, index}
              {@const isCurrent = item.name === selectedNeighborhood}
              <button
                class={`nyu-list-row grid min-w-0 grid-cols-[28px_minmax(0,1fr)_minmax(70px,auto)_minmax(76px,auto)] items-center gap-3 bg-transparent px-0 py-2.5 text-left text-[0.9rem] text-[var(--nyu-budget-ink)] transition-colors hover:bg-[#f8fafc] focus-visible:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(69,107,145,0.16)] max-[640px]:grid-cols-[24px_minmax(0,1fr)_auto] ${isCurrent ? 'font-semibold' : ''}`}
                type="button"
                aria-current={isCurrent ? 'true' : undefined}
                onclick={() => (selectedNeighborhood = item.name)}
              >
                <span class="text-[0.72rem] font-semibold tabular-nums text-[var(--nyu-budget-muted)]">{index + 1}</span>
                <span class="grid min-w-0 gap-0.5">
                  <span class="min-w-0 [overflow-wrap:anywhere]">{item.name}</span>
                  <small class={`${mutedText} font-medium`}>{item.commuteMin} min · {item.borough}</small>
                </span>
                <span class="whitespace-nowrap text-right tabular-nums text-[var(--nyu-budget-label)] max-[640px]:hidden">{money(item.scenario.rent)}</span>
                <strong class={`whitespace-nowrap text-right tabular-nums ${moneyValue}`}>{compactMoney(item.cashTarget)}</strong>
              </button>
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
    --nyu-motion-fast: 140ms;
    --nyu-motion-medium: 240ms;
    --nyu-motion-slow: 520ms;
    --nyu-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --nyu-ease-standard: cubic-bezier(0.2, 0, 0, 1);
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

  .nyu-motion-card {
    animation: nyu-card-enter var(--nyu-motion-slow) var(--nyu-ease-out) both;
    transition:
      border-color var(--nyu-motion-medium) var(--nyu-ease-standard),
      box-shadow var(--nyu-motion-medium) var(--nyu-ease-standard),
      transform var(--nyu-motion-medium) var(--nyu-ease-standard),
      background-color var(--nyu-motion-medium) var(--nyu-ease-standard);
  }

  .nyu-panel,
  .nyu-control-card,
  .nyu-kpi-card {
    will-change: transform;
  }

  .nyu-control-cluster,
  .nyu-soft-control {
    transition:
      border-color var(--nyu-motion-fast) var(--nyu-ease-standard),
      box-shadow var(--nyu-motion-fast) var(--nyu-ease-standard),
      background-color var(--nyu-motion-fast) var(--nyu-ease-standard),
      transform var(--nyu-motion-fast) var(--nyu-ease-standard);
  }

  .nyu-soft-control:focus-visible,
  .nyu-soft-control:focus-within {
    transform: translateY(-1px);
  }

  .nyu-button-motion {
    transition:
      background-color var(--nyu-motion-fast) var(--nyu-ease-standard),
      color var(--nyu-motion-fast) var(--nyu-ease-standard),
      box-shadow var(--nyu-motion-fast) var(--nyu-ease-standard),
      transform var(--nyu-motion-fast) var(--nyu-ease-standard),
      opacity var(--nyu-motion-fast) var(--nyu-ease-standard);
  }

  .nyu-button-motion[aria-pressed='true'],
  .nyu-button-motion[data-selected='true'] {
    box-shadow: 0 1px 1px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .nyu-slider-thumb,
  .nyu-breakdown-bar,
  .nyu-cashflow-chart rect,
  .nyu-view-pane,
  .nyu-map-detail,
  .nyu-dropdown {
    will-change: transform, opacity;
  }

  .nyu-slider-thumb {
    transition:
      left var(--nyu-motion-medium) var(--nyu-ease-out),
      box-shadow var(--nyu-motion-fast) var(--nyu-ease-standard),
      transform var(--nyu-motion-fast) var(--nyu-ease-standard);
  }

  .nyu-breakdown-bar {
    transform-origin: left center;
    animation: nyu-scale-x 460ms var(--nyu-ease-out) both;
    transition: width var(--nyu-motion-slow) var(--nyu-ease-out);
  }

  .nyu-cashflow-chart rect {
    transform-box: fill-box;
    transform-origin: center bottom;
    animation: nyu-bar-rise 520ms var(--nyu-ease-out) both;
    transition:
      fill var(--nyu-motion-medium) var(--nyu-ease-standard),
      opacity var(--nyu-motion-medium) var(--nyu-ease-standard),
      transform var(--nyu-motion-medium) var(--nyu-ease-standard);
  }

  .nyu-cashflow-chart rect:nth-of-type(2n) {
    animation-delay: 20ms;
  }

  .nyu-cashflow-chart rect:nth-of-type(3n) {
    animation-delay: 40ms;
  }

  .nyu-view-pane {
    animation: nyu-pane-enter 280ms var(--nyu-ease-out) both;
  }

  .nyu-map-shell {
    transition:
      border-color var(--nyu-motion-medium) var(--nyu-ease-standard),
      box-shadow var(--nyu-motion-medium) var(--nyu-ease-standard),
      transform var(--nyu-motion-medium) var(--nyu-ease-standard);
  }

  .nyu-map-shell :global(.mapboxgl-canvas) {
    transition:
      filter var(--nyu-motion-medium) var(--nyu-ease-standard),
      opacity var(--nyu-motion-medium) var(--nyu-ease-standard);
  }

  .nyu-map-detail {
    animation: nyu-detail-enter 340ms var(--nyu-ease-out) both;
  }

  .nyu-list-row {
    border-radius: 12px;
    transition:
      background-color var(--nyu-motion-fast) var(--nyu-ease-standard),
      box-shadow var(--nyu-motion-fast) var(--nyu-ease-standard),
      color var(--nyu-motion-fast) var(--nyu-ease-standard),
      transform var(--nyu-motion-fast) var(--nyu-ease-standard);
  }

  .nyu-list-row[aria-current='true'] {
    background: rgba(248, 250, 252, 0.88);
    box-shadow: inset 2px 0 0 var(--nyu-budget-ink);
  }

  .nyu-dropdown {
    transform-origin: top center;
    animation: nyu-dropdown-enter 180ms var(--nyu-ease-out) both;
  }

  @media (hover: hover) and (pointer: fine) {
    .nyu-motion-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
    }

    .nyu-control-card:hover,
    .nyu-panel:hover,
    .nyu-kpi-card:hover {
      border-color: rgba(201, 213, 223, 0.92);
    }

    .nyu-button-motion:hover {
      transform: translateY(-1px);
    }

    .nyu-list-row:hover {
      transform: translateX(2px);
      box-shadow: inset 2px 0 0 rgba(23, 32, 38, 0.16);
    }

    .nyu-map-shell:hover {
      border-color: rgba(201, 213, 223, 0.96);
      box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }

    .nyu-map-shell:hover :global(.mapboxgl-canvas) {
      filter: saturate(1.04) contrast(1.02);
    }

    .nyu-cashflow-chart:hover rect:not(:hover) {
      opacity: 0.82;
    }
  }

  @keyframes nyu-card-enter {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes nyu-pane-enter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.995);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes nyu-detail-enter {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes nyu-dropdown-enter {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes nyu-scale-x {
    from {
      transform: scaleX(0.82);
      opacity: 0.74;
    }
    to {
      transform: scaleX(1);
      opacity: 1;
    }
  }

  @keyframes nyu-bar-rise {
    from {
      opacity: 0;
      transform: scaleY(0.72);
    }
    to {
      opacity: 1;
      transform: scaleY(1);
    }
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

  :global(.nyu-budget-model .mapboxgl-ctrl-logo) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.nyu-budget-model *),
    :global(.nyu-budget-model *::before),
    :global(.nyu-budget-model *::after) {
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 1ms !important;
    }

    .nyu-motion-card,
    .nyu-button-motion,
    .nyu-list-row,
    .nyu-map-shell,
    .nyu-soft-control {
      transform: none !important;
    }
  }
</style>
