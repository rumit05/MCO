// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/** @type {FunctionRunResult} */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */

  export function run(input) {
    const bundleLines = input.cart?.lines?.filter((line) => line.bundleAttribute && line.bundleAttribute.value) || [];

    const freeBundleLines = input.cart?.lines?.filter((line) => line.freeBundleAttribute && line.freeBundleAttribute.value) || [];

    /** @type {Record<string, number>} */
    const valueCounts = {};

    for (const line of bundleLines) {
      const value = line.bundleAttribute.value;
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    }

    const distinctCount = Object.keys(valueCounts).length;
    const counts = Object.values(valueCounts).map((c) => Number(c));
    const maxCount = counts.length ? Math.max(...counts) : 0;

    // find the bundleValue(s) that have maxCount
    const maxValueKeys = Object.entries(valueCounts).filter(([k, v]) => v === maxCount).map(([k]) => k);

    // filter lines that match one of those maxValueKeys
    const matchingLines = bundleLines.filter((line) => maxValueKeys.includes(line.bundleAttribute.value));

    const limitedLines = matchingLines.slice(0, maxCount).map((line) => ({
      id: line.id,
      bundleValue: line.bundleAttribute.value,
      price: Number(line.cost?.totalAmount?.amount || 0),
      quantity: line.quantity,
      merchandiseId: line.merchandise?.id, // <-- ADD THIS
    }));


    if (maxCount == 10) {
      const discounts = [];

      // 1️⃣ Free bundle line discount
      let freeLineId = null;
      if (freeBundleLines.length > 0) {
        const freeLine = freeBundleLines[0];
        if (freeLine?.id) {
          freeLineId = freeLine.id;
          discounts.push({
            targets: [{ cartLine: { id: freeLineId } }],
            value: { percentage: { value: 100 } },
            message: "GIFT WITH PURCHASE",
          });
        }
      }

      // 2️⃣ Lowest priced product in limitedLines discount
      // Exclude the free bundle line from lowest price calculation
      const eligibleLines = limitedLines.filter(line => line.id !== freeLineId);

      if (eligibleLines.length > 0) {
        const lowestLine = eligibleLines.reduce((prev, curr) =>
          curr.price < prev.price ? curr : prev
        );

        if (lowestLine?.id) {
          discounts.push({
            targets: [{ cartLine: { id: lowestLine.id } }],
            value: { percentage: { value: 100 } },
            message: "FREE",
          });
        }
      }


      // Return discounts if we have at least one
      if (discounts.length > 0) {
        return {
          discounts,
          discountApplicationStrategy: DiscountApplicationStrategy.All,
        };
      }
    }
    else if (maxCount >= 6 && maxCount < 10) {
      if (limitedLines.length > 0) {
        // Find the line with the lowest price
        const lowestLine = limitedLines.reduce((prev, curr) => curr.price < prev.price ? curr : prev);

        const target = {
          productVariant: {
            id: lowestLine.merchandiseId,
            quantity: 1, 
          },
        };
        const discountValue = 100;
        return {
          discounts: [
            {
              targets: [target],
              value: {
                percentage: {
                  value: discountValue,
                },
              },
              message: "FREE",
            },
          ],
          discountApplicationStrategy: DiscountApplicationStrategy.First,
        };

      }

    }
    else if (maxCount === 3) {
      if (limitedLines.length === 0) return EMPTY_DISCOUNT;

      // Calculate total price of all lines in the bundle
      const totalRegular = limitedLines.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const targetSetPrice = 15;
      let discountPct = ((totalRegular - targetSetPrice) / totalRegular) * 100;
      discountPct = Math.min(discountPct, 100); // cap at 100%

      if (limitedLines.length === 0) return EMPTY_DISCOUNT;

      const discounts = [
        {
          targets: limitedLines.map((line) => ({ cartLine: { id: line.id } })),
          value: { percentage: { value: discountPct } },
          message: "3 for $15 deal",
        },
      ];

      return {
        discounts,
        discountApplicationStrategy: DiscountApplicationStrategy.First,
      };
    }

    else {
      // console.log("some other count", distinctCount, maxCount, limitedLines);
    }

    return EMPTY_DISCOUNT;
  }