import { expect } from "chai";
import { is24HourFormatWithMilli } from "../src/components/widgets/TimeWidget";

describe("Time Regular Expression Tests", () => {
  describe("is24HourFormatWithMilli", () => {
    it("should not render if next props are equivalent", () => {
      expect(is24HourFormatWithMilli.test("2018-01-01T08:00:00.000Z:")).eql(
        false
      );
      expect(is24HourFormatWithMilli.test("14:")).eql(false);
      expect(is24HourFormatWithMilli.test("invalid")).eql(false);
      expect(is24HourFormatWithMilli.test("14:35")).eql(true);
      expect(is24HourFormatWithMilli.test("14:35:13")).eql(true);
      expect(is24HourFormatWithMilli.test("14:35:13.123")).eql(true);
    });
  });
});
