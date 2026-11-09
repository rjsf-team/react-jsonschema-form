/** Runs the enclosing block with the process pinned to `timeZone`, restoring whatever it was afterwards. The date
 * widgets read and write in the reader's own zone, so a rule that holds in one hemisphere can be exactly wrong in the
 * other, and a test asserting on a rendered day only means something with a zone pinned under it.
 *
 * @param timeZone - The IANA zone to run the block in
 */
export default function pinTimeZone(timeZone: string) {
  const realTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = timeZone;
  });

  afterAll(() => {
    // `process.env.TZ = undefined` assigns the *string* `'undefined'`, which leaves the process running as UTC for
    // every later test file in this vitest worker
    if (realTZ === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = realTZ;
    }
  });
}
